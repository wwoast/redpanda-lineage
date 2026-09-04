import { IniMap } from '@std/ini/ini-map'
import { basename } from '@std/path'
import { Paths,
         entityTypeFromFileName,
         existsFileSync } from './shared.ts'

/** 
 * Classes for working with photos stored in the raw redpandafinder `ini`
 * format files.
 */

/** 
 * Represents all properties of a photo entry in a file. Intended as a better
 * way to track whether photos are new or not, but also used for panda info
 * for individual photo samples.
 * 
 * In the `dataset.ts` Updates class, files are read line by line, and added to
 * photo entities based on their locator ID (<entity_id>.photo.<photo_id>).
 * The UpdateFromCommits class uses a map of locator ID to photo, to make
 * accurate counts of new photos, new entities, and new contributors.
 * 
 * In the `manage.ts` `restoreAuthorToLineage` code, when restoring photos by a
 * particular author, this class is used but values are set one by one, from
 * patches between two files in git.
 */
export interface PhotoEntry {
  authorName: string
  entityCommitDate: string
  entityId: string
  entityType: Exclude<NodeType, "none">
  filename: string
  ini: IniMap
  photoCommitDate: string
  photoIndex: number
  photoUri: string
  species: string
}
export class PhotoEntry {
  constructor() {
    this.ini = new IniMap({assignment: ":"})
  }
  /** Entity locator to track which animals have photos or not */
  entityLocator() {
    return `${this.entityType}.${this.entityId}`
  }
  /** 
   * Read a raw line of config for a photo, and populate it from the current
   * `.txt` INI-format files on disk
   */
  fromFile(filename: string, raw: string) {
    this.filename = filename
    this.#readUpdatedEntityId(raw)
  }
  /** Photo locator unique to a given entity */
  photoLocator() {
    return `${this.entityLocator()}.photo.${this.photoIndex}`
  }
  /** Clear the ini map between entity reads */
  #ingest() {
    const ingest =
      this.ini.parse(Deno.readTextFileSync(this.filename)).toObject()
    this.ini.clear()
    return ingest
  }
  /** Process the raw line into all photo-specific metadata */
  // TODO: simplify code / entity type decisions / ingest[type]
  #readUpdatedEntityId(raw: string) {
    const key = raw.slice(0, raw.indexOf(":"))
    const photoUri = raw.slice(key.length)
    const photoIndex = key.slice(key.indexOf(".") + 1)
    // Fallback to filename id number and path for the entity details, in case
    // we need to refer to some file that was moved in a previous commit
    if (!existsFileSync(this.filename)) {
      this.entityType = entityTypeFromFileName(this.filename)
      // Take id from the filename, and eat the leading zeroes
      this.entityId = basename(this.filename).split("_")[0].replace(/^0+/, "")
      return
    }
    if (this.filename.includes(Paths.media)) {
      const ingest = this.#ingest() as Record<"media", Record<string, string>>
      const entity = ingest.media._id
      this.entityType = "media"
      this.entityId = entity.slice(this.entityType.length + 1)   // up to the first .
      this.entityCommitDate = ingest.media.commitdate
      this.authorName = ingest.media[`${key}.author`]
      this.photoCommitDate = ingest.media[`${key}.commitdate`]
      this.photoIndex = parseInt(photoIndex)
      this.photoUri = photoUri
    } else if (this.filename.includes(Paths.pandas)) {
      const ingest = this.#ingest() as Record<"panda", Record<string, string>>
      this.entityType = "panda"
      this.entityId = ingest.panda._id
      this.entityCommitDate = ingest.panda.commitdate
      this.authorName = ingest.panda[`${key}.author`]
      this.photoCommitDate = ingest.panda[`${key}.commitdate`]
      this.photoIndex = parseInt(photoIndex)
      this.photoUri = photoUri
      this.species = ingest.panda.species
    } else if (this.filename.includes(Paths.wilds)) {
      const ingest = this.#ingest() as Record<"wild", Record<string, string>>
      const entity = ingest.wild._id
      this.entityType = "wild"
      this.entityId = entity.slice(this.entityType.length)
      this.entityCommitDate = ingest.wild.commitdate
      this.authorName = ingest.wild[`${key}.author`]
      this.photoCommitDate = ingest.wild[`${key}.commitdate`]
      this.photoIndex = parseInt(photoIndex)
      this.photoUri = photoUri
    } else if (this.filename.includes(Paths.zoos)) {
      const ingest = this.#ingest() as Record<"zoo", Record<string, string>>
      this.entityType = "zoo"
      this.entityId = ingest.zoo._id
      this.entityCommitDate = ingest.zoo.commitdate
      this.authorName = ingest.zoo[`${key}.author`]
      this.photoCommitDate = ingest.zoo[`${key}.commitdate`]
      this.photoIndex = parseInt(photoIndex)
      this.photoUri = photoUri
    } else {
      console.error(`[photos] ERR: Not a known entity type: ${this.entityType}`)
      console.error(raw)
    }
  }
}
