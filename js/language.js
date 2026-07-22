import Env from './environment.js'
import { Defaults, Emoji, Flags, Gui, Polyglots, Tags } from './lookup.js'
import { Text } from './message.js'
import * as Page from './page.js'
import P, * as Pandas from './pandas.js'

/** 
 * Construct tag lists with arbitrary capitalization. TODO: do this for other
 * latin-alphabet languages (not just English)
 */
export function init() {
  for (let tag in Tags) {
    var en_tags = Tags[tag]["en"]
    var first_cap = en_tags.map(x => capitalize(x, "first"))
    var all_cap = en_tags.map(y => capitalize(y, "all"))
    Tags[tag]["en"] = en_tags
      .concat(first_cap)
      .concat(all_cap)
      .filter((value, index, self) => self.indexOf(value) === index)
  }
}

/** Language elements translatable in the GUI */

/**
 * Types of alphabets, so we can fall back to an alphabet that someone is
 * capable of reading based on their language skills. In practice, we opt to
 * fall back to latin languages since that alphabet is more widely understood
 */
export const alphabets = {
  "cjk": ["ja", "ko", "zh"],
  "cyrillic": ["ru"],
  "latin": ["da", "de", "en", "es", "fr", "nl", "pl", "pt", "sv"],
}

/**
 * Bias values. This helps choose what the most likely second-language for a
 * given display language might be. This was added due to the likelihood that
 * Chinese speakers may be able to read English characters, but not Japanese.
 * So for them we should fall back to English, despite what an entity's
 * preferred language order might be.
 */
const bias = {
  "en": [],
  "es": ["latin"],
  "ja": ["latin"],
  "ko": ["latin"],
  "ne": ["latin"],
  "pt": ["latin"],
  "zh": ["latin"]
}

/** Character translation tables per language. Just hiragana/katakana. */
const charset = {
  "ja": {
    "hiragana":
      ["あ", "い", "う", "え", "お",
       "か", "き", "く", "け", "こ",
       "が", "ぎ", "ぐ", "げ", "ご",
       "さ", "し", "す", "せ", "そ",
       "ざ", "じ", "ず", "ぜ", "ぞ",
       "た", "ち", "つ", "て", "と",
       "だ", "ぢ", "づ", "で", "ど",
       "な", "に", "ぬ", "ね", "の",
       "は", "ひ", "ふ", "へ", "ほ",
       "ば", "び", "ぶ", "べ", "ぼ",
       "ぱ", "ぴ", "ぷ", "ぺ", "ぽ",
       "ま", "み", "む", "め", "も",
       "や",       "ゆ",       "よ",
       "ら", "り", "る", "れ", "ろ",
       "わ", "ゐ",       "ゑ", "を",
                   "ん",
       "ぁ", "ぃ", "ぅ", "ぇ", "ぉ",
       "ゃ",       "ゅ",      "ょ"],
    "katakana":
      ["ア", "イ", "ウ", "エ", "オ",
       "カ", "キ", "ク", "ケ", "コ",
       "ガ", "ギ", "グ", "ゲ", "ゴ",
       "サ", "シ", "ス", "セ", "ソ",
       "ザ", "ジ", "ズ", "ゼ", "ゾ",
       "タ", "チ", "ツ", "テ", "ト",
       "ダ", "ヂ", "ヅ", "デ", "ド",
       "ナ", "ニ", "ヌ", "ネ", "ノ",
       "ハ", "ヒ", "フ", "ヘ", "ホ",
       "バ", "ビ", "ブ", "ベ", "ボ",
       "パ", "ピ", "プ", "ペ", "ポ",
       "マ", "ミ", "ム", "メ", "モ",
       "ヤ",       "ユ",      "ヨ",
       "ラ", "リ", "ル", "レ", "ロ",
       "ワ", "ヰ",       "ヱ", "ヲ",
                   "ン",
       "ァ", "ィ", "ゥ", "ェ", "ォ",
       "ャ",       "ュ",      "ョ"]
  }
}

/** For fallback functions, don't replace these fields */
const fallback_blacklist = ["othernames", "nicknames"]

/** Map a browser specified language to one of our supported options. */
export function defaultDisplayLanguage() {
  // Read language settings from browser's Accept-Language header
  // TODO ES6
  Defaults.languages.forEach(function(option) {
    if ((navigator.languages.includes(option)) &&
        (Env == undefined)) {
      Env.language = option
    }
  })
  // Read language setting if it's there
  const test = window.localStorage.getItem("language")
  if (test != null) {
    if (Defaults.languages.includes(test)) {
      Env.language = test
    }
  }  
  // Fallback to English
  if (Env.language == undefined)
    Env.language = "en"
  // Adjust flags. For UK locales, make the English language flag
  // a union-jack. For mainland China locales, make Taiwan flag
  // look like a Chinese flag.
  fallbackFlags()
}

/**
 * Do language fallback for anything reporting as `unknown` or _empty_ in a zoo
 * or animal object
 */
export function fallbackEntity(entity) {
  const output = entity
  const order = currentOrder(Pandas.language_order(entity), Env.language)
  // Default values that we want to ignore if we can
  const default_animal = saveEntityKeys(Defaults.animal, order)
  const default_zoo = saveEntityKeys(Defaults.zoo, order)
  const empty_values = [undefined].concat(Object.values(Defaults.unknown))
                                  .concat(Object.values(default_animal))
                                  .concat(Object.values(default_zoo))
  // Derive the zoo/panda language-translatable keys by getting a list of
  // the separate language keys from the original object, and adding a
  // synthetic list of keys that would apply for the current display language
  const language_entity = listDisplayKeys(entity, order, Env.language)
  // Start replacing this language's value with an available value in the
  // language.order list. Just stuff it in the original entity's key.
  for (const key of language_entity) {
    const blacklist_key = key.split(".")[1]   // No language suffix
    if (fallback_blacklist.includes(blacklist_key))
      continue  // Ignore blacklist fields
    if (empty_values.includes(entity[key])) {
      for (const language of order) {
        if (language == Env.language)
          continue  // Don't take replacement values from current language
        const [ _, desired ] = key.split('.')
        const new_key = `${language}.${desired}`
        if (!empty_values.includes(entity[new_key])) {
          // Put this language's value in the displayed output
          output[key] = entity[new_key]
          break
        }
      } // If no available non-empty strings in other languages, do nothing
    }
  }
  return output
}

/** Do locale adjustments for which flags appear as language flags */
function fallbackFlags() {
  // If an English locale other than USA, or if no English locale
  // defined at all, default the "english" language flag to UK flag.
  const us = "en-US"
  if (!navigator.languages.includes(us)) {
    Gui.flag["en"] = Flags["UK"]
  } else {
    for (const lang of navigator.languages) {
      if (lang.indexOf("en") == 0) {
        const commonwealth = navigator.languages.indexOf(lang)
        if (commonwealth < us) {
          Gui.flag["en"] = Flags["UK"]
          break
        }
      }
    }
  }
  // If a Chinese locale other than Taiwan, default the "chinese"
  // language flag to the China flag.
  const china = "zh-CN"
  const taiwan = "zh-TW"
  if ((navigator.languages.includes(taiwan)) &&
      (navigator.languages.includes(china)) &&
      (navigator.languages.indexOf(taiwan) < navigator.languages.indexOf(china))) {
    Gui.flag["zh"] = Flags["Taiwan"]
  }
  // Korean locale flag
  const korean = "ko-KR"
  if (navigator.languages.includes(korean)) {
    Gui.flag["ko"] = Flags["South Korea"]
  }
  // TODO: Portuguese vs. Brazil flags
  const brazil = "pt-BR"
  if (navigator.languages.includes(brazil)) {
    Gui.flag["pt"] = Flags["Brazil"]
  }
}

/**
 * Do language fallback for anything reporting as `unknown` or _empty_ in an
 * info block
 */
export function fallbackInfo(info, original) {
  var bundle = info
  var order = currentOrder(info.language_order, Env.language)
  // Default values that we want to ignore if we can
  var default_animal = saveEntityKeys(Defaults.animal, order)
  var default_zoo = saveEntityKeys(Defaults.zoo, order)
  const empty_values = [undefined].concat(Object.values(Defaults.unknown))
                                  .concat(Object.values(default_animal))
                                  .concat(Object.values(default_zoo))
  // Derive the info-block language-translatable keys by getting a list of
  // the separate language keys from the original object, slicing off
  // the lanugage prefix, and de-duplicating.
  const language_info = listInfoKeys(original, order)
  // Start replacing this language's value with an available value in the
  // language.order list. Just stuff it in the original info blob's key.
  for (const key of language_info) {
    if (fallback_blacklist.includes(key))
      continue  // Ignore blacklist fields
    if (empty_values.includes(info[key])) {
      for (const language of order) {
        if (language == Env.language)
          continue  // Don't take replacement values from current language
        const new_key = `${language}.${key}`
        if (!empty_values.includes(original[new_key])) {
          // Put this language's value in the displayed output
          bundle[key] = original[new_key]
          break
        }
      } // If no available non-empty strings in other languages, do nothing
    }
  }

  // Replace nested zoo or birthplace text for panda entities similarly
  if ((info.zoo != undefined) && (info.zoo != Defaults.zoo)) {
    bundle.zoo = fallbackEntity(info.zoo)
  }
  if ((info.birthplace != undefined) && (info.birthplace != Defaults.zoo)) {
    bundle.birthplace = fallbackEntity(info.birthplace)
  }
  for (const index in info.mom) {
    if ((info.mom[index] != undefined) && 
        (info.mom[index] != Defaults.animal)) {
      info.mom[index] = fallbackEntity(info.mom[index])
    }
  }
  for (const index in info.dad) {
    if ((info.dad[index] != undefined) && 
        (info.dad[index] != Defaults.animal)) {
      info.dad[index] = fallbackEntity(info.dad[index])
    }      
  }
  for (const index in info.litter) {
    if ((info.litter[index] != undefined) && 
        (info.litter[index] != Defaults.animal)) {
       info.litter[index] = fallbackEntity(info.litter[index])
    }
  }
  for (const index in info.siblings) {
    if ((info.siblings[index] != undefined) && 
        (info.siblings[index] != Defaults.animal)) {
       info.siblings[index] = fallbackEntity(info.siblings[index])
    }
  }
  for (const index in info.children) {
    if ((info.children[index] != undefined) && 
        (info.children[index] != Defaults.animal)) {
       info.children[index] = fallbackEntity(info.children[index])
    }
  }
  return bundle
}

/** 
 * For names stored in Roman characters, they often start with a capital
 * letter. So input queries not capitalized need to be corrected for searching.
 */
export function capitalNames(input) {
  let words = []
  const output = []
  if (input.includes(' ')) {
    words = input.split(' ')
  } else {
    words.push(input)
  }
  words.forEach(function(word) {
    const latin = testString(input, "Latin")
    if ((latin == true) && (Env.preserve_case == false)) {
      word = word.replace(/^\w/, (chr) => chr.toUpperCase())
      word = word.replace(/-./, (chr) => chr.toUpperCase())
      word = word.replace(/ ./, (chr) => chr.toUpperCase())
    }
    // Return either the modified or unmodified word to the list
    output.push(word)
  })
  return output.join(' ')   // Recombine terms with spaces
}

/** Capitalize words in a string */
function capitalize(input, mode) {
  const words = input.split(" ").length
  const output = ((mode == "first") || (words == 1))
    ? input.charAt(0).toUpperCase() + input.slice(1)
    : input.replace(/(?:^|\s)\S/g, (a) => a.toUpperCase())
  return output
}

/** Make a phrase out of parts, with commas and terminal _and_ */
export function commaPhrase(pieces) {
  const p = document.createElement('p')
  for (let i = 0; i < pieces.length; i++) {
    const m = document.createTextNode(pieces[i])
    const c = document.createTextNode(Text.comma[Env.language])
    const a = document.createTextNode(Text.and_words[Env.language])
    p.appendChild(m)
    // Commas
    if ((i < pieces.length - 3) && (pieces.length > 3)) {
      p.appendChild(c)
    }
    // Comma and "and" for long phrases
    if ((i == pieces.length - 3) && (pieces.length > 3)) {
      p.appendChild(c)
      p.appendChild(a)
    }
    // No commas, but just the "and"
    if ((i == pieces.length - 3) && (pieces.length <= 3)) {
      p.appendChild(a)
    }
  }
  return p
}

/** Same as above but for just raw text */
export function commaPhraseBare(pieces) {
  let o = ""
  for (let i = 0; i < pieces.length; i++) {
    const m = pieces[i]
    const c = Text.comma[Env.language] + " "
    const a = Text.and_words[Env.language]
    o = o.concat(m)
    // Commas
    if ((i < pieces.length - 2) && (pieces.length > 2)) {
      o = o.concat(c)
    }
    // Comma and "and" for long phrases
    if ((i == pieces.length - 2) && (pieces.length > 2)) {
      o = o.concat(c)
      o = o.concat(a)
    }
    // No commas, but just the "and"
    if ((i == pieces.length - 2) && (pieces.length <= 2)) {
      o = o.concat(a)
    }
  }
  // The fragments may concatenate spaces together, so kill these
  o = o.replace(/\s\s+/g, ' ')
  return o
}

/**
 * Calculate the current fallback language order for a given info block or
 * entity. Key here is adding the current display language to the list, so that
 * if a dataset doesn't include info for a language, we can overwrite that info
 * anyways!
 */
function currentOrder(current_list, current_language) {
  let currentBias = bias[current_language]
  if (currentBias[0] == "latin") {
    currentBias = []
    // Iterate through the current list of languages. If one has a latin
    // writing system, use it as an option. This will usually fall back to
    // English, but not always.
    for (const lang of current_list) {
      if (alphabets["latin"].includes(lang)) {
        currentBias.push(lang)
      }
    }
  }
  return currentBias
    .concat(current_list)
    .concat(current_language)
    // Remove duplicates in the array
    .filter((value, index, self) => self.indexOf(value) === index)
}

/**
 * Determine if altname is not worth displaying for furigana by calculating
 * its Levenshtein distance. Courtesy of https://gist.github.com/rd4k1
 */
export function editDistance(a, b) {
  if (!a || !b)
    return (a || b).length
  const m = []
  for (let i = 0; i <= b.length; i++) {
    m[i] = [i]
    if (i === 0)
      continue
    for (var j = 0; j <= a.length; j++) {
      m[0][j] = j
      if (j === 0)
        continue
      m[i][j] = b.charAt(i - 1) == a.charAt(j - 1) ? m[i - 1][j - 1] : Math.min(
        m[i-1][j-1] + 1,
        m[i][j-1] + 1,
        m[i-1][j] + 1
      )
    }
  }
  return m[b.length][a.length]
}

/** 
 * Use the language order of the entity, and the current display language,
 * to determine the most relevant available name for the animal shown, even if
 * it's not in the current display language.
 */
export function fallback_name(entity) {
  const entity_order = entity["language.order"].split(", ")
  const order = currentOrder(entity_order, Env.language)
  order.unshift(Env.language)   // Display language always comes first
  for (const language of order) {
    const name = entity[`${language}.name`]
    if (name != undefined)
      return name 
  }
  // Fallback default name
  return Defaults.animal[`${Env.language}.name`]
}

/**
 * For Japanese language searches, whenever a hiragana string is searched, we
 * try to support also searching for the katakana equivalent characters.
 */
export function hiraganaToKatakana(input) {
  const source_range = Defaults.ranges['ja'][1]   // Hiragana range regex
  const test = source_range.test(input)
  let output = ""
  if (test == false) {
    return input
  } else {
    for (let char of input) {
      const index = charset["ja"].hiragana.indexOf(char)
      if (index > -1) { 
        const swap = charset["ja"].katakana[index]
        output += swap
      } else {
        output += char
      }
    }
  }
  return output
}

/**
 * For Japanese language searches, whenever a katakana string is searched, we
 * try to support also searching for the hiragana equivalent characters.
 */
export function katakanaToHiragana(input) {
  const source_range = Defaults.ranges['ja'][2]   // Katakana range regex
  const test = source_range.test(input)
  let output = ""
  if (test == false) {
    return input
  } else {
    for (let char of input) {
      const index = charset["ja"].katakana.indexOf(char)
      if (index > -1) { 
        const swap = charset["ja"].hiragana[index]
        output += swap
      } else {
        output += char
      }
    }
    return output
  }
}

/**
 * Given a list of keys we're doing language translations for, add a set
 * for the current displayed language
 */
function listDisplayKeys(entity, order, current_language) {
  const entity_keys = listEntityKeys(entity, order)
  const language_keys = entity_keys.map(function(key) {
    const [_, primary] = key.split('.')
    return current_language + "." + primary
  })
  // De-duplicate language keys
  return entity_keys.concat(language_keys)
    .filter((value, index, self) => self.indexOf(value) === index)
}

/**
 * Get the valid language-translatable keys in a zoo or animal object
 * like the ones in the `Pandas.*` methods
 */
function listEntityKeys(entity, order) {
  const obj_langs = order.concat(Defaults.languages)  // Dupes not important
  const filtered = Object.keys(entity).filter(function(key) {
    // List the language-specific keys in a zoo or animal
    const [lang, primary] = key.split('.')
    return (obj_langs.indexOf(lang) != -1)
  })
  return filtered
}

/**
 * Get the valid language-translatable keys in an info block from one of its
 * panda/zoo entities, like you have in blocks created by `Show.acquire*Info`
 */
function listInfoKeys(entity, order) {
  return listEntityKeys(entity, order).map(function(key) {
    const [language, desired] = key.split('.')
    return desired
  }).filter((value, index, self) => self.indexOf(value) === index)
}

/**
 * Only keep the keys in a panda or zoo object that are meaningfully
 * translatable to different languages
 */
function saveEntityKeys(entity, order) {
  return listEntityKeys(entity, order).reduce(function(obj, key) {
    // Only keep JSON values with those matching keys
    obj[key] = entity[key]
    return obj
  }, {})
}

/**
 * Find the canonical tag given something being parsed as a tag, i.e. for
 * _climbing_, return _climb_.
 */
export function tagPrimary(input) {
  const lang_values = Defaults.languages.concat("emoji")
  for (const ctag in Tags) {
    for (const lang of lang_values) {
      if (Tags[ctag][lang].includes(input)) {
        return ctag
      }
    }
  }
  // Need to search polyglots too, for things like "baby"
  for (const ctag in Polyglots) {
    for (const lang of lang_values) {
      if (Polyglots[ctag][lang].includes(input)) {
        return ctag
      }
    }
  }
}

/**
 * Language test functions. If the string is in the given range,
 * return true. Depending on the mode, this may be an "all" match
 * or an "any" match.
 */
export function testString(input, test_name) {
  if (test_name == "Hiragana") {
    const range = Defaults.ranges['ja'][1]
    return range.test(input)   // True if any characters match the hiragana range
  }
  if (test_name == "Katakana") {
    const range = Defaults.ranges['ja'][2]
    return range.test(input)   // True if any characters match the katakana range
  }
  if ((test_name == "Latin") || (test_name == "English")) {
    const ranges = Defaults.ranges['en']
    const latin = ranges.some((range) => range.test(input))
    return latin   // True if any characters match the latin range
  }
  return false   // The test doesn't exist
}

/** Take specific english words and unpluralize them if necessary */
export function unpluralize(pieces) {
  const output = []
  if (Env.language == "en") {
    for (let input of pieces) {
      input = input.replace(/\b1 photos/, "one photo")
                   .replace(/\b1 new photos/, "one new photo")
                   .replace(/\b1 boys/, "one boy")
                   .replace(/\b1 girls/, "one girl")
                   .replace(/\b1 brothers/, "one brother")
                   .replace(/\b1 sisters/, "one sister")
                   .replace(/\b1 sons/, "one son")
                   .replace(/\b1 daughters/, "one daughter")
                   .replace(/\b1 newborns/, "one newborn")
                   .replace(/\b1 new red pandas/, "one new red panda")
                   .replace(/\b1 baby siblings/, "one baby sibling")
                   .replace(/\b1 current red pandas/, "one current red panda")
                   .replace(/\b1 red pandas live/, "one red panda lives")
                   .replace(/\b1 cubs/, "one cub")
                   .replace(/\b1 recorded in the database/, "one record in the database")
                   .replace(/\b1 recent departures/, "one recent departure")
                   .replace(/\b1 new contributors/, "one new contributor")
                   .replace(/\bcombo: 1 photos/, "combo: one photo")
                   .replace(/\bphotos tagged/, "photo tagged")
                   .replace(/^([^A-Za-z0-9]+)one\s/, "$1 One ")
                   .replace(/^one\s/, "One ")
      output.push(input)
    }
    return output
  } else if (Env.language == "es") {
    for (let input of pieces) {
      input = input.replace(/\b1 fotos/, "una foto")
                   .replace(/\b1 niños/, "un niño")
                   .replace(/\b1 niñas/, "una niña")
                   .replace(/\b1 hermanos/, "un hermano")
                   .replace(/\b1 hermanas/, "una hermana")
                   .replace(/\b1 hijos/, "un hijo")
                   .replace(/\b1 hijas/, "una hija")
                   .replace(/\b1 hermanitos/, "un hermanito")
                   .replace(/\b1 machos/, "un macho")
                   .replace(/\b1 hembras/, "una hembra")
                   .replace(/\b1 nuevos pandas rojos/, "un nuevo panda rojo")
                   .replace(/\b1 hermanos pequeños/, "un hermano pequeño")
                   .replace(/\b1 panda rojos en/, "un panda rojo en")
                   .replace(/\b1 cachorros nacidos/, "un cachorro nacido")
                   .replace(/\b1 registrados aquí/, "un registrado aquí")
                   .replace(/\b1 partidas recientes/, "un partida reciente")
                   .replace(/\b1 nuevos contribuyentes/, "uno nuevo contribuyente")
                   .replace(/\bcombo: 1 fotos/, "combo: una foto")
                   .replace(/\bfotos etiquetadas/, "foto etiquetada")
                   .replace(/^([^A-Za-z0-9]+)un\s/, "$1 Un ")
                   .replace(/^([^A-Za-z0-9]+)uno\s/, "$1 Uno ")
                   .replace(/^([^A-Za-z0-9]+)una\s/, "$1 Una ")
                   .replace(/^un\s/, "Un ")
                   .replace(/^uno\s/, "Uno ")
                   .replace(/^una\s/, "Una ")
      output.push(input)
    }
    return output
  } else if (Env.language == "ko") {
    for (let input of pieces) {
      input = input.replace(/(\d+) 사진들/, "$1 사진")
                   .replace(/(\d+) 동물들/, "$1 동물")
                   .replace(/(\d+) 판다들/, "$1 판다")
                   .replace(/새로운 (\d+) 기여자들/, "새로운 $1 기여자")
                   .replace(/사진 태그들/, "사진 태그")  
      output.push(input)
    }
    return output
  } else if (Env.language == "pt") {
    for (let input of pieces) {
      input = input.replace(/\b1 fotos/, "uma foto")
                   .replace(/\b1 novas fotos/, "uma nova foto")
                   .replace(/\b1 meninos/, "um menino")
                   .replace(/\b1 meninas/, "uma menina")
                   .replace(/\b1 irmãos/, "um irmão")
                   .replace(/\b1 irmãs/, "uma irmã")
                   .replace(/\b1 filhos/, "um filho")
                   .replace(/\b1 filhas/, "uma filha")
                   .replace(/\b1 recém-nascidos(as)/, "um(a) recém-nascido(a)")
                   .replace(/\b1 novos pandas-vermelhos/, "um novo panda-vermelho")
                   .replace(/\b1 irmãos(ãs) bebês/, "um(a) irmão(ã) bebê")
                   .replace(/\b1 pandas-vermelhos atualmente/, "um panda-vermelho atualmente")
                   .replace(/\b1 pandas-vermelhos moram/, "um panda-vermelho mora")
                   .replace(/\b1 filhotes nascidos/, "um filhote nascido")
                   .replace(/\b1 registrados na base de dados/, "um registrado na base de dados")
                   .replace(/\b1 partidas recentes/, "uma partida recente")
                   .replace(/\b1 novos contribuintes/, "um novo contribuinte")
                   .replace(/\bcombo: 1 fotos/, "combo: uma foto")
                   .replace(/\bfotos etiquetadas/, "foto etiquetada")
                   .replace(/^([^A-Za-z0-9]+)um\s/, "$1 Um ")
                   .replace(/^([^A-Za-z0-9]+)uma\s/, "$1 Uma ")
                   .replace(/^um\s/, "Um ")
                   .replace(/^uma\s/, "Uma ")
      output.push(input)
    }
    return output
  } else {
    return pieces
  }
}

/** Update all GUI elements based on the currently chosen language */
export function update() {
  // Update menu buttons. TODO: grab these buttons by class
  const menu_button_ids = ['languageButton', 'aboutButton', 'randomButton',
                           'linksButton', 'profileButton', 'mediaButton', 
                           'timelineButton']
  const menu_button_elements = menu_button_ids.map(x => 
    document.getElementById(x)).filter(x => x != undefined)
  // Any buttons in the page? Redraw with correct language settings
  for (const element of menu_button_elements) {
    const id = element.id
    const lookup = id.replace("Button", "")
    const [icon, text] = element.childNodes[0].childNodes
    if (id == "languageButton") {
      icon.innerText = Gui.flag[Env.language]   // Replace flag icon
      text.innerText = Gui[lookup][Env.language][Env.language]   // Replace language icon text
    } else {
      text.innerText = Gui[lookup][Env.language]   // Replace icon text
    }
  }
  // On the Links page? Redraw it
  if ((window.location.hash == "#links") && (P.db != undefined))
    Page.links.render()
  // Update the placeholder text for a search bar
  if (document.forms['searchForm'] != undefined) {
    if (P.db == undefined)
      document.forms['searchForm']['searchInput'].placeholder =
        Gui.loading[Env.language]
    else
      document.forms['searchForm']['searchInput'].placeholder =
        "➤ " + Gui.search[Env.language]
  }
  // Change the page title
  document.title = Gui.title[Env.language]
  // Write localStorage for your chosen language. This is better than a cookie
  // since the server doesn't see what language you're using in each request.
  window.localStorage.setItem('language', Env.language)
}
