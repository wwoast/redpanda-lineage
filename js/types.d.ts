/** 
 * Types in redpandafinder, organized in order from minor property types, to
 * larger principal objects that employ those property types.
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

/** 
 * Photos may be rendered for a handful of different `EntityObject` interfaces
 * in RPF, such as `EntityPanda`, `EntityWild`, and `EntityZoo`. These entities
 * use the `type` property as a discriminator, so code can easily understand
 * what kind of entity the photos are for.
 */
type EntityType = "panda" | "wild" | "zoo"

/** Gender values in the underlying panda `.ini` text files */
type Gender = "f" | "m" | "unknown"

/** 
 * Species values from the underlying panda `.ini` text files:
 * 
 * -1 is _unknown_ / just Ailurus fulgens
 *
 *  1 is Ailurus fulgens fulgens
 *
 *  2 is Ailurus fulgens styani
 */
type Species = "-1" | "1" | "2"

/** All pandas may have a single primary name, in each supported language */
type NameByLanguage = {
  [L in Language]?: string;
}

/** Nicknames for pandas or zoos, in each of our supported languages */
type NicknamesByLanguage = {
  [L in Language]?: string[];
}

/** Searchable alternate names for pandas or zoos, in a supported language */
type OthernamesByLanguage = {
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
  /** The numeric string zoo ID the `PandaLocation` arrival date refers to */
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
  name: NameByLanguage,
  /** 
   * Cute nicknames that fans might know this animal by. You cannot search for
   * these names in the redpandafinder search form.
   */
  nicknames: NicknamesByLanguage,
  /**
   * Previous names, or commonly used names for this panda. These _are_
   * searchable in the redpandafinder search form.
   */
  othernames: OthernamesByLanguage,
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
  type: "panda",
  /** Freetext describing possible accuracy errors for this animal */
  uncertainty?: string,
  /** 
   * The wild identifier (a `wild.\d+` string ID) that indicates the region a
   * wild red panda was witnessed at. Any given panda indicates its current
   * location either with a single `wild` property or a single `zoo` property.
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
  name: NameByLanguage,
  /** 
   * A type discriminator so that we can reason about whether this is an
   * entity that represents a panda living in a zoo, a zoo, or a wild-seen
   * location. This corresponds to an .ini file's first `[header]` line.
   */
  type: "wild",
  /** Website representing the location this animal was seen */
  website: string,
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
  name: NameByLanguage,
  /**
   * Previous names, or commonly used names for this zoo. These _are_
   * searchable in the redpandafinder search form.
   */
  othernames: OthernamesByLanguage,
  /** A zoo likely has some set of photos and attributions */
  photos: Photo[],
  /** 
   * A type discriminator so that we can reason about whether this is an
   * entity that represents a panda living in a zoo, a zoo, or a wild-seen
   * location. This corresponds to an .ini file's first `[header]` line.
   */
  type: "zoo",
  /** URL to the website for this zoo */
  website: string,
}

/** 
 * Panda results are an enrichment of the panda entity info tracked in the
 * Dagobah graph.
 * 
 * TODO: use local storage language to avoid the get_name
 */
interface ResultPanda {
  /** 
   * String describing the panda's age. Birthdates are not more granular than
   * one day of accuracy, so the calculations track number of days. Prior to
   * two years old, the age also tracks number of months as well. 
   */
  age: string,
  /**
   * Birthday string with years, months, and days, formatted to a locale based
   * on the `Pandas.def.date` value in `pandas.js`, and falling back to an
   * _unknown_ default value.
   */
  birthday: string,
  /** Resolve the birthplace numeric string ID to a full `EntityZoo` */
  birthplace: EntityZoo,
  /** Reoslve the children numeric string IDs to an `EntityPanda` set */
  children: Set<EntityPanda>,
  /**
   * Death string with years, months, and days, formatted to a locale based
   * on the `Pandas.def.date` value in `pandas.js`, and falling back to an
   * _unknown_ default value.
   */
  death: string,
  /** Resolve the father's numeric string ID to a full `EntityPanda` */
  dad: EntityPanda,
  /** Translated string for the animal's gender (or unknown) */
  gender: string,
  /** The numeric string ID for the `ResultPanda` animal */
  id: string,
  /** The current display language of this result */
  language: Language,
  /**
   * Language order for how to prioritize displaying names when the current
   * display language doesn't have information for this animal. The insertion
   * order into the set reflects the order of the `language.order` values
   */
  languageOrder: Set<Language>,
  /** Resolve the litter mates numeric string IDs to an `EntityPanda` set */
  litter: Set<EntityPanda>,
  /** Resolve the mother's numeric string ID to a full `EntityPanda` */
  mom: EntityPanda,
  /** The panda's primary name, in the current display language */
  name: string,
  /** The panda's other names, in the current display language */
  othernames: string[],
  /** The URL of the photo being displayed in this panda's result card */
  photo: string,
  /** The author (Instagram username or full name) of the photo */
  photoCredit: string,
  /** The numeric index for this photo in the list of the animal's photos */
  photoIndex: number,
  /** The link to the original source of this photo */
  photoLink: string,
  /** 
   * A manifest of all possible photo URLs for this animal, indexed by the
   * string `photo.\d+` similar to the underlying panda `.ini` text files.
   */
  photoManifest: Record<string, string>,
  /** 
   * Some panda searches enrich the result vertexes with info about the
   * original search condition that discovered that vertex. TODO: there isn't
   * a consistent format for these objects.
   */
  searchContext: Record<string, any>
  /** 
   * Resolve the numeric string IDs of all siblings of this animal who are not
   * immediate litter-mates, into a set of `EntityPanda` organized from oldest
   * to youngest. This will include half-siblings.
   */
  siblings: Set<EntityPanda>,
  /** The language-translated species name for this red panda */
  species: string,
  /** 
   * If the panda lives in the wild, resolve its current location into an
   * `EntityWild` object.
   */
  wild: EntityWild,
  /** If the panda lives at a zoo, resolve its location into an `EntityZoo` */
  zoo: EntityZoo
}

/** 
 * Zoo results are an enrichment of the zoo entity info tracked in the Dagobah
 * graph.
 * 
 * TODO: use local storage language to avoid the get_name
 */
interface ResultZoo {
  /** The address of this zoo, translated into the current display language. */
  address: string,
  /** The number of animals currently living at this zoo */
  animalCount: number,
  /** 
   * The set of all pandas resolved from their numeric string entity ID,
   * that currently live at this zoo.
   */
  animals: Set<EntityPanda>,
  /** The YYYY/MM/DD string for when this zoo closed. TODO: locale */
  closed: string,
  /** The numeric string ID for the `ResultZoo` zoo */
  id: string,
  /** The current display language of this result */
  language: Language,
  /**
   * Language order for how to prioritize displaying names when the current
   * display language doesn't have information for this zoo. The insertion
   * order into the set reflects the order of the `language.order` values
   */
  languageOrder: Set<Language>,
  /** The city / state / province of this zoo, in the display language */
  location: string,
  /** URL representing this zoo in Google Maps */
  map: string,
  /** The primary name of this facility, in the current display language */
  name: string,
  /** The URL of the photo being displayed in this zoo's result card */
  photo: string,
  /** The author (Instagram username or full name) of the photo */
  photoCredit: string,
  /** The numeric index for this photo in the list of the zoo's photos */
  photoIndex: number,
  /** The link to the original source of this photo */
  photoLink: string,
  /** 
   * The set of all pandas resolved to have lived at this zoo either
   * currently, or at some point in the past. 
   */
  recorded: Set<EntityPanda>,
  /** The total tally of red pandas that have ever lived at this zoo */
  recordedCount: number,
  /** The URL of the zoo's website */
  website: string
}
