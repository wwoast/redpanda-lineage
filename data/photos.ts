import { IniMap } from '@std/ini/ini-map'
import { Paths, existsFileSync } from './shared.ts'

/** 
 * Classes for working with photos stored in the raw redpandafinder `ini`
 * format files.
 */

/** 
 * Represents all properties of a photo entry in a file. Intended as a better
 * way to track whether photos are new or not, but also used for panda info
 * for individual photo samples.
 *
 * In the `build.ts` Updates class, files are read line by line, and added to
 * photo entities based on their locator ID (<entity_id>.photo.<photo_id>).
 * The UpdateFromCommits class uses a map of locator ID to photo, to make
 * accurate counts of new photos, new entities, and new contributors.
 */
export interface PhotoEntry {
  authorName: string
  entityCommitDate: string
  entityId: string
  entityType: "media" | "panda" | "wild" | "zoo"
  filename: string
  photoCommitDate: string
  photoIndex: number
  photoUri: string
  species: string
}
export class PhotoEntry {
  /** Read a raw line of config for a photo */
  constructor(filename: string, raw: string) {
    this.filename = filename
    this.#readUpdatedEntityId(raw)
  }
  /** Entity locator to track which animals have photos or not */
  entityLocator() {
    return `${this.entityType}.${this.entityId}`
  }
  /** Photo locator unique to a given entity */
  photoLocator() {
    return `${this.entityLocator()}.photo.${this.photoIndex}`
  }
  /** Process the raw line into all photo-specific metadata */
  #readUpdatedEntityId(raw: string) {
    const key = raw.slice(0, raw.indexOf(":"))
    const photoUri = raw.slice(key.length)
    const photoIndex = key.slice(key.indexOf(".") + 1)
    // Fallback to filename id number and path for the entity details, in case
    // we need to refer to some file that was moved in a previous commit
    if (!existsFileSync(this.filename)) {
      this.entityType = this.filename.includes(Paths.media)
        ? "media"
        : this.filename.includes(Paths.wilds)
        ? "wild"
        : this.filename.includes(Paths.zoos)
        ? "zoo"
        : "panda"
      // Take id from the filename, and eat the leading zeroes
      this.entityId = this.filename.split("/")[-1].split("_")[0].replace(/^0+/, "")
      return
    }
    const ini = new IniMap({assignment: ":"})
    if (this.filename.includes(Paths.media)) {
      const ingest = ini.parse(
        Deno.readTextFileSync(this.filename)
      ).toObject() as Record<"media", Record<string, string>>
      const entity = ingest.media._id
      this.entityType = "media"
      this.entityId = entity.slice(this.entityType.length)
      this.entityCommitDate = ingest.media.commitdate
      this.authorName = ingest.media[`${key}.author`]
      this.photoCommitDate = ingest.media[`${key}.commitdate`]
      this.photoIndex = parseInt(photoIndex)
      this.photoUri = photoUri
    } else if (this.filename.includes(Paths.pandas)) {
      const ingest = ini.parse(
        Deno.readTextFileSync(this.filename)
      ).toObject() as Record<"panda", Record<string, string>>
      this.entityType = "panda"
      this.entityId = ingest.panda._id
      this.entityCommitDate = ingest.panda.commitdate
      this.authorName = ingest.panda[`${key}.author`]
      this.photoCommitDate = ingest.panda[`${key}.commitdate`]
      this.photoIndex = parseInt(photoIndex)
      this.photoUri = photoUri
      this.species = ingest.panda.species
    } else if (this.filename.includes(Paths.wilds)) {
      const ingest = ini.parse(
        Deno.readTextFileSync(this.filename)
      ).toObject() as Record<"wild", Record<string, string>>
      const entity = ingest.wild._id
      this.entityType = "wild"
      this.entityId = entity.slice(this.entityType.length)
      this.entityCommitDate = ingest.wild.commitdate
      this.authorName = ingest.wild[`${key}.author`]
      this.photoCommitDate = ingest.wild[`${key}.commitdate`]
      this.photoIndex = parseInt(photoIndex)
      this.photoUri = photoUri
    } else if (this.filename.includes(Paths.zoos)) {
      const ingest = ini.parse(
        Deno.readTextFileSync(this.filename)
      ).toObject() as Record<"zoo", Record<string, string>>
      this.entityType = "zoo"
      this.entityId = ingest.zoo._id
      this.entityCommitDate = ingest.zoo.commitdate
      this.authorName = ingest.zoo[`${key}.author`]
      this.photoCommitDate = ingest.zoo[`${key}.commitdate`]
      this.photoIndex = parseInt(photoIndex)
      this.photoUri = photoUri
    } else {
      console.error(`ERR: PhotoEntry: Not a known entity type: ${this.entityType}`)
      console.error(raw)
    }
  }
}
