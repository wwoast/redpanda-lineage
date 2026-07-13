/** 
 * Types in redpandafinder, ordered from minor property types, to major
 * objects
 */

declare enum SupportedLanguages {
  en,
  es,
  ja,
  ko,
  ne,
  pt,
  zh
}

type Language = keyof typeof SupportedLanguages

type EntityType = "panda" | "wild" | "zoo"

type Gender = "f" | "m" | "unknown"

/** 
 * -1 is unknown
 *
 *  1 is Ailurus fulgens fulgens
 *
 *  2 is Ailurus fulgens styani
 */
type Species = "-1" | "1" | "2"

/** All pandas may have a single primary name, in each supported language */
type PandaNameByLanguage = {
  [L in Language]?: string;
}

/** Nicknames for pandas, in each of our supported languages */
type PandaNicknamesByLanguage = {
  [L in Language]?: string[];
}

/** Searchable alternate names for pandas, in all the supported languages */
type PandaOthernamesByLanguage = {
  [L in Language]?: string[];
}

/** 
 * Photos in the entity files start with `photo.\d+` and the URL of the photo,
 * but other fields exist with that field name as a prefix.
 */
type Photo = {
  /** 
   * The `photo.\d+\.author` field in the text files. Typically the Instagram
   * username of the original photographer, but it can be a full name as well.
   */
  author: string,
  /**
   * YYYY/MM/DD representing the day this photo was added to redpandafinder,
   * for the sake of showing the most recent photos on the front page.
   */
  commitdate: string,
  /**
   * When clicking the author's name in redpandafinder, we attempt to link
   * to the original social media post this photo was sourced from. This can be
   * any http URL but is typically a pseudo-URL such as `ig://<locator>`.
   */
  source: string,
  /** Classification tags to make this photo easier to search for later */
  tags: string[],
  /** 
   * The photo URL is either a direct http link, a cwdc link representing
   * self-hosted photo thumbnails, or (legacy/broken) an Instagram locator
   * pointing at a URL that serves a small image thumbnail.
   */
  url: string
}

/** 
 * Use Browser canvas features to introspect on the size of particular images,
 * and then adjust how panda or zoo information is displayed.
 */
type PhotoOrientation = "landscape" | "portrait" | "square"

/**
 * The `location.\d+` fields in `pandas/<country>/<zoo>/<id_name.txt>` files.
 * These are notated as comma-separated pairs with a numeric string zoo ID,
 * and the arrival date for the animal at that particular zoo. Occasionally
 * this information is a "best guess".
 */
type PandaLocation = {
  /** 
   * The arrival date for a panda at a particular zoo. For zoos, this is a
   * exact YYYY/MM/DD date, or sometimes, a best guess to the 1st of the month.
   * For wild animals, this string is made more vague, down to YYYY/Season.
   * Wild-captured zoo animals will have a mix of wild arrival dates and zoo
   * arrival dates.
   */
  arrivalDate: string,
  zoo: string
}

/**
 * The typescript representation of the text contents of 
 * `pandas/<country>/<zoo>/<id_name.txt>` files with a `[panda]` header.
 * 
 * On disk these are text files in the `.ini` format, intended to be easily
 * written or modified manually, in a text editor.
 * 
 * In converting to Typescript, we use the language values as keys rather than
 * as prefixes. So when reading the file, `en.name` and `ja.name` get processed
 * into a `PandaNames` object, indexed by SupportedLanguages _en_ and _ja_.
 */
interface EntityPanda {
  /** Numeric fixed identifier that we increment each time a panda is added */
  _id: string,
  /** YYYY/MM/DD birthday string */
  birthday: string,
  /** Birthplace is the numeric string ID for where the animal was born */
  birthplace: string,
  /** Numeric string ids for any children of this animal */
  children: string[],
  /**
   * YYYY/MM/DD representing the day this panda was added to redpandafinder,
   * for the sake of showing newly-added pandas on the front page.
   */
  commitdate: string,
  /** YYYY/MM/DD date of the animal's passing */
  death?: string,
  /**
   * Language order for how to prioritize displaying names when the current
   * display language doesn't have information for this animal. The insertion
   * order into the set reflects the order of the `language.order` values
   */
  languageOrder: Set<Language>,
  /** Animals born in the same litter as this one, by numeric string ID */
  litter: string,
  /** List from oldest to newest, of zoo locations the panda has lived at */
  location: PandaLocation[], 
  /** 
   * Primary name for this animal, in each language. These tend to be direct
   * translations, but occasionally animals are renamed when they change zoos.
   * In this case, we try and use the primary name people in each language
   * community would know the animal by.
   */
  name: PandaNameByLanguage,
  /** 
   * Cute nicknames that fans might know this animal by. You cannot search for
   * these names in the redpandafinder search form.
   */
  nicknames: PandaNicknamesByLanguage,
  /** 
   * Previous names, or commonly used names for this panda. These _are_
   * searchable in the redpandafinder search form.
   */
  othernames: PandaOthernamesByLanguage,
  /** A panda likely has some set of photos and attributions */
  photos: Photo[],
  /** 
   * Official zoo records often track animals by a studbook identifier. This
   * isn't necessarily surfaced in redpandafinder, but the recordkeeping tracks
   * it in the event data ingestion is better automated at some point.
   */
  studbookId: string,
  /** 
   * A type discriminator so that we can reason about whether this is an
   * entity that represents a panda living in a zoo, a zoo, or a wild-seen
   * location. This corresponds to an .ini file's first `[header]` line.
   */
  type: EntityType,
  /** Freetext describing possible accuracy errors for this animal */
  uncertainty?: string,
  /** 
   * The wild identifier (a `wild.\d+` string ID) that indicates the region a
   * wild red panda was witnessed at.
   */
  wild?: string
  /** The zoo identifier (a numeric string ID) the animal currently lives at */
  zoo?: string
}

/** All zoos record their street address, in each supported language */
type AddressByLanguage = {
  [L in Language]?: string;
}
/** All zoos record a city/state/province/country summary, in each language */
type LocationByLanguage = {
  [L in Language]?: string;
}
/** All zoos or wild locations may have a single primary name per language */
type PlaceNameByLanguage = {
  [L in Language]?: string;
}
/** Alternate names for zoos, in all the supported languages */
type ZooOthernamesByLanguage = {
  [L in Language]?: string[];
}

/**
 * The typescript representation of the text contents of 
 * `zoos/<country>/<id_name.txt>` files, with a `[zoo]` header.
 * 
 * On disk these are text files in the `.ini` format, intended to be easily
 * written or modified manually, in a text editor.
 * 
 * In converting to Typescript, we use the language values as keys rather than
 * as prefixes. So when reading the file, `en.name` and `ja.name` get processed
 * into a `PandaNames` object, indexed by SupportedLanguages _en_ and _ja_.
 */
interface EntityZoo {
  /** Numeric fixed identifier that we increment each time a zoo is added */
  _id: string,
  /** Street address string, represented in our supported languages */
  address: AddressByLanguage,
  /** When a zoo closes permanently, we record the date in YYYY/MM/DD format */
  closed: string,
  /**
   * YYYY/MM/DD representing the day this zoo was added to redpandafinder,
   * for the sake of showing newly-added zoos on the front page.
   */
  commitdate: string,
  /** 
   * Country or locality for this zoo, which keys into a possible flag
   * value in `language.js#Language.L.flags.
   */
  flag: string,
  /**
   * Language order for how to prioritize displaying names when the current
   * display language doesn't have information for this animal. The insertion
   * order into the set reflects the order of the `language.order` values
   */
  languageOrder: Set<Language>,
  /**
   * The latitude of the zoo, for determining whether a zoo is close to the
   * redpandafinder user with browser LocationServices.
   */
  latitude: string,
  /** 
   * A short string summarizing what city / state / province / country a
   * zoo is located in, in our supported languages.
   */
  location: LocationByLanguage,
  /**
   * The longitude of the zoo, for determining whether a zoo is close to the
   * redpandafinder user with browser LocationServices.
   */
  longitude: string,
  /** URL representing this zoo in Google Maps */
  map: string,
  /** Each zoo has a single primary name per supported language */
  name: PlaceNameByLanguage,
  /** A zoo likely has some set of photos and attributions */
  photos: Photo[],
  /** 
   * A type discriminator so that we can reason about whether this is an
   * entity that represents a panda living in a zoo, a zoo, or a wild-seen
   * location. This corresponds to an .ini file's first `[header]` line.
   */
  type: EntityType,
  /** URL to the website for this zoo */
  website: string,
}

/**
 * The typescript representation of the text contents of 
 * `wild/<country>/<id_name.txt>` files, with a `[wild]` header. In the
 * redpandafinder interface, these are required to have similar information
 * as a zoo location.
 * 
 * On disk these are text files in the `.ini` format, intended to be easily
 * written or modified manually, in a text editor.
 * 
 * In converting to Typescript, we use the language values as keys rather than
 * as prefixes. So when reading the file, `en.name` and `ja.name` get processed
 * into a `PandaNames` object, indexed by SupportedLanguages _en_ and _ja_.
 */
interface EntityWild {
  /** 
   * Numeric fixed identifier that we increment for each place a wild panda
   * has been documented by science.
   */
  _id: string,
  /** A stub address to match what similar zoo addresses strings look like */
  address: AddressByLanguage
  /** A stub location to match what similar zoo location strings look like */
  location: LocationByLanguage,
  /** Each wild sighting location has a single primary name per language */
  name: PlaceNameByLanguage,
  /** Website representing the location this animal was seen */
  website: string,
}