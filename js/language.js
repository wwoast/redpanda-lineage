import * as Page from './page.js'
import P, * as Pandas from './pandas.js'
import * as Query from './query.js'

/*
    Language fallback methods
*/

/** The current display language for redpandafinder */
export let Displayed = undefined


// TODO ES6: get rid of Language.L and just use state here, as well as in
// localStorage. Still need init to do the tag list processing, but
// TODO: do it for all the latin languages, not just english
Language.init = function() {
  // Construct tag lists with arbitrary capitalization
  for (let tag in tags) {
    var en_tags = tags[tag]["en"]
    var first_cap = en_tags.map(x => capitalize(x, "first"))
    var all_cap = en_tags.map(y => capitalize(y, "all"))
    tags[tag]["en"] = en_tags
      .concat(first_cap)
      .concat(all_cap)
      .filter((value, index, self) => self.indexOf(value) === index)
  }
}

/*
   Language elements translatable in the GUI
*/

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

/**
 * Date formats for parsing support fallbacks, if there would otherwise be
 * ambiguity in the dates
 */
export const date_locale = {
  "mm_dd": {
    "en": "mm_dd",
    "es": "dd_mm",
    "ja": "mm_dd",
    "ko": "mm_dd",
    "ne": "mm_dd",
    "pt": "dd_mm",
    "zh": "mm_dd"
  },
  "yy_mm": {
    "en": "mm_yyyy",
    "es": "mm_yyyy",
    "ja": "yyyy_mm",
    "ko": "yyyy_mm",
    "ne": "yyyy_mm",
    "pt": "mm_yyyy",
    "zh": "yyyy_mm",
  },
  "yy_mm_dd": {
    "en": "mm_dd_yyyy",
    "es": "dd_mm_yyyy",
    "ja": "yyyy_mm_dd",
    "ko": "yyyy_mm_dd",
    "ne": "yyyy_mm_dd",
    "pt": "dd_mm_yyyy",
    "zh": "yyyy_mm_dd",
  }
}

/** Default parameters for entities that lack language information */
export const fallback = {
  "order": ["en", "ja"]
}

export const emoji = {
         "alert": "🚨",
        "animal": "🐼",
         "alien": "👽",
         "apple": "🍎",
         "arrow": "➡",
        "author": "✍️",
        "autumn": "🍂",
          "baby": "👶🏻",
        "bamboo": "🎍",
           "bed": "🛌",
         "bento": "🍱",
      "birthday": "🎂",
         "blink": "😑",
          "born": "👼",
       "born_at": "🐣",
          "bowl": "🍜",
           "boy": "👦🏻",
        "bridge": "🌉",
      "brothers": "👦👦",
     "butterfly": "🦋",
        "camera": "📷",
       "camping": "🏕️",
         "carry": "🍡",
"cherry_blossom": "🌸",
   "caterpillar": "🐛",
         "climb": "🧗",
        "closed": "🔒",
      "close_up": "😁",
        "couple": "💑",
       "cyclone": "🌀",
          "died": "🌈",
           "dig": "⛏️",
          "dish": "🍽️",
          "door": "🚪",
           "ear": "👂",
          "edit": "📝",
           "eye": "👁️",
        "father": "👨🏻",
        "female": "♀️",
     "fireworks": "🎆",
        "flower": "🌼",
      "football": "⚽",
          "gift": "🍎",
      "giftwrap": "🎁",
          "girl": "👧🏻",
"globe_americas": "🌎",
    "globe_asia": "🌏",
       "grandpa": "👴",
        "greens": "🌿",
        "grumpy": "😠",
        "hearts": "💕",
          "home": "🏡",
          "itch": "🐜",
          "jizo": "🗿",
          "kiss": "💋",
     "lightbulb": "💡",
          "link": "🦉",
          "lips": "👄",
          "logo": "🐯🐻",
          "male": "♂️",
           "map": "🗺️",
         "media": "🖼",
      "megagift": "🌿🍎",
         "money": "💸",
       "monocle": "🧐",
          "moon": "🌙",
        "mother": "👩🏻",
        "muzzle": "🐴",
          "nerd": "🤓",
      "no_emoji": "⚪",
       "no_more": "🚫",
          "nose": "👃",
       "options": "⚙️",
        "paging": "⏬",
         "panda": "🐼",
          "paws": "🐾",
       "playing": "🃏",
          "poop": "💩",
      "portrait": "🖼️",
          "pray": "🙏",
       "profile": "💟",
       "pumpkin": "🎃",
      "question": "❓",
 "range_current": "⏳",
"range_previous": "⌛",
        "random": "🎲",
     "raincloud": "🌧️",
    "recordbook": "📖",
       "refresh": "🔄",
         "reiwa": "🏵️",
         "scale": "⚖️",
        "search": "🔍",
   "see_and_say": "‍👁️‍🗨️",
        "shower": "🚿",
      "siblings": "👧👦",
       "sisters": "👧👧",
      "sleeping": "😴",
       "slobber": "🤤",
         "smile": "😄",
         "snake": "🐍",
          "snow": "❄️",
        "spider": "🕷",
      "star_dad": "👨‍🎤",
      "star_mom": "👩‍🎤",
          "star": "🌟",
         "story": "🎍",
        "target": "🎯",
     "teddybear": "🧸",
         "tooth": "🦷",
           "top": "⬆",
        "tongue": "👅",
       "tornado": "🌪️",
        "travel": "✈️",
      "treasure": "💎",
          "tree": "🌳",
         "truck": "🚚",
   "upside_down": "🙃",
         "weary": "😩",
       "website": "🌐",
        "weight": "🏋️",
      "whiskers": "🐭",
        "window": "🖼",
          "wink": "😉",
           "wip": "🚧",
         "worry": "😢",
          "yawn": "😪",
           "zoo": "🦁",
}

/** For fallback functions, don't replace these fields */
const fallback_blacklist = ["othernames", "nicknames"]

const flags = {
     "Argentina": "🇦🇷",
     "Australia": "🇦🇺",
       "Austria": "🇦🇹",
       "Belgium": "🇧🇪",
        "Bhutan": "🇧🇹",
        "Brazil": "🇧🇷",
        "Canada": "🇨🇦",
         "Chile": "🇨🇱",
         "China": "🇨🇳",
       "Croatia": "🇭🇷",
       "Czechia": "🇨🇿",
       "Default": "🐼",
       "Denmark": "🇩🇰",
        "France": "🇫🇷",
       "Germany": "🇩🇪",
     "Hong Kong": "🇭🇰",
       "Hungary": "🇭🇺",
       "Ireland": "🇮🇪",
         "India": "🇮🇳",
     "Indonesia": "🇮🇩",
   "Isle of Man": "🇮🇲",
         "Italy": "🇮🇹",
         "Japan": "🇯🇵",
          "Laos": "🇱🇦",
        "Mexico": "🇲🇽",
         "Nepal": "🇳🇵",
   "Netherlands": "🇳🇱",
   "New Zealand": "🇳🇿",
        "Poland": "🇵🇱",
      "Portugal": "🇵🇹",
        "Russia": "🇷🇺",
     "Singapore": "🇸🇬",
      "Slovakia": "🇸🇰",
   "South Korea": "🇰🇷",
         "Spain": "🇪🇸",
        "Sweden": "🇸🇪",
        "Taiwan": "🇹🇼",
      "Thailand": "🇹🇭",
            "UK": "🇬🇧",
           "USA": "🇺🇸"
}

export const gui = {
  "about": {
    "en": "About",
    "es": "Acerca\xa0de",
    "ja": "概要",
    "ko": "소개",
    "ne": "बारेमा",
    "pt": "Sobre",
    "zh": "关于"
  },
  "autumn": {
    "en": "Autumn",
    "es": "Otoño",
    "ja": "秋",
    "ko": "가을",
    "ne": "शरद तु",
    "pt": "Outono",
    "zh": "秋",
  },
  "babies": {
    "en": "Babies",
    "es": "Bebés",
    "ja": "乳幼児",
    "ko": "아기 레서판다들",
    "ne": "बच्चाहरु",
    "pt": "Bebês",
    "zh": "婴儿"
  },
  "children": {
    "en": "Children",   // Capitalization
    "es": "Niños",
    "ja": Pandas.def.relations.children["ja"],
    "ko": "새끼 레서판다들",
    "ne": "बच्चाहरु",
    "pt": "Filhos(as)",
    "zh": Pandas.def.relations.children["zh"]
  },
  "contribute": {
    "en": "Submit a Photo",
    "es": "Enviar una foto",
    "ja": "写真を提出する",
    "ko": "사진 제출",
    "ne": "फोटो पेश गर्नुहोस्",
    "pt": "Enviar uma foto",
    "zh": "上传照片"
  },
  "contribute_link": {
    "en": "https://docs.google.com/forms/d/1kKBv92o09wFIBFcvooYLm2cG8XksGcVQQSiu9SpHGf0",
    "ja": "https://docs.google.com/forms/d/1wEhwNieyonPNSk6q8fflUT3e4kyAsIlAFmeib1tW4Jk"
  },
  "copied": {
    "en": "Copied QR code link",
    "es": "Enlace copiado",
    "ja": "リンク先をコピー",
    "ko": "QR 코드 링크 복사",
    "ne": "QR कोड लिङ्क प्रतिलिपि गरियो",
    "pt": "Link copiado",
    "zh": "复制二维码链接"
  },
  "fall": {
    "en": "Autumn",
    "es": "Otoño",
    "ja": "秋",
    "ko": "가을",   // Convenience duplicate of autumn
    "ne": "शरद तु",
    "pt": "Outono",
    "zh": "秋"
  },
  "family": {
    "en": "Family",
    "es": "Familia",
    "ja": "ファミリ",
    "ko": "가족",
    "ne": "परिवार",
    "pt": "Família",
    "zh": "家族"
  },
  "father": {
    "en": "Father",
    "es": "Padre",
    "ja": "父",
    "ko": "아빠",
    "ne": "बुबा",
    "pt": "Pai",
    "zh": "父亲"
  },
  "flag": {
    "en": flags["USA"],
    "es": flags["Spain"],
    "ja": flags["Japan"],
    "ko": flags["South Korea"],
    "ne": flags["Nepal"],
    "pt": flags["Portugal"],
    "zh": flags["China"]
  },
  "footerLink_rpf": {
    "en": "Red Panda Lineage",
    "es": "Red Panda Lineage",
    "ja": "Red Panda Lineage",
    "ko": "레서판다의 가계도",
    "ne": "Red Panda Lineage",
    "pt": "Red Panda Lineage",
    "zh": "小熊猫族谱项目"
  },
  "footerLink_rpn": {
    "en": "Red Panda Network",
    "es": "Red Panda Network",
    "ja": "Red Panda Network",
    "ko": "Red Panda Network",
    "ne": "Red Panda Network",
    "pt": "Red Panda Network",
    "zh": "Red Panda Network",
  },
  "home": {
    "en": "Home",
    "es": "Home",
    "ja": "ホーム",
    "ko": "홈으로",
    "ne": "होमपेज",
    "pt": "Início",
    "zh": "主页"
  },
  "instagramLinks_body": {
    "en": "Without all the dedicated and loving Instagram red panda fans I " +
          "know, this site would not exist. Thank you so much!",
    "es": "",
    "ja": "",
    "ko": "",
    "ne": "",
    "pt": "Sem todos os dedicados e adoráveis fãs de pandas-vermelhos do " +
          "Instagram que conheço, este site não existiria. Agradeço muito!",
    "zh": ""
  },
  "instagramLinks_button": {
    "en": "Instagram",
    "es": "Instagram",
    "ja": "インスタグラム",
    "ko": "인스타그램",
    "ne": "Instagram",
    "pt": "Instagram",
    "zh": "IG"
  },
  "instagramLinks_header": {
    "en": "Red Pandas on Instagram",
    "es": "Pandas rojos en Instagram",
    "ja": "Instagram レッサーパンダ",
    "ko": "인스타그램",
    "ne": "Instagram निगल्य पोन्या",
    "pt": "Pandas-vermelhos no Instagram",
    "zh": "Instagram 小熊猫"
  },
  "language": {
    "en": {
      "de": "German",
      "en": "English",
      "es": "Spanish",
      "ko": "Korean",
      "fr": "French",
      "ja": "Japanese",
      "ne": "Nepalese",
      "pl": "Polish",
      "pt": "Portuguese",
      "ru": "Russian",
      "sv": "Swedish",
      "zh": "Chinese"
    },
    "es": {
      "de": "Alemán",
      "en": "Ingles",
      "es": "Español",
      "fr": "Francés",
      "ja": "Japonés",
      "ko": "Coreano",
      "ne": "Nepalés",
      "pl": "Polaco",
      "pt": "Portugués",
      "ru": "Ruso",
      "sv": "Sueco",
      "zh": "Chino"
    },
    "ja": {
      "de": "ドイツ語",
      "en": "英語",
      "es": "スペイン語",
      "fr": "フランス語",
      "ja": "日本語",
      "ko": "韓国語",
      "ne": "ネパール語",
      "pl": "ポーランド語",
      "pt": "ポルトガル語",
      "ru": "ロシア語",
      "sv": "スウェーデン",
      "zh": "中国語"
    },
    "ko": {
      "de": "독일어",
      "en": "영어",
      "es": "스페인어",
      "fr": "프랑스어",
      "ja": "일본어",
      "ko": "한국어",
      "ne": "네팔어",
      "pl": "폴란드어",
      "pt": "포르투갈어",
      "ru": "러시아어",
      "sv": "스웨덴",
      "zh": "중국어"
    }, 
    "ne": {
      "de": "जर्मन",
      "en": "अंग्रेजी",
      "es": "स्पनिश",
      "fr": "फ्रेन्च",
      "ja": "जापानी",
      "ko": "कोरियन",
      "ne": "नेपाली",
      "pl": "पोलिश",
      "pt": "पोर्तुगाली",
      "ru": "रसियन",
      "sv": "स्वीडिश",
      "zh": "चिनियाँ"
    },
    "pt": {
      "de": "Alemão",
      "en": "Inglês",
      "es": "Espanhol",
      "fr": "Francês",
      "ja": "Japonês",
      "ko": "Coreano",
      "ne": "Nepalês",
      "pl": "Polonês",
      "pt": "Português",
      "ru": "Russo",
      "sv": "Sueco",
      "zh": "Chinês"
    },
    "ru": {
      "de": "немецкий",
      "en": "английский",
      "es": "испанский",
      "fr": "французкий",
      "ja": "японский",
      "ko": "корейский",
      "ne": "непальский",
      "pl": "польский",
      "pt": "португа́льский",
      "ru": "русский",
      "sv": "шведский",
      "zh": "китайский"
    },
    "sv": {
      "de": "Tyska",
      "en": "Engelska",
      "es": "Spanska",
      "fr": "Franska",
      "ja": "Japanska",
      "ko": "Koreanska",
      "ne": "Nepali",
      "pl": "Polska",
      "pt": "Portugisiska",
      "ru": "Ryska",
      "sv": "Svenska",
      "zh": "Kinesiskt"
    },
    "zh": {
       "de": "德语",
       "en": "英语",
       "es": "西班牙语",
       "fr": "法语",
       "ja": "日语",
       "ko": "朝鮮语",
       "ne": "尼泊尔语",
       "pl": "波兰语",
       "pt": "葡萄牙语",
       "ru": "俄语",
       "sv": "瑞典",
       "zh": "汉语"
     }
  },
  "loading": {
    "en": "Loading...",
    "es": "Cargando",
    "ja": "ローディング",
    "ko": "로딩 중...",
    "ne": "लोड",
    "pt": "Carregando...",
    "zh": "加载中..."
  },
  "litter": {
    "en": "Litter",   // Capitalization
    "es": "Camada",
    "ja": Pandas.def.relations.litter["ja"],
    "ko": "쌍둥이",
    "ne": "रोटी",
    "pt": "Ninhada",
    "zh": Pandas.def.relations.litter["zh"]
  },
  "links": {
    "en": "Links",
    "es": "Enlaces",
    "ja": "リンク",
    "ko": "링크",
    "ne": "लिंक",
    "pt": "Links",
    "zh": "链接"
  },
  "me": {
    "en": "Me",
    "es": "Me",
    "ja": "私",
    "ko": "나",
    "ne": "म",
    "pt": "Eu",
    "zh": "我"
  },
  "media": {
    "en": "Media",
    "es": "Imagenes",
    "ja": "メディア",
    "ko": "미디어",
    "ne": "मिडिया",
    "pt": "Imagens",
    "zh": "媒体"
  },
  "mother": {
    "en": "Mother",
    "es": "Madre",
    "ja": "母",
    "ko": "엄마",
    "ne": "आमा",
    "pt": "Mãe",
    "zh": "母亲"
  },
  "nicknames": {
    "en": "Nicknames",
    "es": "Apodos",
    "ja": "ニックネーム",
    "ko": "별명",
    "ne": "उपनामहरू",
    "pt": "Apelidos",
    "zh": "昵称"
  },
  "options": {
    "en": "Options",
    "es": "Opciones",
    "ja": "オプション",
    "ko": "옵션",
    "ne": "विकल्पहरू",
    "pt": "Opções",
    "zh": "选项"
  },
  "opt_hide_dead_pandas": {
    "en": "Hide panda memorials",
    "es": "Ocultar monumentos conmemorativos de pandas",
    "ja": "パンダ記念碑を隠す",
    "ko": "판다 추모 게시물 숨기기",
    "ne": "पांडा स्मारकहरू लुकाउनुहोस्",
    "pt": "Ocultar memoriais do panda",
    "zh": "隐藏熊猫纪念馆"
  },
  "othernames": {
    "en": "Other Names",
    "es": "Otros nombres",
    "ja": "他の名前",
    "ko": "다른 이름",
    "ne": "अरु नामहरु",
    "pt": "Outros nomes",
    "zh": "其他名称"
  },
  "paging": {
    "en": "More",
    "es": "Ver Más",
    "ja": "もっと",
    "ko": "더 보기",
    "ne": "अधिक",
    "pt": "Mais",
    "zh": "更多"
  },
  "parents": {
    "en": "Parents",   // Capitalization
    "es": "Padres",
    "ja": Pandas.def.relations.parents["ja"],
    "ko": "부모",
    "ne": "अभिभावक",
    "pt": "Pais",
    "zh": Pandas.def.relations.parents["zh"]
  },
  "profile": {
    "en": "Profile",
    "es": "Perfil",
    "ja": "プロフィール",
    "ko": "프로필",
    "ne": "प्रोफाइल",
    "pt": "Perfil",
    "zh": "档案"
  },
  "quadruplet": {
    "en": "Quadruplet",
    "es": "Cuatrillizo",
    "ja": "四つ子",
    "ko": "사촌",
    "ne": "प्रोफाइल",
    "pt": "Quadrigêmeos",
    "zh": "四胞胎"
  },
  "random": {
    "en": "Random",
    "es": "Aleatorio",
    "ja": "適当",
    "ko": "랜덤",
    "ne": "अनियमित",
    "pt": "Aleatório",
    "zh": "随机"
  },
  "redPandaCommunity_body": {
    "en": "",
    "es": "",
    "ja": "",
    "ko": "",
    "ne": "",
    "pt": "",
    "zh": ""
  },
  "redPandaCommunity_button": {
    "en": "Community",
    "es": "Comunidad",
    "ja": "共同体",
    "ko": "커뮤니티",
    "ne": "समुदाय",
    "pt": "Comunidade",
    "zh": "社区"
  },
  "redPandaCommunity_header": {
    "en": "Red Panda Community",
    "es": "Comunidad del Panda Rojo",
    "ja": "レッサーパンダの共同体",
    "ko": "레서판다 커뮤니티",
    "ne": "निगल्य पोन्या समुदाय",
    "pt": "Comunidade do Panda-Vermelho",
    "zh": "小熊猫社区"
  },
  "refresh": {
    "en": "Refresh",
    "es": "Refrescar",
    "ja": "リロード",
    "ko": "새로고침",
    "ne": "ताजा गर्नु",
    "pt": "Atualizar",
    "zh": "刷新"
  },
  "search": {
    "en": "Search...",
    "es": "Buscar...",
    "ja": "サーチ...",
    "ko": "검색...",
    "ne": "खोज्नु",
    "pt": "Pesquisar...",
    "zh": "搜索..."
  },
  "seen_date": {
    "en": "Seen <INSERTDATE>",
    "es": "Visto <INSERTDATE>",
    "ja": "TOWRITE <INSERTDATE>",
    "ko": "본 날 <INSERTDATE>",
    "ne": "TOWRITE <INSERTDATE>",
    "pt": "Visto em <INSERTDATE>",
    "zh": "目击日期 <INSERTDATE>"
  },
  "siblings": {
    "en": "Siblings",   // Capitalization,
    "es": "Hermanos",
    "ja": Pandas.def.relations.siblings["ja"],
    "ko": "형제·자매",
    "ne": "भाइबहिनीहरू",
    "pt": "Irmão(ãs)",
    "zh": Pandas.def.relations.siblings["zh"]
  },
  "since_date": {
    "en": "Since <INSERTDATE>",
    "es": "Ya que <INSERTDATE>",
    "ja": "<INSERTDATE>から",
    "ko": "<INSERTDATE>부터",
    "ne": "<INSERTDATE>देखि",
    "pt": "Desde <INSERTDATE>",
    "zh": "自 <INSERTDATE>"
  },
  "specialThanksLinks_body": {
    "en": "",
    "es": "",
    "ja": "",
    "ko": "",
    "ne": "",
    "pt": "",
    "zh": ""
  },
  "specialThanksLinks_button": {
    "en": "Special Thanks",
    "es": "Agradecimientos",
    "ja": "感佩",
    "ko": "Special Thanks",
    "ne": "विशेष धन्यवाद",
    "pt": "Agradecimentos",
    "zh": "鸣谢"
  },
  "specialThanksLinks_header": {
    "en": "Special Thanks",
    "es": "Agradecimientos Especiales",
    "ja": "感佩",
    "ko": "Special Thanks",
    "ne": "विशेष धन्यवाद",
    "pt": "Agradecimentos Especiais",
    "zh": "鸣谢"
  },
  "spring": {
    "en": "Spring",
    "es": "Primavera",
    "ja": "春",
    "ko": "봄",
    "ne": "वसन्त",
    "pt": "Primavera",
    "zh": "春"
  },
  "summer": {
    "en": "Summer",
    "es": "Verano",
    "ja": "夏",
    "ko": "여름",
    "ne": "गर्मी",
    "pt": "Verão",
    "zh": "夏"
  },
  "title": {
    "en": "Red Panda Finder",
    "es": "Buscador de Panda Rojo",
    "ja": "レッサーパンダのファインダー",
    "ko": "레서판다 찾기",
    "ne": "निगल्या पोनिया मित्र",
    "pt": "Buscador de Pandas-Vermelhos",
    "zh": "查找小熊猫"
  },
  "top": {
    "en": "Top",
    "es": "Arriba",
    "ja": "上",
    "ko": "위로",
    "ne": "माथि",
    "pt": "Para\xa0cima",
    "zh": "顶部"
  },
  "tree": {
    "en": "Tree",
    "es": "Árbol",
    "ja": "木",
    "ko": "나무",
    "ne": "रूख",
    "pt": "Árvore",
    "zh": "树"
  },
  "twin": {
    "en": "Twin",
    "es": "Mellizo",
    "ja": "双子",
    "ko": "쌍둥이",
    "ne": "जुम्ल्याहा",
    "pt": "Gêmeo",
    "zh": "双胞胎"
  },
  "triplet": {
    "en": "Triplet",
    "es": "Trillizo",
    "ja": "三つ子",
    "ko": "삼둥이",
    "ne": "तीनवटा",
    "pt": "Trigêmeo",
    "zh": "三胞胎"
  },
  "winter": {
    "en": "Winter",
    "es": "Invierno",
    "ja": "冬",
    "ko": "겨울",
    "ne": "जाडो",
    "pt": "Inverno",
    "zh": "冬"
  },
  "zooLinks_body": {
    "en": "While many zoos are represented in this dataset, some of them are " +
          "hotspots for seeing Red Pandas.",
    "es": "",
    "ja": "",
    "ko": "",
    "ne": "",
    "pt": "",
    "zh": ""
  },
  "zooLinks_button": {
    "en": "Zoos",
    "es": "Zoológicos",
    "ja": "動物園",
    "ko": "동물원",
    "ne": "चिडियाखाना",
    "pt": "Zoológicos",
    "zh": "动物园",
  },
  "zooLinks_header": {
    "en": "Major Red Panda Zoos",
    "es": "Principales Zoológicos de Pandas Rojos",
    "ja": "レッサーパンダの動物園",
    "ko": "레서판다의 주요 동물원",
    "ne": "प्रमुख चिडियाखाना",
    "pt": "Principais zoológicos com pandas-vermelhos",
    "zh": "小熊猫动物园",
  }
}

export const messages = {
  "and": {
    "en": " & ",
    "es": " y ",
    "ja": "と",
    "ko": " & ",
    "ne": " र ",
    "pt": " e ",
    "zh": "和"
  },
  "and_words": {
    "en": " and ",
    "es": " y ",
    "ja": "と",
    "ko": " 그리고 ",
    "ne": " र ",
    "pt": " e ",
    "zh": "和"
  },
  "arrived_from_zoo": {
    "en": ["<INSERTDATE>",
           ", from ",
           "<INSERTZOO>"],
    "es": ["<INSERTDATE>",
           " desde ",
           "<INSERTZOO>"],
    "ja": ["<INSERTDATE>",
           "、",
           "<INSERTZOO>",
           "から"],
    "ko": ["<INSERTDATE>",
           "에서",
           "<INSERTZOO>"],
    "ne": ["<INSERTDATE>",
           " बाट ",
           "<INSERTZOO>"],
    "pt": ["<INSERTDATE>",
           ", desde ",
           "<INSERTZOO>"],
    "zh": ["<INSERTDATE>",
           "，来自",
           "<INSERTZOO>"]
  },
  "autumn": {
    "en": [emoji.autumn,
           " Season of changing colors ",
           emoji.autumn],
    "es": [emoji.autumn,
           " Temporada de colores cambiantes ",
           emoji.autumn],
    "ja": [emoji.autumn,
           " 色が変わる季節 ",
           emoji.autumn],
    "ko": [emoji.autumn,
           "색이 변하는 계절 ",
           emoji.autumn],
    "ne": [emoji.autumn, 
           " रंग परिवर्तन को मौसम ",
           emoji.autumn],
    "pt": [emoji.autumn,
           " Estação de mudança de cores ",
           emoji.autumn],
    "zh": [emoji.autumn, 
           " 变色的季节 ",
           emoji.autumn]
  },
  "baby_photos": {
    "en": [emoji.baby,
           " Precious little angels ",
           emoji.baby],
    "es": [emoji.baby,
           " Angelitos preciosos ",
           emoji.baby],
    "ja": [emoji.baby,
           " 貴重な小さな天使 ",
           emoji.baby],
    "ko": [emoji.baby,
           "소중한 작은 천사들 ",
           emoji.baby],
    "ne": [emoji.baby,
           " बहुमूल्य साना स्वर्गदूतहरू ",
           emoji.baby],
    "pt": [emoji.baby,
           " Anjinhos preciosos ",
           emoji.baby],
    "zh": [emoji.baby,
           " 珍贵的小天使 ",
           emoji.baby]
  },
  "birthday_overflow": {
    "en": [emoji.fireworks,
           " ",
           "<INSERTCOUNT>",
           " birthdays today!"],
    "es": [emoji.fireworks,
           " ¡",
           "<INSERTCOUNT>",
           " cumpleaños hoy!"],
    "ja": [emoji.fireworks,
           " 今日は",
           "<INSERTCOUNT>",
           "歳の誕生日！"],
    "ko": [emoji.fireworks,
           " 오늘 ",
           "<INSERTCOUNT>",
           " 생일!"],
    "ne": [emoji.fireworks,
           " आज ",
           "<INSERTCOUNT>",
           " जन्मदिन!"],
    "pt": [emoji.fireworks,
           " ",
           "<INSERTCOUNT>",
           " aniversários hoje!"],
    "zh": [emoji.fireworks,
           " 今天",
           "<INSERTCOUNT>",
           "个生日！"]
  },
  "closed": {
    "en": [emoji.closed + " ", 
           "Permanently closed on ",
           "<INSERTDATE>"],
    "es": [emoji.closed + " ",
           "Cerrado permanentemente el ",
           "<INSERTDATE>"],
    "ja": [emoji.closed + " ",
           "<INSERTDATE>",
           "に閉業"],
    "ko": [emoji.closed + " ",
           "<INSERTDATE>",
           " 영구 폐쇄"],
    "ne": [emoji.closed + " ",
           "स्थायी रूपमा ",
           "<INSERTDATE>",
           "बन्द भयो"],
    "pt": [emoji.closed + " ", 
           "Permanentemente fechado em ",
           "<INSERTDATE>"],
    "zh": [emoji.closed + " ",
           "<INSERTDATE>",
           "永久关闭"]
  },
  "comma": {
    "en": ", ",
    "es": ", ",
    "ja": "と",
    "ko": ", ",
    "ne": ", ",
    "pt": ", ",
    "zh": "及"
  },
  "credit": {
    "en": [emoji.gift + " ",
           "<INSERTUSER>",
           " has contributed ",
           "<INSERTNUMBER>",
           " photos."],
    "es": [emoji.gift + " ",
           "<INSERTUSER>",
           " ha contribuido con ",
           "<INSERTNUMBER>",
           " fotos."],
    "ja": [emoji.gift + " ",
           "<INSERTUSER>",
           "は",
           "<INSERTNUMBER>",
           "枚の写真を寄稿しました。"],
    "ko": [emoji.gift + " ",
           "<INSERTUSER>",
           "이(가) ",
           "<INSERTNUMBER>",
           "장의 사진을 제공했습니다."],
    "ne": [emoji.gift + " ",
           "<INSERTUSER>",
           " ले ",
           "<INSERTNUMBER>",
           " फोटो योगदान गरेको छ"],
    "pt": [emoji.gift + " ",
           "<INSERTUSER>",
           " contribuiu com ",
           "<INSERTNUMBER>",
           " fotos."],
    "zh": [emoji.gift + " ",
           "<INSERTUSER>",
           "提供了",
           "<INSERTNUMBER>",
           "张照片。"]
  },
  "credit_animal_filter_single": {
    "en": [emoji.gift + " ",
           "<INSERTUSER>",
           " has contributed ",
           "<INSERTNUMBER>",
           " photos of ",
           "<INSERTNAME>",
           "."],
    "es": [emoji.gift + " ",
           "<INSERTUSER>",
           " ha contribuido con ",
           "<INSERTNUMBER>",
           " fotos de ",
           "<INSERTNAME>",
           "."],
    "ja": [emoji.gift + " ",
           "<INSERTUSER>",
           "が",
           "<INSERTNAME>",
           "の写真を",
           "<INSERTNUMBER>",
           "枚投稿しました。"],
    "ko": [emoji.gift + " ",
           "<INSERTUSER>",
           "이(가) ",
           "<INSERTNAME>",
           "의 사진을",
           "<INSERTNUMBER>",
           "장 제공했습니다."],   
    "ne": [emoji.gift + " ",
           "<INSERTUSER>",
           " ",
           "<INSERTNUMBER>",
           " ",
           "<INSERTNAME>",
           " फोटोहरु योगदान गरेको छ"],
    "pt": [emoji.gift + " ",
           "<INSERTUSER>",
           " contribuiu com ",
           "<INSERTNUMBER>",
           " fotos de ",
           "<INSERTNAME>",
           "."],
    "zh": [emoji.gift + " ",
           "<INSERTUSER>",
           "提供了",
           "<INSERTNUMBER>",
           "张",
           "<INSERTNAME>",
           "照片。"]    
  },
  "departed_to_zoo": {
    "en": ["<INSERTZOO>",
           " on ",
           "<INSERTDATE>"],
    "es": ["<INSERTZOO>",
           " al ",
           "<INSERTDATE>"],
    "ja": ["<INSERTDATE>",
           "に",
           "<INSERTZOO>",
           "に行きました"],
    "ko": ["<INSERTZOO>",
           "에서",
           "<INSERTDATE>"],
    "ne": ["<INSERTZOO>",
           " ",
           "<INSERTDATE>",
           " मा"],
    "pt": ["<INSERTZOO>",
           " em ",
           "<INSERTDATE>"],
    "zh": ["<INSERTDATE>",
           "去",
           "<INSERTZOO>"]
  },
  "find_a_nearby_zoo": {
    "en": [emoji.globe_americas, " Find a zoo nearby!"],
    "es": [emoji.globe_americas, " ¡Encuentra un zoológico cerca de ti!"],
    "ja": [emoji.globe_asia, " 近くの動物園を見つける"],
    "ko": [emoji.globe_asia, " 주변 동물원 찾기"],
    "ne": [emoji.globe_asia, " नजिकै चिडियाखाना खोज्नुहोस्"],
    "pt": [emoji.globe_americas, " Encontre um zoológico próximo!"],
    "zh": [emoji.globe_asia, " 寻找附近的动物园"]
  },
  "footer": {
    "en": ["If you love red pandas, please support ",
           "<INSERTLINK_RPN>",
           " as well as your local zoos. Lineage data courtesy of the ",
           "<INSERTLINK_RPF>",
           " project, but linked media remains property of its creators. ",
           "Layout and design ©" +
           "\xa0" +
           "2026 Justin Fairchild."],
    "es": ["Si te encantan los pandas rojos, apoya a ",
           "<INSERTLINK_RPN>",
           " y a los zoológicos locales. Los datos sobre el linaje son cortesía del proyecto ",
           "<INSERTLINK_RPF>",
           " pero los medios vinculados siguen siendo propiedad de sus creadores. ",
           " Maquetación y diseño ©" +
           "\xa0" + 
           "2026 Justin Fairchild."],
    "ja": ["レッサーパンダが好きな人は、地元の動物園だけでなく",
           "<INSERTLINK_RPN>",
           "もサポートしてください。系統データは",
           "<INSERTLINK_RPF>",
           "プロジェクトの好意により提供されていますが、リンクされたメディアは引き続き作成者の所有物です。",
           "設計©2026 Justin Fairchild"],
    "ko": ["레서판다를 사랑한다면, 꼭 응원과 후원을 부탁드려요! ",
           "<INSERTLINK_RPN>",
           " 여러분이 가까이에서 방문할 수 있는 지역 동물원도 응원해 주세요.",
           "<INSERTLINK_RPF>",
           " 데이터는 본 프로젝트의 협조로 제공되며, 연결된 미디어 자료의 저작권은 각 제작자에게 있습니다.",
           "레이아웃 및 디자인 ©" + "\xa0" + "2026 Justin Fairchild."],
    "ne": ["यदि तपाईं निगल्य पोन्या मन पराउनुहुन्छ, कृपया ",
           "<INSERTLINK_RPN>",
           " साथै तपाईंको स्थानीय चिडियाखानालाई समर्थन गर्नुहोस्। ",
           "<INSERTLINK_RPF>",
           " प्रोजेक्टको वंश डाटा शिष्टाचार, तर मिडिया यसको सिर्जनाकर्ताहरूको सम्पत्ति रहन्छ।",
           " लेआउट र डिजाइन प्रतिलिपि अधिकार २०२६ Justin Fairchild द्वारा।"],
    "pt": ["Se você ama pandas-vermelhos, por favor apoie a  ",
           "<INSERTLINK_RPN>",
           " bem como seus zoológicos locais. Dados de linhagem são uma cortesia do projeto ",
           "<INSERTLINK_RPF>",
           ", mas as mídias linkadas seguem sendo propriedade de seus criadores. ",
           "Layout e design ©" +
           "\xa0" +
           "2026 Justin Fairchild."],
    "zh": ["如果你喜爱小熊猫，请支持小熊猫网络（",
           "<INSERTLINK_RPN>",
           "）以及你当地的动物园。",
           "族谱数据归属于",
           "<INSERTLINK_RPF>",
           "但相关媒介内容（如图片等）版权归属于原作者。",
           "布局与设计©2026 Justin Fairchild"]
  },
  "found_animal": {
    "en": [emoji.flower, " ",
           emoji.see_and_say, 
           " ",
           "<INSERTNAME>",
           " has been found and is safe!"],
    "es": [emoji.flower, " ",
           emoji.see_and_say,
           " ¡",
           "<INSERTNAME>",
           " ha sido encontrado y está a salvo!"],
    "ja": [emoji.flower, " ",
           emoji.see_and_say, 
           " ",
           "<INSERTNAME>",
           " has been found and is safe!"],
    "ko": [emoji.flower, " ",
           emoji.see_and_say, 
           " ",
           "<INSERTNAME>",
           "이(가) 발견되었습니다!"],
    "ne": [emoji.flower, " ",
           emoji.see_and_say, 
           " ",
           "<INSERTNAME>",
           " has been found and is safe!"],
    "pt": [emoji.flower, " ",
           emoji.see_and_say, 
           " ",
           "<INSERTNAME>",
           " foi encontrado(a) e está a salvo!"],
    "zh": [emoji.flower, " ",
           emoji.see_and_say, 
           " ",
           "<INSERTNAME>",
           " has been found and is safe!"]
  },
  "goodbye": {
    "en": ["Good-bye, ",
           "<INSERTNAME>",
           ". ",
           emoji.died,
           " (",
           "<INSERTBIRTH>",
           " — ",
           "<INSERTDEATH>",
           ")"],
    "es": ["Hasta siempre, ",
           "<INSERTNAME>",
           ". ",
           emoji.died,
           " (",
           "<INSERTBIRTH>",
           " — ",
           "<INSERTDEATH>",
           ")"],
    "ja": ["ありがとう, ",
           "<INSERTNAME>",
           "。",
           emoji.died, 
           "（",
           "<INSERTBIRTH>",
           " — ",
           "<INSERTDEATH>",
           "）"],
    "ko": ["안녕... 잘 가,",
           "<INSERTNAME>",
           ". ",
           emoji.died,
           " (",
           "<INSERTBIRTH>",
           " — ",
           "<INSERTDEATH>",
           ")"],   
    "ne": ["विदाई, ",
           "<INSERTNAME>",
           " ",
           emoji.died,
           " (",
           "<INSERTBIRTH>",
           " — ",
           "<INSERTDEATH>",
           ")"],
    "pt": ["Adeus, ",
           "<INSERTNAME>",
           ". ",
           emoji.died,
           " (",
           "<INSERTBIRTH>",
           " — ",
           "<INSERTDEATH>",
           ")"],
    "zh": ["后会有期, ",
           "<INSERTNAME>",
           "。",
           emoji.died,
           "（",
           "<INSERTBIRTH>",
           " — ",
           "<INSERTDEATH>",
           "）"]
  },
  "happy_birthday": {
    "en": [emoji.birthday,
           " Happy Birthday, ",
           "<INSERTNAME>",
           "! (",
           "<INSERTNUMBER>",
           ")"],
    "es": [emoji.birthday,
           " ¡Feliz cumpleaños, ",
           "<INSERTNAME>",
           "! (",
           "<INSERTNUMBER>",
           ")"],
    "ja": [emoji.birthday,
           " ",
           "<INSERTNAME>",
           "、誕生日おめでとう！（",
           "<INSERTNUMBER>",
           "歳）"],
    "ko": [emoji.birthday,
           "<INSERTNAME>",
           "의 생일을 축하합니다! (",
           "<INSERTNUMBER>",
           "세)"],
    "ne": [emoji.birthday,
           " ",
           "जन्मदिनको शुभकामना, ",
           "<INSERTNAME>",
           "! (",
           "<INSERTNUMBER>",
           ")"],
    "pt": [emoji.birthday,
           " Feliz aniversário, ",
           "<INSERTNAME>",
           "! (",
           "<INSERTNUMBER>",
           ")"],
    "zh": [emoji.birthday,
           "<INSERTNAME>",
           "生日快乐！（",
           "<INSERTNUMBER>",
           "岁）"]
  },
  "landing_mothersday": {
    "en": ["Happy Mother's Day!"],
    "es": ["¡Feliz Día de la Madre!"],
    "ja": ["母の日おめでとう"],
    "ko": ["어머니의 날!"],
    "ne": ["खुसी आमाको दिन!"],
    "pt": ["Feliz Dia das Mães!"],
    "zh": ["母亲节快乐"]
  },
  "list_comma": {
    "en": ", ",
    "es": ", ",
    "ja": "、",
    "ko": ", ",
    "ne": ", ",
    "pt": ", ",
    "zh": "、",
  },
  "lost_animal": {
    "en": [emoji.alert, " ",
           emoji.see_and_say, 
           " If you see ",
           "<INSERTNAME>",
           ", contact ",
           "<ZOONAME>",
           ": ",
           "<ZOOCONTACT>"],
    "es": [emoji.alert, " ",
           emoji.see_and_say,
           " Si ves a ",
           "<INSERTNAME>",
           " contacta a ",
           "<ZOONAME>",
           ": ",
           "<ZOOCONTACT>"],
    "ja": [emoji.alert, " ",
           emoji.see_and_say, 
           " If you see ",
           "<INSERTNAME>",
           ", contact ",
           "<ZOONAME>",
           ": ",
           "<ZOOCONTACT>"],
    "ko": [emoji.alert, " ",
           emoji.see_and_say, 
           " If you see ",
           "<INSERTNAME>",
           ", contact ",
           "<ZOONAME>",
           ": ",
           "<ZOOCONTACT>"],
    "ne": [emoji.alert, " ",
           emoji.see_and_say, 
           " If you see ",
           "<INSERTNAME>",
           ", contact ",
           "<ZOONAME>",
           ": ",
           "<ZOOCONTACT>"],
    "pt": [emoji.alert, " ",
           emoji.see_and_say, 
           " Se vir ",
           "<INSERTNAME>",
           ", contacte ",
           "<ZOONAME>",
           ": ",
           "<ZOOCONTACT>"],
    "zh": [emoji.alert, " ",
           emoji.see_and_say, 
           " If you see ",
           "<INSERTNAME>",
           ", contact ",
           "<ZOONAME>",
           ": ",
           "<ZOOCONTACT>"]
  },
  "lunch_time": {
    "en": [emoji.paws, " ",
           "What's for lunch?", " ",
           emoji.greens],
    "es": [emoji.paws, " ",
           "¿Qué hay de comer?", " ",
           emoji.greens],
    "ja": [emoji.paws, " ",
           "昼食は何ですか？", " ",
           emoji.greens],
    "ko": [emoji.paws, " ",
           "오늘 점심 메뉴는 무엇인가요?", " ",
           emoji.greens],
    "ne": [emoji.paws, " ",
           "खाजाको लागि के हो?", " ",
           emoji.greens],
    "pt": [emoji.paws, " ",
           "O que tem para o almoço?", " ",
           emoji.greens],
    "zh": [emoji.paws, " ",
           "午饭吃什么？", " ",
           emoji.greens]
  },
  "missing_you": {
    "en": ["We miss you, ",
           "<INSERTNAME>",
           ". ",
           emoji.died,
           " (",
           "<INSERTBIRTH>",
           " — ",
           "<INSERTDEATH>",
           ")"],
    "es": ["Te extrañamos, ",
           "<INSERTNAME>",
           ". ",
           emoji.died,
           " (",
           "<INSERTBIRTH>",
           " — ",
           "<INSERTDEATH>",
           ")"],
    "ja": ["あなたがいなくてとても寂しい, ",
           "<INSERTNAME>",
           "。",
           emoji.died, 
           "（",
           "<INSERTBIRTH>",
           " — ",
           "<INSERTDEATH>",
           "）"],
    "ko": ["보고 싶어,",
           "<INSERTNAME>",
           ". ",
           emoji.died,
           " (",
           "<INSERTBIRTH>",
           " — ",
           "<INSERTDEATH>",
           ")"],
    "ne": ["हामी तिमीलाई सम्झिन्छौं",
           "<INSERTNAME>",
           " ",
           emoji.died,
           " (",
           "<INSERTBIRTH>",
           " — ",
           "<INSERTDEATH>",
           ")"],
    "pt": ["Saudades de você, ",
           "<INSERTNAME>",
           ". ",
           emoji.died,
           " (",
           "<INSERTBIRTH>",
           " — ",
           "<INSERTDEATH>",
           ")"],
    "zh": ["我们想你, ",
           "<INSERTNAME>",
           "。",
           emoji.died,
           "（",
           "<INSERTBIRTH>",
           " — ",
           "<INSERTDEATH>",
           "）"]
  },
  "nearby_zoos": {
    "en": [emoji.website,
           " ",
           emoji.home,
           " Finding nearby zoos. ",
           "If geolocation fails, try ",
           "searching for your city."],
    "es": [emoji.website,
           " ",
           emoji.home,
           " Encontrar zoológicos cercanos. ", 
           "Si la geolocalización falla, intente ",
           " buscar su ciudad."],
    "ja": [emoji.website,
           " ",
           emoji.home,
           " 近くの動物園を見上げます。",
           "ジオロケーションが失敗した場合は、",
           "都市を検索してみてください。"],
    "ko": [emoji.website,
           " ",
           emoji.home,
           " 가까운 동물원을 찾고 있어요. ",
           "위치 정보가 실패하면,",
           "도시 이름으로 검색해보세요."],   
    "ne": [emoji.website, 
           " ",
           emoji.home,
           " नजिकका चिडियाखानाहरू भेट्टाउँदै।",
           " यदि भौगोलिक स्थान असफल भयो भने,",
           " आफ्नो शहरको लागि खोजी प्रयास गर्नुहोस्।"],
    "pt": [emoji.website,
           " ",
           emoji.home,
           " Procurando zoológicos próximos. ",
           "Se a geolocalização falhar, ",
           "tente pesquisar sua cidade."],
    "zh": [emoji.website,
           " ",
           emoji.home,
           " 查找附近的动物园。",
           "如果地理位置失败，",
           "请尝试搜索您的城市。"]
  },
  "new_photos": {
    "contributors": {
      "en": [emoji.giftwrap,
             " ",
             "<INSERTCOUNT>",
             " new contributors"],
      "es": [emoji.giftwrap,
            " ",
            "<INSERTCOUNT>",
            " nuevos contribuyentes"],
      "ja": [emoji.giftwrap,
             "<INSERTCOUNT>",
             "人の新しい貢献者"],
      "ko": [emoji.giftwrap,
             "<INSERTCOUNT>",
             "새 기여자"],
      "ne": [emoji.giftwrap,
             " ",
             "<INSERTCOUNT>",
             " योगदानकर्ताहरू नयाँ"],
      "pt": [emoji.giftwrap,
             " ",
             "<INSERTCOUNT>",
             " novos contribuintes"],
      "zh": [emoji.giftwrap,
             "<INSERTCOUNT>",
             "新贡献者"]
    },
    "pandas": {
      "en": [emoji.profile,
             " ",
             "<INSERTCOUNT>",
             " new red pandas"],
      "es": [emoji.profile,
             " ",
             "<INSERTCOUNT>",
             " nuevos pandas rojos"],
      "ja": [emoji.profile,
             " ",
             "<INSERTCOUNT>",
             "つの新しいレッサーパンダ"],
      "ko": [emoji.profile,
             " ",
             "<INSERTCOUNT>",
             " 새로운 레서판다가 찾아왔어요!"],
      "ne": [emoji.profile,
             " ",
             "<INSERTCOUNT>",
             " निगल्य पोन्या नयाँ"],
      "pt": [emoji.profile,
             " ",
             "<INSERTCOUNT>",
             " novos pandas-vermelhos"],
      "zh": [emoji.profile,
             " ",
             "<INSERTCOUNT>",
             "只新小熊猫"]
    },
    "photos": {
      "en": ["<INSERTCOUNT>",
             " new photos"],
      "es": ["<INSERTCOUNT>",
             " fotos nuevas "],
      "ja": ["<INSERTCOUNT>",
             "枚の新しい写真"],
      "ko": ["<INSERTCOUNT>",
             "장의 새로운 사진"],
      "ne": ["<INSERTCOUNT>",
             " छवि नयाँ"], 
      "pt": ["<INSERTCOUNT>",
             " novas fotos"],
      "zh": ["<INSERTCOUNT>",
             "张新照片"]
    },
    "suffix": {
      "en": [" this week!"],
      "es": [" esta semana."],
      "ja": ["今週！"],
      "ko": [" 이번 주에 추가됨!"],
      "ne": ["यो हप्ता"],
      "pt": [" esta semana!"],
      "zh": ["本星期！"]
    },
    "zoos": {
      "en": [emoji.zoo,
             " ",
             "<INSERTCOUNT>",
             " new zoos"],
      "es": [emoji.zoo,
             " ",
             "<INSERTCOUNT>",
             " nuevos zoológicos"],
      "ja": [emoji.zoo,
             "<INSERTCOUNT>",
             "つの新しい動物園"],
      "ko": [emoji.zoo,
             " ",
             "<INSERTCOUNT>",
             "새로운 동물원"],
      "ne": [emoji.zoo,
             " ",
             "<INSERTCOUNT>",
             " नयाँ चिडियाखाना"],
      "pt": [emoji.zoo,
             " ",
             "<INSERTCOUNT>",
             " novos zoológicos"],
      "zh": [emoji.zoo,
             "<INSERTCOUNT>",
             "个新动物园"]
    }
  },
  "no_result": {
    "en": ["No Pandas Found"],
    "es": ["No Se Encontró Ningún Panda"],
    "ja": ["パンダが見つかりません"],
    "ko": ["검색된 레서판다가 없습니다."],
    "ne": ["कुनै निगल्य पोन्या फेला परेन"],
    "pt": ["Nenhum panda encontrado"],
    "zh": ["没有找到这只小熊猫"]
  },
  "no_group_media_result": {
    "en": ["No Group Photos Found"],
    "es": ["No Se Encontraron Fotos de Grupos"],
    "ja": ["集合写真は見つかりませんでした"],
    "ko": ["검색된 사진이 없습니다."],
    "ne": ["कुनै निगल्य पोन्या समूह भेटिएन"],
    "pt": ["Nenhuma foto de grupo encontrada"],
    "zh": ["找不到合影"]
  },
  "no_subject_tag_result": {
    "en": ["No Tagged Photos"],
    "es": ["Sin Fotos Etiquetadas"],
    "ja": ["このパンダのタグ付けされた写真はありません"],
    "ko": ["태그된 사진이 없습니다."],
    "ne": ["कुनै फोटोहरू ट्याग छैनन्"],
    "pt": ["Nenhuma foto etiquetada"],
    "zh": ["没有关联照片"]
  },
  "no_zoos_nearby": {
    "en": ["No Zoos Nearby"],
    "es": ["No Hay Zoológicos Cerca"],
    "ja": ["近くに動物園はありません"],
    "ko": ["검색된 동물원이 없습니다."],
    "ne": ["नजिकै कुनै चिडियाखाना छैन"],
    "pt": ["Nenhum zoológico próximo"],
    "zh": ["附近没有动物园"]
  },
  "overflow": {
    "en": [" First ",
           "<INSERTLIMIT>",
           " shown."],
    "es": ["Se muestran los primeros ",
           "<INSERTLIMIT>",
           "."],
    "ja": ["最初の",
           "<INSERTLIMIT>",
           "を表示"],
    "ko": ["처음",
           "<INSERTLIMIT>",
           "개만 표시됩니다."],   
    "ne": [" ",
           "<INSERTLIMIT>",
           " मात्र"],
    "pt": [" Mostrando os primeiros ",
           "<INSERTLIMIT>",
           "."],
    "zh": ["显示前",
           "<INSERTLIMIT>",
           "个"]
  },
  "profile_babies_children": {
    "en": ["<INSERTNAME>",
           " has ",
           "<INSERTBABIES>",
           " children."],
    "es": ["<INSERTNAME>",
           " tiene ",
           "<INSERTBABIES>",
           " bebés."],
    "ja": ["<INSERTNAME>",
           "の子供",
           "<INSERTBABIES>",
           "人"],
    "ko": ["<INSERTNAME>",
           "에게는 ",
           "<INSERTBABIES>",
           "마리의 귀여운 자녀가 있어요."],   
    "ne": ["<INSERTNAME>",
           " को ",
           "<INSERTBABIES>",
           " बच्चाहरु छन्"],
    "pt": ["<INSERTNAME>",
           " tem ",
           "<INSERTBABIES>",
           " filhos(as)."],
    "zh": ["<INSERTNAME>",
           "有",
           "<INSERTBABIES>",
           "个孩子"]
  },
  "profile_babies_siblings": {
    "en": ["<INSERTNAME>",
           " has ",
           "<INSERTBABIES>",
           " baby siblings."],
    "es": ["<INSERTNAME>",
           " tiene ",
           "<INSERTBABIES>",
           " hermanos pequeños."],
    "ja": ["<INSERTNAME>",
           "には",
           "<INSERTBABIES>",
           "人の赤ちゃんの兄弟がいます"],
    "ko": ["<INSERTNAME>",
           "에게는 ",
           "<INSERTBABIES>",
           "마리의 형제·자매가 있어요."],   
    "ne": ["<INSERTNAME>",
           " ",
           "<INSERTBABIES>",
           " बच्चाका भाई बहिनीहरू छन्"],
    "pt": ["<INSERTNAME>",
           " tem ",
           "<INSERTBABIES>",
           " irmãos(ãs) bebês."],
    "zh": ["<INSERTNAME>",
           "有",
           "<INSERTBABIES>",
           "个孩子"]
  },
  "profile_brothers": {
    "en": ["<INSERTNAME>",
           " has ",
           "<INSERTBROTHERS>",
           " brothers."],
    "es": ["<INSERTNAME>",
           " tiene ",
           "<INSERTBROTHERS>",
           " hermanos."],
    "ja": ["<INSERTNAME>",
           "には",
           "<INSERTBROTHERS>",
           "人の兄弟がいます"],
    "ko": ["<INSERTNAME>",
           "에게는 ",
           "<INSERTBROTHERS>",
           "마리의 형제가 있어요."],   
    "ne": ["<INSERTNAME>",
           " छ ",
           "<INSERTBROTHERS>",
           " भाइहरु"],
    "pt": ["<INSERTNAME>",
           " tem ",
           "<INSERTBROTHERS>",
           " irmãos."],
    "zh": ["<INSERTNAME>",
           "有",
           "<INSERTBROTHERS>",
           "个兄弟"]
  },
  "profile_brothers_babies": {
    "en": ["<INSERTNAME>",
           " has ",
           "<INSERTBROTHERS>",
           " brothers and ",
           "<INSERTBABIES>",
           " newborns."],
    "es": ["<INSERTNAME>",
           " tiene ",
           "<INSERTBROTHERS>",
           " hermanos y ",
           "<INSERTBABIES>",
           " hermanitos."],
    "ja": ["<INSERTNAME>",
           "には",
           "<INSERTBROTHERS>",
           "人の兄弟と",
           "<INSERTBABIES>",
           "人の赤ちゃんの兄弟がいます"],
    "ko": ["<INSERTNAME>",
           "에게는 ",
           "<INSERTBROTHERS>",
           "마리의 형제와 ",
           "<INSERTBABIES>",
           "마리의 아기가 있어요."],
    "ne": ["<INSERTNAME>",
           " छ ",
           "<INSERTBROTHERS>",
           " भाइहरु र ",
           "<INSERTBABIES>",
           " नवजात शिशुहरू"],
    "pt": ["<INSERTNAME>",
           " tem ",
           "<INSERTBROTHERS>",
           " irmãos e ",
           "<INSERTBABIES>",
           " irmãos(ãs) bebês."],
    "zh": ["<INSERTNAME>",
           "有",
           "<INSERTBROTHERS>",
           "个姐妹",
           "<INSERTBABIES>",
           "个新生儿"]
  },
  "profile_children": {
    "en": ["<INSERTNAME>",
           " has ",
           "<INSERTTOTAL>",
           " children: ",
           "<INSERTDAUGHTERS>",
           " girls and ",
           "<INSERTSONS>",
           " boys!"],
    "es": ["<INSERTNAME>",
           " tiene ",
           "<INSERTTOTAL>",
           " hijos: ",
           "<INSERTDAUGHTERS>",
           " niñas y ",
           "<INSERTSONS>",
           " niños."],
    "ja": ["<INSERTNAME>",
           "には",
           "<INSERTTOTAL>",
           "人の子供がいます：",
           "<INSERTDAUGHTERS>",
           "人の女の子と",
           "<INSERTSONS>",
           "人の男の子"],
    "ko": ["<INSERTNAME>",
           "에게는 총 ",
           "<INSERTTOTAL>",
           "마리의 자녀가 있어요. ",
           "<INSERTDAUGHTERS>",
           "마리의 딸, ",
           "<INSERTSONS>",
           "마리의 아들이 있어요!"],
    "ne": ["<INSERTNAME>",
           " छ ",
           "<INSERTTOTAL>",
           " बच्चाहरु: ",
           "<INSERTDAUGHTERS>",
           " छोरीहरू र ",
           "<INSERTSONS>",
           " छोराहरू!"],
    "pt": ["<INSERTNAME>",
           " tem ",
           "<INSERTTOTAL>",
           " filhos: ",
           "<INSERTDAUGHTERS>",
           " meninas e ",
           "<INSERTSONS>",
           " meninos!"],
    "zh": ["<INSERTNAME>",
           "一共有",
           "<INSERTTOTAL>",
           "个孩子: ",
           "<INSERTDAUGHTERS>",
           "个女儿和",
           "<INSERTSONS>",
           "个儿子！"]
  },
  "profile_children_babies": {
    "en": ["<INSERTNAME>",
           " has ",
           "<INSERTTOTAL>",
           " children: ",
           "<INSERTDAUGHTERS>",
           " girls, ",
           "<INSERTSONS>",
           " boys, and ",
           "<INSERTBABIES>",
           " newborns!"],
    "es": ["<INSERTNAME>",
           " tiene ",
           "<INSERTTOTAL>",
           " hijos: ",
           "<INSERTDAUGHTERS>",
           " niñas, ",
           "<INSERTSONS>",
           " niños, y ",
           "<INSERTBABIES>",
           " recién nacidos."],
    "ja": ["<INSERTNAME>",
           "には",
           "<INSERTTOTAL>",
           "人の子供がいます：",
           "<INSERTDAUGHTERS>",
           "人の女の子と、",
           "<INSERTSONS>",
           "人の男の子、および",
           "<INSERTBABIES>",
           "人の子供"],
    "ko": ["<INSERTNAME>",
           "에게는 총",
           "<INSERTTOTAL>",
           "마리의 자녀가 있어요: ",
           "<INSERTDAUGHTERS>",
           "마리의 딸, ",
           "<INSERTSONS>",
           "마리의 아들, 그리고 ",
           "<INSERTBABIES>",
           "마리의 갓 태어난 아기예요!"],   
    "ne": ["<INSERTNAME>",
           " छ ",
           "<INSERTTOTAL>",
           " बच्चाहरु: ",
           "<INSERTDAUGHTERS>",
           " छोरीहरू, ",
           "<INSERTSONS>",
           " छोराहरू र ",
           "<INSERTBABIES>",
           " बच्चाहरु!"],
    "pt": ["<INSERTNAME>",
           " tem ",
           "<INSERTTOTAL>",
           " filhos: ",
           "<INSERTDAUGHTERS>",
           " meninas, ",
           "<INSERTSONS>",
           " meninos e ",
           "<INSERTBABIES>",
           " recém-nascidos(as)!"],
    "zh": ["<INSERTNAME>",
           "一共有",
           "<INSERTTOTAL>",
           "个孩子: ",
           "<INSERTDAUGHTERS>",
           "个女儿，",
           "<INSERTSONS>",
           "个儿子，以及",
           "<INSERTBABIES>",
           "个新生儿！"]
  },
  "profile_daughters": {
    "en": ["<INSERTNAME>",
           " has ",
           "<INSERTDAUGHTERS>",
           " daughters."],
    "es": ["<INSERTNAME>",
           " tiene ",
           "<INSERTDAUGHTERS>",
           " niñas."],
    "ja": ["<INSERTNAME>",
           "には",
           "<INSERTDAUGHTERS>",
           "人の娘がいます"],
    "ko": ["<INSERTNAME>",
           "에게는 ",
           "<INSERTDAUGHTERS>",
           "마리의 딸이 있어요!"],
    "ne": ["<INSERTNAME>",
           " छ ",
           "<INSERTDAUGHTERS>",
           " छोरीहरू"],
    "pt": ["<INSERTNAME>",
           " tem ",
           "<INSERTDAUGHTERS>",
           " filhas."],
    "zh": ["<INSERTNAME>",
           "有",
           "<INSERTDAUGHTERS>",
           "个女儿"]
  },
  "profile_daughters_babies": {
    "en": ["<INSERTNAME>",
           " has ",
           "<INSERTDAUGHTERS>",
           " daughters and ",
           "<INSERTBABIES>",
           " newborns!"],
    "es": ["<INSERTNAME>",
           " tiene ",
           "<INSERTDAUGHTERS>",
           " niñas y ",
           "<INSERTBABIES>",
           " recién nacidos."],
    "ja": ["<INSERTNAME>",
           "には",
           "<INSERTDAUGHTERS>",
           "人の娘と",
           "<INSERTBABIES>",
           "人の子供がいます"],
    "ko": ["<INSERTNAME>",
           "에게는 ",
           "<INSERTDAUGHTERS>",
           "마리의 딸과, ",
           "<INSERTBABIES>",
           "마리의 갓 태어난 아기가 있어요!"],
    "ne": ["<INSERTNAME>",
           " छ ",
           "<INSERTDAUGHTERS>",
           " छोरीहरू र ",
           "<INSERTBABIES>",
           " बच्चाहरु"],
    "pt": ["<INSERTNAME>",
           " tem ",
           "<INSERTDAUGHTERS>",
           " filhas e ",
           "<INSERTBABIES>",
           " recém-nascidos(as)!"],
    "zh": ["<INSERTNAME>",
           "有",
           "<INSERTDAUGHTERS>",
           "个女儿和",
           "<INSERTBABIES>",
           "个新生儿！"]
  },
  "profile_family": {
    "en": ["<INSERTNAME>",
           "'s Immediate Family"],
    "es": ["Familia inmediata de ",
           "<INSERTNAME>"],
    "ja": ["<INSERTNAME>",
           "の直近の家族"],
    "ko": ["<INSERTNAME>",
           "의 직계 가족"],
    "ne": ["<INSERTNAME>",
           "को निकट परिवार"],
    "pt": ["Família imediata de ",
           "<INSERTNAME>"],
    "zh": ["<INSERTNAME>",
           "的直系亲属"]
  },
  "profile_sisters": {
    "en": ["<INSERTNAME>",
           " has ",
           "<INSERTSISTERS>",
           " sisters."],
    "es": ["<INSERTNAME>",
           " tiene ",
           "<INSERTSISTERS>",
           " hermanas."],
    "ja": ["<INSERTNAME>",
           "には",
           "<INSERTSISTERS>",
           "の姉妹がいます"],
    "ko": ["<INSERTNAME>",
           "에게는 ",
           "<INSERTSISTERS>",
           "마리의 자매가 있어요."],
    "ne": ["<INSERTNAME>",
           " छ ",
           "<INSERTSISTERS>",
           " बहिनीहरू"],
    "pt": ["<INSERTNAME>",
           " tem ",
           "<INSERTSISTERS>",
           " irmãs."],
    "zh": ["<INSERTNAME>",
           "有",
           "<INSERTSISTERS>",
           "个姐妹"]
  },
  "profile_sisters_babies": {
    "en": ["<INSERTNAME>",
           " has ",
           "<INSERTSISTERS>",
           " sisters and ",
           "<INSERTBABIES>",
           " newborns."],
    "es": ["<INSERTNAME>",
           " tiene ",
           "<INSERTSISTERS>",
           " hermanas y ",
           "<INSERTBABIES>",
           " hermanitos."],
    "ja": ["<INSERTNAME>",
           "には",
           "<INSERTSISTERS>",
           "の姉妹と",
           "<INSERTBABIES>",
           "人の赤ちゃんの兄弟がいます"],
    "ko": ["<INSERTNAME>",
           "은(는) ",
           "<INSERTSISTERS>",
           "자매와 ",
           "<INSERTBABIES>",
           "아이가 있어요."],
    "ne": ["<INSERTNAME>",
           " छ ",
           "<INSERTSISTERS>",
           " बहिनीहरू र ",
           "<INSERTBABIES>",
           " बच्चा भाई बहिनीहरू"],
    "pt": ["<INSERTNAME>",
           " tem ",
           "<INSERTSISTERS>",
           " irmãs e ",
           "<INSERTBABIES>",
           " irmãos(ãs) bebês."],
    "zh": ["<INSERTNAME>",
           "有",
           "<INSERTSISTERS>",
           "个姐妹和",
           "<INSERTBABIES>",
           "个新生儿"]
  },
  "profile_siblings": {
    "en": ["<INSERTNAME>",
           " has ",
           "<INSERTTOTAL>",
           " siblings: ",
           "<INSERTSISTERS>",
           " sisters and ",
           "<INSERTBROTHERS>",
           " brothers!"],
    "es": ["¡",
           "<INSERTNAME>",
           " tiene ",
           "<INSERTTOTAL>",
           " hermanos: ",
           "<INSERTSISTERS>",
           " hembras y ",
           "<INSERTBROTHERS>",
           " machos!"],
    "ja": ["<INSERTNAME>",
           "には",
           "<INSERTTOTAL>",
           "人の兄弟がいます。",
           "<INSERTSISTERS>",
           "人の姉妹と",
           "<INSERTBROTHERS>",
           "人の兄弟"],
    "ko": ["<INSERTNAME>",
           "은(는) ",
           "<INSERTTOTAL>",
           "형제·자매, ",
           "<INSERTSISTERS>",
           "자매와 ",
           "<INSERTBROTHERS>",
           "형제가 있어요."],
    "ne": ["<INSERTNAME>",
           " छ ",
           "<INSERTTOTAL>",
           " भाइबहिनीहरू: ",
           "<INSERTSISTERS>",
           " बहिनीहरू र ",
           "<INSERTBROTHERS>",
           " भाइहरु"],
    "pt": ["<INSERTNAME>",
           " tem ",
           "<INSERTTOTAL>",
           " irmãos: ",
           "<INSERTSISTERS>",
           " fêmeas e ",
           "<INSERTBROTHERS>",
           " machos!"],
    "zh": ["<INSERTNAME>",
           "有",
           "<INSERTTOTAL>",
           "个同胞: ",
           "<INSERTSISTERS>",
           "个姐妹和",
           "<INSERTBROTHERS>",
           "个兄弟！"]
  },
  "profile_siblings_babies": {
    "en": ["<INSERTNAME>",
           " has ",
           "<INSERTTOTAL>",
           " siblings: ",
           "<INSERTSISTERS>",
           " sisters, ",
           "<INSERTBROTHERS>",
           " brothers, and ",
           "<INSERTBABIES>",
           " newborns!"],
    "es": ["¡",
           "<INSERTNAME>",
           " tiene ",
           "<INSERTTOTAL>",
           " hermanos: ",
           "<INSERTSISTERS>",
           " hembras, ",
           "<INSERTBROTHERS>",
           " machos, y ",
           "<INSERTBABIES>",
           " hermanitos!"],
    "ja": ["<INSERTNAME>",
           "には",
           "<INSERTTOTAL>",
           "人の兄弟がいます：",
           "<INSERTSISTERS>",
           "人の姉妹、",
           "<INSERTBROTHERS>",
           "人の兄弟、および",
           "<INSERTBABIES>",
           "人の赤ちゃんの兄弟"],
    "ko": ["<INSERTNAME>",
           "은(는) ",
           "<INSERTTOTAL>",
           "형제· 자매가 있어요."],
    "ne": ["<INSERTNAME>",
           " छ ",
           "<INSERTTOTAL>",
           " भाइबहिनीहरू: ",
           "<INSERTSISTERS>",
           " बहिनीहरू, ",
           "<INSERTBROTHERS>",
           " भाइहरु र ",
           "<INSERTBABIES>",
           " बच्चाहरु!"],
    "pt": ["<INSERTNAME>",
           " tem ",
           "<INSERTTOTAL>",
           " irmãos: ",
           "<INSERTSISTERS>",
           " fêmeas, ",
           "<INSERTBROTHERS>",
           " machos e ",
           "<INSERTBABIES>",
           " irmãos(ãs) bebês!"],
    "zh": ["<INSERTNAME>",
           "有",
           "<INSERTTOTAL>",
           "个同胞：",
           "<INSERTSISTERS>",
           "个姐妹，",
           "<INSERTBROTHERS>",
           "个兄弟，以及",
           "<INSERTBABIES>",
           "个新生儿！"]
  },
  "profile_sons": {
    "en": ["<INSERTNAME>",
           " has ",
           "<INSERTSONS>",
           " sons."],
    "es": ["<INSERTNAME>",
           " tiene ",
           "<INSERTSONS>",
           " niños."],
    "ja": ["<INSERTNAME>",
           "の息子は",
           "<INSERTSONS>",
           "人です"],
    "ko": ["<INSERTNAME>",
           "은(는) ",
           "<INSERTSONS>",
           "남자 아이가 있어요."],
    "ne": ["<INSERTNAME>",
           " छ ",
           "<INSERTSONS>",
           " छोराहरू"],
    "pt": ["<INSERTNAME>",
           " tem ",
           "<INSERTSONS>",
           " filhos."],
    "zh": ["<INSERTNAME>",
           "有",
           "<INSERTSONS>",
           "个儿子"]
  },
  "profile_sons_babies": {
    "en": ["<INSERTNAME>",
           " has ",
           "<INSERTSONS>",
           " sons and ",
           "<INSERTBABIES>",
           " newborns!"],
    "es": ["<INSERTNAME>",
           " tiene ",
           "<INSERTSONS>",
           " niños y ",
           "<INSERTBABIES>",
           " recién nacidos."],
    "ja": ["<INSERTNAME>",
           "には",
           "<INSERTSONS>",
           "人の息子と",
           "<INSERTBABIES>",
           "人の子供がいます"],
    "ko": ["<INSERTNAME>",
           "은(는) ",
           "<INSERTSONS>",
           "남자 아이와 ",
           "<INSERTBABIES>",
           "아이가 있어요."],
    "ne": ["<INSERTNAME>",
           " छ ",
           "<INSERTSONS>",
           " छोराहरू र ",
           "<INSERTBABIES>",
           " बच्चाहरु!"],
    "pt": ["<INSERTNAME>",
           " tem ",
           "<INSERTSONS>",
           " filhos e ",
           "<INSERTBABIES>",
           " recém-nascidos(as)!"],
    "zh": ["<INSERTNAME>",
           "有",
           "<INSERTSONS>",
           "个儿子和",
           "<INSERTBABIES>",
           "个新生儿！"]
  },
  "profile_where": {
    "en": ["Where has ",
           "<INSERTNAME>",
           " lived?"],
    "es": ["Donde ha vivido ",
           "<INSERTNAME>",
           "?"],
    "ja": ["<INSERTNAME>",
           "はどこに住んでいましたか？"],
    "ko": ["<INSERTNAME>",
           "은(는) 어디에서 사나요?"],
    "ne": ["<INSERTNAME>",
           " कहाँ बस्यो?"],
    "pt": ["Onde ",
           "<INSERTNAME>",
           " já morou?"],
    "zh": ["<INSERTNAME>",
           "住在哪里？"]
  },
  "remembering_you_together": {
    "en": [emoji.hearts, " ",
           "<INSERTNAMES>",
           ": We will never forget you. ",
           " ", emoji.paws],
    "es": [emoji.hearts, " ",
           "<INSERTNAMES>",
           ": Nosotros nunca te olvidaremos. ",
           " ", emoji.paws],
    "ja": [emoji.hearts, " ",
           "<INSERTNAMES>",
           "〜私たちは君を決して忘れません。",
           emoji.paws],
    "ko": [emoji.hearts, " ",
           "<INSERTNAMES>",
           ": 우리는 너를 절대 잊지 않을 거야.",
           emoji.paws],
    "ne": [emoji.hearts, " ",
           "<INSERTNAMES>",
           ": हामी तिमीलाई कहिल्यै बिर्सिने छैनौं। ",
           emoji.paws],
    "pt": [emoji.hearts, " ",
           "<INSERTNAMES>",
           ": Nunca esqueceremos de você. ",
           " ", emoji.paws],
    "zh": [emoji.hearts, " ",
           "<INSERTNAMES>",
           ": 我们永远不会忘记你。",
           emoji.paws]
  },
  "shovel_pandas": {
    "en": [emoji.dig, " ",
           "Searching for buried treasure!", " ",
           emoji.treasure],
    "es": [emoji.dig, " ",
           "¡Buscando tesoros enterrados!", " ",
           emoji.treasure],
    "ja": [emoji.dig, " ",
           "埋蔵金を探す", " ",
           emoji.treasure],
    "ko": [emoji.dig, " ",
           "숨겨진 보물을 찾고 있어요!", " ",
           emoji.treasure],
    "ne": [emoji.dig, " ",
           "गाडिएको खजाना खोजी गर्दै", " ",
           emoji.treasure],
    "pt": [emoji.dig, " ",
           "Procurando o tesouro enterrado!", " ",
           emoji.treasure],
    "zh": [emoji.dig, " ",
           "寻找埋藏的宝藏", " ",
           emoji.treasure]
  },
  "tag_combo": {
    "en": [" combo: ",
           "<INSERTNUM>",
           " photos."],
    "es": [" combo: ",
           "<INSERTNUM>",
           " fotos."],
    "ja": ["コンボ検索:",
           "<INSERTNUM>",
           "写真。"],
    "ko": ["콤보 검색:",
           "<INSERTNUM>",
           "사진."],
    "ne": ["कम्बो: ",
           "<INSERTNUM>",
           " फोटोहरू"],
    "pt": [" combo: ",
           "<INSERTNUM>",
           " fotos."],
    "zh": ["组合搜索:",
           "<INSERTNUM>",
           "相片。"]
  },
  "tag_subject": {
    "en": ["<INSERTNUM>",
           " ",
           "<INSERTNAME>",
           " photos tagged ",
           "<INSERTEMOJI>",
           " ",
           "<INSERTTAG>",
           "."],
    "es": ["<INSERTNUM>",
           " fotos ",
           "<INSERTNAME>",
           " etiquetadas con la palabra ",
           "<INSERTTAG>",
           "."],
    "ja": ["<INSERTNUM>",
           "枚の",
           "<INSERTNAME>",
           "の",
           "<INSERTEMOJI>",
           "<INSERTTAG>",
           "。"],
    "ko": ["<INSERTNUM>",
           "장의 ",
           "<INSERTNAME>",
           " 사진이 ",
           "<INSERTEMOJI>",
           " ",
           "<INSERTTAG>",
           "으로(로) 태그되었습니다."],
    "ne": ["<INSERTNUM>",
           " ",
           "<INSERTNAME>",
           " फोटोहरू ट्याग गरियो ",
           "<INSERTEMOJI>",
           " ",
           "<INSERTTAG>",
           "।"],
    "pt": ["<INSERTNUM>",
           " ",
           "<INSERTNAME>",
           " fotos etiquetadas com ",
           "<INSERTEMOJI>",
           " ",
           "<INSERTTAG>",
           "."],
    "zh": ["<INSERTNUM>",
           "张",
           "<INSERTNAME>",
           "<INSERTEMOJI>",
           "<INSERTTAG>",
           "的照片"]
  },
  "trick_or_treat": {
    "en": [emoji.pumpkin, " ",
           "Trick or Treat", " ",
           emoji.pumpkin],
    "es": [emoji.pumpkin, " ",
           "¡Truco o trato!", " ",
           emoji.pumpkin],
    "ja": [emoji.pumpkin, " ",
           "不気味なカボチャ", " ",
           emoji.pumpkin],
    "ko": [emoji.pumpkin, " ",
           "사탕 안 주면 장난칠 거야!", " ",
           emoji.pumpkin],
    "ne": [emoji.pumpkin, " ",
           "डरलाग्दो कद्दु", " ",
           emoji.pumpkin],
    "pt": [emoji.pumpkin, " ",
           "Gostosuras ou travessuras", " ",
           emoji.pumpkin],
    "zh": [emoji.pumpkin, " ",
           "怪异的南瓜", " ",
           emoji.pumpkin]
  },
  "zoo_details_babies": {
    "en": [emoji.baby,
           " ",
           "<INSERTBABIES>",
           " cubs born since ",
           "<INSERTYEAR>"],
    "es": [emoji.baby,
           " ",
           "<INSERTBABIES>",
           " cachorros nacidos desde ",
           "<INSERTYEAR>"],
    "ja": [emoji.baby,
           " ",
           "<INSERTYEAR>",
           "年から生まれた",
           "<INSERTBABIES>",
           "人の赤ちゃん"],
    "ko": [emoji.baby,
           " ",
           "<INSERTYEAR>",
           "년에 태어난 아기는 ",
           "<INSERTBABIES>",
           "마리예요."],
    "ne": [emoji.baby,
           " ",
           "<INSERTBABIES>",
           " पछि बच्चा जन्मे ",
           "<INSERTYEAR>"],
    "pt": [emoji.baby,
           " ",
           "<INSERTBABIES>",
           " filhotes nascidos desde ",
           "<INSERTYEAR>"],
    "zh": [emoji.baby,
           " ",
           "自",
           "<INSERTYEAR>",
           "年以来出生的",
           "<INSERTBABIES>",
           "名婴儿"]
  },
  "zoo_details_departures": {
    "en": [emoji.truck,
           " ",
           "<INSERTNUM>", 
           " recent departures"],
    "es": [emoji.truck,
           " ",
           "<INSERTNUM>",
           " partidas recientes."],
    "ja": [emoji.truck,
           " ",
           "最近の",
           "<INSERTNUM>",
           "回の出発"],
    "ko": [emoji.truck,
           " ",
           "최근에 이동한 ",
           "<INSERTNUM>",
           "마리의 레서판다"],
    "ne": [emoji.truck,
           " ",
           "<INSERTNUM>",
           " भर्खरको प्रस्थान"],
    "pt": [emoji.truck,
           " ",
           "<INSERTNUM>", 
           " partidas recentes"],
    "zh": [emoji.truck,
           " ",
           "<INSERTNUM>",
           "最近出发"]
  },
  "zoo_details_pandas_live_here": {
    "en": [emoji.panda,
           " ",
           "<INSERTNUM>",
           " red pandas live here"],
    "es": [emoji.panda,
           " Hay ",
           "<INSERTNUM>",
           " panda rojos en este zoológico"],
    "ja": [emoji.panda,
           " ",
           "ここに",
           "<INSERTNUM>",
           "匹のレッサーパンダが住んでいます"],
    "ko": [emoji.panda,
           " ",
           "이곳에는 ",
           "<INSERTNUM>",
           "마리의 레서판다가 살고 있어요."],
    "ne": [emoji.panda,
           " ",
           "<INSERTNUM>",
           " पांडा यहाँ बस्छन्"],
    "pt": [emoji.panda,
           " ",
           "<INSERTNUM>",
           " pandas-vermelhos moram aqui"],
    "zh": [emoji.panda,
           " ",
           "<INSERTNUM>",
           "只大熊猫住在这里"]
  },
  "zoo_details_no_pandas_live_here": {
    "en": [emoji.panda,
           " ",
           "No red pandas currently here"],
    "es": [emoji.panda,
           " ",
           "Por ahora aquí no hay pandas rojos."],
    "ja": [emoji.panda,
           " ",
           "パンダが見つかりません"],
    "ko": [emoji.panda,
           " ",
           "이곳에는 레서판다가 없어요."],
    "ne": [emoji.panda,
           " ",
           "कुनै निगल्य पोन्या फेला परेन"],
    "pt": [emoji.panda,
           " ",
           "Nenhum panda-vermelho atualmente aqui"],
    "zh": [emoji.panda,
           " ",
           "没有找到这只小熊猫"]
  },
  "zoo_details_records": {
    "en": [emoji.recordbook,
           " ",
           "<INSERTNUM>",
           " recorded in the database since ",
           "<INSERTYEAR>"],
    "es": [emoji.recordbook,
           " ",
           "<INSERTNUM>",
           " registrados aquí desde ",
           "<INSERTYEAR>"],
    "ja": [emoji.recordbook,
           " ",
           "<INSERTYEAR>",
           "年からデータベースに記録された",
           "<INSERTNUM>"],
    "ko": [emoji.recordbook,
           " ",
           "<INSERTYEAR>",
           "년부터 데이터베이스에 저장된 ",
           "<INSERTNUM>",
           "개의 기록이 있어요."],      
    "ne": [emoji.recordbook,
           " ",
           "<INSERTNUM>",
           " रेचोर्ड्स इन द दताबसे सिन्के ",
           "<INSERTYEAR>"],
    "pt": [emoji.recordbook,
           " ",
           "<INSERTNUM>",
           " registrados na base de dados desde ",
           "<INSERTYEAR>"],
    "zh": [emoji.recordbook,
           " ",
           "自",
           "<INSERTYEAR>",
           "年以来",
           "<INSERTNUM>",
           "个记录在数据库中"]
  },
  "zoo_header_new_arrivals": {
    "en": [emoji.fireworks,
           " ",
           "New Arrivals"],
    "es": [emoji.fireworks,
           " ",
           "Los recién llegados"],
    "ja": [emoji.fireworks,
           " ",
           "新着"],
    "ko": [emoji.fireworks,
           " ",
           "새로운 친구들"],
    "ne": [emoji.fireworks,
           " ",
           "नयाँ आगमन"],
    "pt": [emoji.fireworks,
           " ",
           "Novas chegadas"],
    "zh": [emoji.fireworks,
           " ",
           "新来的"]
  },
  "zoo_header_other_pandas": {
    "en": [emoji.panda,
           " ",
           "Other Pandas at ",
           "<INSERTZOO>"],
    "es": [emoji.panda,
           " ",
           "Otros pandas en ",
           "<INSERTZOO>"],
    "ja": [emoji.panda,
           " ",
           "<INSERTZOO>",
           "の他のパンダ"],
    "ko": [emoji.panda,
           " ",
           "<INSERTZOO>",
           "의 다른 레서판다들"],   
    "ne": [emoji.panda,
           " ",
           "<INSERTZOO>",
           " अन्य पोन्या"],
    "pt": [emoji.panda,
           " ",
           "Outros pandas em ",
           "<INSERTZOO>"],
    "zh": [emoji.panda,
           " ",
           "<INSERTZOO>",
           "里的其他小熊猫"]
  },
  "zoo_header_recently_departed": {
    "en": [emoji.truck,
           " ",
           "Recently Departed"],
    "es": [emoji.truck,
           " ",
           "Hace poco se fueron"],
    "ja": [emoji.truck,
           " ",
           "最近出発しました"],
    "ko": [emoji.truck,
           " ",
           "최근에 떠난 친구들"],
    "ne": [emoji.truck,
           " ",
           "भर्खर प्रस्थान"],
    "pt": [emoji.truck,
           " ",
           "Partiram recentemente"],
    "zh": [emoji.truck,
           " ",
           "最近离开"]
  }
}

// These are tags in some contexts, and keywords in others
export const polyglots = {
  "baby": {
 "emoji": [emoji.baby],
    "en": ["baby", "babies", "Baby", "Aka-chan", "Akachan"],
    "es": ["bebé", "bebe", "bebés", "bebes"],
    "ja": ["赤", "赤ちゃん"],
    "ko": ["아기"],
    "ne": ["बच्चा"],
    "pt": ["bebê", "bebês", "bebé", "bebés"],
    "zh": ["宝宝", "婴儿", "婴儿们"]
  }
}

// Search tag translations for searching photos by metadata.
// Limit to 100 photos returned by default, but they don't 
// have to be the same 100 returned each time.
// TODO: duplicate tag management (baby)
// TODO: romanji for japanese terms
export const tags = {
  "air tasting": {
    "emoji": [emoji.tongue + 
              emoji.butterfly],
       "en": ["air tasting", 
              "air taste"],
       "es": ["saboreando el aire"],
       "ja": ["舌ヒラヒラ"],
       "ko": ["공기 맛보기"],
       "ne": ["हावा चाख्ने"],
       "pt": ["degustando o ar", "gosto do ar"],
       "zh": ["尝尝空气"]
  },
  "apple time": {
    "emoji": [emoji.apple],
       "en": ["apple time", "apple"],
       "es": ["hora de la manazana", "manzana"],
       "ja": ["りんごタイム", "りんご"],
       "ko": ["사과 냠냠", "사과"],
       "ne": ["स्याउ समय", "स्याउ"],
       "pt": ["maçã", "hora da maçã"],
       "zh": ["苹果时间", "苹果"]
  },
  "autumn": {
    "emoji": [emoji.autumn],
       "en": ["autumn", "fall"],
       "es": ["otoño"],
       "ja": ["秋"],
       "ko": ["가을"],
       "ne": ["शरद तु"],
       "pt": ["outono"],
       "zh": ["秋天"]
  },
  "bamboo": {
    "emoji": [emoji.bamboo],
       "en": ["bamboo"],
       "es": ["bambú", "bambu"],
       "ja": ["笹", "竹"],
       "ko": ["대나무", "대나무"],
       "ne": ["बाँस"],
       "pt": ["bambu"],
       "zh": ["竹子", "竹"]
  },
  "bear worm": {
    "emoji": [emoji.caterpillar],
       "en": ["bear worm", "bear-worm"],
       "es": ["gusan-oso", "gusanoso"],
       "ja": ["のびのび"],
       "ko": ["철푸덕"],
       "ne": ["कीरा भालु"],
       "pt": ["relaxado"],
       "zh": ["蠕动"]
  },
  "bite": {
    "emoji": [emoji.tooth],
       "en": ["bite"],
       "es": ["morder"],
       "ja": ["一口"],
       "ko": ["깨물기"],
       "ne": ["काट्नु"],
       "pt": ["mordida"],
       "zh": ["咬", "吃"]
  },
  "blink": {
    "emoji": [emoji.blink],
       "en": ["blink", "blinking"],
       "es": ["parpadear", "parpadeo"],
       "ja": ["まばたき"],
       "ko": ["눈 깜빡임"],
       "ne": ["झिम्काइ"],
       "pt": ["pestanejando", "pestanejo"],
       "zh": ["眨眼"]
  },
  "bridge": {
    "emoji": [emoji.bridge],
       "en": ["bridge"],
       "es": ["puente"],
       "ja": ["吊り橋・渡し木", "架け橋"],
       "ko": ["다리"],
       "ne": ["पुल"],
       "pt": ["ponte"],
       "zh": ["吊桥", "桥"]
  },
  "brothers": {
    "emoji": [emoji.brothers],
       "en": ["brothers", "bros"],
       "es": ["hermanos"],
       "ja": ["男兄弟"],
       "ko": ["형제"],
       "ne": ["भाइहरु"],
       "pt": ["irmãos"],
       "zh": ["兄弟"]
  },
  "carry": {
    "emoji": [emoji.carry],
       "en": ["carry", "holding"],
       "es": ["llevando", "sosteniendo"],
       "ja": ["笹運び", "枝運び", "運ぶ"],
       "ko": ["배송"],
       "ne": ["बोक्नु", "समात्नु"],
       "pt": ["levando", "carregando", "segurando"],
       "zh": ["运", "拿"]
  },
  "cherry blossoms": {
    "emoji": [emoji.cherry_blossom],
       "en": ["cherry blossoms", "cherry blossom"],
       "es": ["flor de cerezo", "flores de cerezo"],
       "ja": ["桜"],
       "ko": ["벚꽃"],
       "ne": ["चेरी खिल"],
       "pt": ["flor de cerejeira", "flores de cerejeira", "flor de cereja", "flores de cereja"],
       "zh": ["樱花"]
  },
  "climb": {
    "emoji": [emoji.climb],
       "en": ["climb", "climbing"],
       "es": ["trepando", "escalando"],
       "ja": ["木登り", "登る"],
       "ko": ["등산"],
       "ne": ["चढाई"],
       "pt": ["escalando", "subindo"],
       "zh": ["爬"]
  },
  "close-up": {
    "emoji": [emoji.close_up],
       "en": ["close-up", "closeup", "close"],
       "es": ["de cerca", "cerca"],
       "ja": ["閉じる"],
       "ko": ["가까이 보기"],
       "ne": ["क्लोज-अप", "नजिक"],
       "pt": ["fechar-se", "perto"],
       "zh": ["特写"]
  },
  "couple": {
    "emoji": [emoji.couple],
       "en": ["couple", "partners"],
       "es": ["pareja"],
       "ja": ["カップル", "夫婦", "ふうふ"],
       "ko": ["커플", "부부"],
       "ne": ["जोडी"],
       "pt": ["casal", "par"],
       "zh": ["夫妇", "情侣"]
  },
  "destruction": {
    "emoji": [emoji.tornado],
       "en": ["chaos", "destruction", "mess"],
       "es": ["caos", "destrucción", "destruccion", "desorden"],
       "ja": ["破壊"],
       "ko": ["난장판", "엉망진창"],
       "ne": ["विनाश"],
       "pt": ["caos", "destruição", "bagunça"],
       "zh": ["破坏"]
  },
  "dig": {
    "emoji": [emoji.dig],
       "en": ["dig", "digging", "digs"],
       "es": ["cavando", "excavando"],
       "ja": ["穴掘り"],
       "ko": [ "구멍 파기", "땅을 파다"],
       "ne": ["खन्नुहोस्"],
       "pt": ["cavando", "escavando"],
       "zh": ["挖"]
  },
  "dish": {
    "emoji": [emoji.dish],
       "en": ["dish", "plate"],
       "es": ["plato"],
       "ja": ["ごはん"],
       "ko": ["접시"],
       "ne": ["थाल"],
       "pt": ["prato"],
       "zh": ["盘子"]
  },
  "door": {
    "emoji": [emoji.door],
       "en": ["door"],
       "es": ["puerta"],
       "ja": ["扉", "戸"],
       "ko": ["문"],
       "ne": ["ढोका"],
       "pt": ["porta"],
       "zh": ["门"]
  },
  "ear": {
    "emoji": [emoji.ear],
       "en": ["ear", "ears"],
       "es": ["oreja", "orejas"],
       "ja": ["耳"],
       "ko": ["귀"],
       "ne": ["कान"],
       "pt": ["orelha", "orelhas"],
       "zh": ["耳"]
  },
  "eye": {
    "emoji": [emoji.eye],
       "en": ["eye", "eyes"],
       "es": ["ojo", "ojos"],
       "ja": ["目"],
       "ko": ["눈"],
       "ne": ["कान"],
       "pt": ["olho", "olhos"],
       "zh": ["眼睛", "眼"]
  },
  "flowers": {
    "emoji": [emoji.flower],
       "en": ["flower", "flowers"],
       "es": ["flor", "flores"],
       "ja": ["花"],
       "ko": ["꽃"],
       "ne": ["फूल", "फूलहरू"],
       "pt": ["flor", "flores"],
       "zh": ["花"]
  },
  "grooming": {
    "emoji": [emoji.shower],
       "en": ["groom", "grooming", "cleaning"],
       "es": ["limpiándose", "limpiandose", "lamiéndose", "lamiendose", "lavándose", "lavandose"],
       "ja": ["毛づくろい"],
       "ko": ["몸 단장"],
       "ne": ["फूलहरू"],
       "pt": ["limpando-se"],
       "zh": ["梳毛"]
  },
  "grumpy": {
    "emoji": [emoji.grumpy],
       "en": ["grumpy", "grouchy"],
       "es": ["gruñona", "gruñón", "grunona", "grunon"],
       "ja": ["ご機嫌ナナメ"],
       "ko": ["심술궂은", "투덜거리는", "기분이 나쁜"],
       "ne": ["नराम्रो"],
       "pt": ["rabugento", "mal-humorado"],
       "zh": ["牢骚满腹"]
  },
  "hammock": {
    "emoji": [emoji.camping],
       "en": ["hammock"],
       "es": ["hamaca"],
       "ja": ["ハンモック"],
       "ko": ["해먹", "그물 침대"],
       "ne": ["ह्यामॉक"],
       "pt": ["rede de dormir"],
       "zh": ["吊床"]
  },
  "home": {
    "emoji": [emoji.home],
       "en": ["home"],
       "es": ["casa", "en casa"],
       "ja": ["お家"],
       "ko": ["집"],
       "ne": ["घर"],
       "pt": ["casa", "lar"],
       "zh": ["家"]
  },
  "in love": {
    "emoji": [emoji.hearts],
       "en": ["in love", "love"],
       "es": ["enamorado"],
       "ja": ["恋"],
       "ko": ["사랑"],
       "ne": ["मायामा"],
       "pt": ["amor", "apaixonado"],
       "zh": ["热恋", "恋爱"]
  },
  "itchy": {
    "emoji": [emoji.itch],
       "en": ["itchy", "scratchy"],
       "es": ["rascándose", "rascandose"],
       "ja": ["カイカイ", "かゆい"],
       "ko": ["가려운", "긁기", "간지러운"],
       "ne": ["खुजली"],
       "pt": ["coceira", "coçando"],
       "zh": ["挠痒", "抓痒"]
  },
  "jizo": {
    "emoji": [emoji.jizo],
       "en": ["jizo", "jizo statue", "statue"],
       "es": ["estatua"],
       "ja": ["お地蔵さん"],
       "ko": ["불상"],
       "ne": ["मूर्ति"],
       "pt": ["posição de estátua"],
       "zh": ["地藏菩萨"]
  },
  "keeper": {
    "emoji": [emoji.weary],
       "en": ["keeper", "zookeeper"],
       "es": ["cuidador", "cuidadora"],
       "ja": ["飼育員"],
       "ko": ["사육사", "동물원 사육사"],
       "ne": ["चिडियाखाना"],
       "pt": ["cuidador", "cuidadora"],
       "zh": ["饲养员"]
  },
  "kiss": {
    "emoji": [emoji.kiss],
       "en": ["kissing", "kiss"],
       "es": ["beso", "besos"],
       "ja": ["接吻", "せっぷん", "キス"],
       "ko": ["뽀뽀", "키스", "입맞춤"],
       "ne": ["चुम्बन"],
       "pt": ["beijo", "beijos", "beijando"],
       "zh": ["接吻", "亲亲", "吻"]
  },
  "laying down": {
    "emoji": [emoji.bed],
       "en": ["lay down", "laying down"],
       "es": ["acostado", "recostado"],
       "ja": ["寝そべっている"],
       "ko": ["누워 있기", "눕다", "쉬기"],
       "ne": ["तल राख्नु"],
       "pt": ["deitado", "deitando-se"],
       "zh": ["躺"]
  },
  "lips": {
    "emoji": [emoji.lips],
       "en": ["lips"],
       "es": ["labios"],
       "ja": ["くちびる"],
       "ko": ["입술"],
       "ne": ["ओठ"],
       "pt": ["lábios"],
       "zh": ["唇"]
  },
  "long-tongue": {
    "emoji": [emoji.tongue +
              emoji.tongue],
       "en": ["long tongue", "long-tongue"],
       "es": ["sacando la lengua"],
       "ja": ["長い舌"],
       "ko": ["긴 혀"],
       "ne": ["लामो जीभ"],
       "pt": ["mostrando a língua"],
       "zh": ["伸长舌头"]
  },
  "lunch time": {
    "emoji": [emoji.bento],
       "en": ["lunch time", "lunch"],
       "es": ["hora de comer", "almuerzo"],
       "ja": ["ランチの時間"],
       "ko": ["점심 시간"],
       "ne": ["खाजा समय", "भोजन"],
       "pt": ["almoço", "hora do almoço"],
       "zh": ["午餐时间"]
  },
  "mofumofu": {
     "emoji": [emoji.teddybear],
        "en": ["mofumofu", "fluffy", "punchy"],
        "es": ["rechoncho", "rechoncha", "esponjoso", "esponjosa"],
        "ja": ["モフモフ"],
        "ko": ["포근포근", "복슬복슬", "부드러운"],
        "ne": ["रमाईलो"],
        "pt": ["felpudo", "fofo", "gorducho", "rechonchudo"],
        "zh": ["软软"]
  },
  "muzzle": {
     "emoji": [emoji.muzzle],
        "en": ["muzzle", "snout"],
        "es": ["hocico", "trompa"],
        "ja": ["マズル"],
        "ko": ["주둥이"],
        "ne": ["थूली", "थोरै"],
        "pt": ["focinho"],
        "zh": ["口鼻套"]
  },
  "night": {
     "emoji": [emoji.moon],
        "en": ["night"],
        "es": ["noche"],
        "ja": ["夜"],
        "ko": ["밤"],
        "ne": ["रात"],
        "pt": ["noite"],
        "zh": ["夜", "晚上"]
  },
  "nose": {
     "emoji": [emoji.nose],
        "en": ["nose", "snout"],
        "es": ["nariz", "hocico"],
        "ja": ["鼻"],
        "ko": ["코"],
        "ne": ["नाक"],
        "pt": ["nariz"],
        "zh": ["鼻子"]
  },
  "old": {
     "emoji": [emoji.grandpa],
        "en": ["old"],
        "es": ["viejo", "vieja"],
        "ja": ["シニアパンダさん", "年老いた"],
        "ko": ["늙은", "나이 든", "연로한"],
        "ne": ["पुरानो"],
        "pt": ["idoso", "idosa"],
        "zh": ["老人"]
  },
  "panda bowl": {
     "emoji": [emoji.panda + 
               emoji.bowl],
        "en": ["panda bowl", "bowl"],
        "es": ["bola de panda", "bola"],
        "ja": ["エサ鉢"],
        "ko": ["밥그릇"],
        "ne": ["पोनिया कटोरा"],
        "pt": ["tigela de panda", "tigela"],
        "zh": ["碗"]
  },
  "paws": {
     "emoji": [emoji.paws],
        "en": ["paws", "feet"],
        "es": ["patas", "pies"],
        "ja": ["足"],
        "ko": ["발", "발바닥"],
        "ne": ["पन्जा"],
        "pt": ["patas", "pés"],
        "zh": ["爪"]
  },
  "peek": {
     "emoji": [emoji.monocle],
        "en": ["peek", "peeking"],
        "es": ["ojeando", "mirando", "curioseando"],
        "ja": ["チラ見"],
        "ko": ["엿보기", "살짝 보기", "훔쳐보기"],
        "ne": ["झिक्नु"],
        "pt": ["espiando"],
        "zh": ["偷窥"]
  },
  "playing": {
     "emoji": [emoji.playing],
        "en": ["playing", "play"],
        "es": ["jugando", "jugar"],
        "ja": ["拝み食い", "両手食い"],
        "ko": ["놀기", "놀이 중", "장난치기"],
        "ne": ["खेलिरहेको", "खेल्नु"],
        "pt": ["brincando"],
        "zh": ["玩耍"]
  },
  "poop": {
     "emoji": [emoji.poop],
        "en": ["poop"],
        "es": ["heces", "caca", "mierda"],
        "ja": [emoji.poop],
        "ko": ["응가"],
        "ne": [emoji.poop],
        "pt": ["cocô", "cocó", "caca"],
        "zh": ["便便"]
  },
  "pooping": {
     "emoji": [emoji.panda +
               emoji.poop],
        "en": ["pooping"],
        "es": ["defecando", "haciendo caca", "cagando"],
        "ja": ["💩している"],
        "ko": ["응가 중"],
        "ne": [emoji.panda +
               emoji.poop],
        "pt": ["fazendo cocô", "fazendo caca"],
        "zh": ["便便"]
  },
  "portrait": {
     "emoji": [emoji.portrait],
        "en": ["portrait", "square"],
        "es": ["retrato", "cuadrada"],
        "ja": ["顔写真"],
        "ko": ["초상화"],
        "ne": ["चित्र"],
        "pt": ["retrato"],
        "zh": ["肖像"]
  },
  "praying": {
     "emoji": [emoji.pray],
        "en": ["praying", "pray"],
        "es": ["rezando", "orando"],
        "ja": ["お祈りしている"],
        "ko": ["기도하기", "기도 중"],
        "ne": ["प्रार्थना गर्दै", "प्रार्थना"],
        "pt": ["rezando", "orando", "mãos postas"],
        "zh": ["祈祷"]
  },
  "profile": {
     "emoji": [emoji.profile],
        "en": ["profile"],
        "es": ["perfil"],
        "ja": ["プロフィール画像"],
        "ko": ["프로필"],
        "ne": ["प्रोफाइल"],
        "pt": ["perfil"],
        "zh": ["资料"]
  },
  "pull-up": {
     "emoji": [emoji.weight],
        "en": ["pull-up", "pull-ups", "pullup"],
        "es": ["flexiones", "dominadas"],
        "ja": ["鉄棒", "懸垂"],
        "ko": ["턱걸이"],
        "ne": ["तान्नु"],
        "pt": ["flexões"],
        "zh": ["引体向上"]
  },
  "pumpkin": {
     "emoji": [emoji.pumpkin],
        "en": ["pumpkin", "halloween"],
        "es": ["calabaza"],
        "ja": ["かぼちゃ", "南瓜"],
        "ko": ["호박", "할로윈"],
        "ne": ["कद्दू", "हेलोवीन"],
        "pt": ["abóbora"],
        "zh": ["南瓜"]
  },
  "reiwa": {
     "emoji": [emoji.reiwa],
        "en": ["reiwa"],
        "es": ["reiwa"],
        "ja": ["令和"],
        "ko": ["레이와"],
        "ne": [emoji.reiwa],
        "pt": ["reiwa"],
        "zh": ["令和"]
  },
  "sample": {
     "emoji": [emoji.panda],
        "en": ["sample"],
        "es": ["muestra"],
        "ja": ["見本", "試料", "試供品"],
        "ko": ["샘플"],
        "ne": ["नमूना"],
        "pt": ["amostra"],
        "zh": ["样本", "样品", "样"]
  },
  "scale": {
     "emoji": [emoji.scale],
        "en": ["scale", "weigh-in", "weight"],
        "es": ["balanza", "pesa"],
        "ja": ["体重計", "たいじゅうけい"],
        "ko": ["체중계", "저울"],
        "ne": ["स्केल", "तौल"],
        "pt": ["balança", "peso"],
        "zh": ["测体重"]
  },
  "shake": {
     "emoji": [emoji.cyclone],
        "en": ["shake", "shaking"],
        "es": ["sacudiéndose", "sacudiendose"],
        "ja": ["ドリパン", "ブルブル", "ゆらゆら"],
        "ko": ["흔들기", "흔들림", "떨림"],
        "ne": ["हल्लाउनु"],
        "pt": ["sacudindo-se"],
        "zh": ["摇晃"]
  },
  "shedding": {
     "emoji": [emoji.worry],
        "en": ["shedding", "changing fur", "losing fur", "losing hair"],
        "es": ["mudando", "mudando el pelo", "cambiando el pelo"],
        "ja": ["換毛", "泣いている"],
        "ko": ["털갈이"],
        "ne": ["सुस्त"],
        "pt": ["mudando o pelo", "perdendo pelo"],
        "zh": ["换毛"]
  },
  "shoots": {
     "emoji": [emoji.bamboo],
        "en": ["shoots", "shoot"],
        "es": ["brotes"],
        "ja": ["竹の子", "たけのこ"],
        "ko": ["죽순"],
        "ne": ["बाँस को टुप्पो"],
        "pt": ["brotos", "broto"],
        "zh": ["竹笋"]
  },
  "siblings": {
     "emoji": [emoji.siblings],
        "en": ["siblings"],
        "es": ["hermanos"],
        "ja": ["兄弟", "きょうだい"],
        "ko": ["형제·자매"],
        "ne": ["भाइबहिनीहरू"],
        "pt": ["irmãos(ãs)"],
        "zh": ["同胞"]
  },
  "sisters": {
     "emoji": [emoji.sisters],
        "en": ["sisters"],
        "es": ["hermanas"],
        "ja": ["姉妹"],
        "ko": ["자매"],
        "ne": ["बहिनीहरू"],
        "pt": ["irmãs"],
        "zh": ["姐妹"]
  },
  "sleeping": {
     "emoji": [emoji.sleeping],
        "en": ["sleeping", "sleep", "asleep"],
        "es": ["durmiendo", "dormido", "dormida", "durmiéndose", "durmiendose", "dormir"],
        "ja": ["寝ている"],
        "ko": ["잠", "잠자는 중", "수면"],
        "ne": ["सुत्नु", "निद्रा"],
        "pt": ["dormindo"],
        "zh": ["睡觉"]
  },
  "slobber": {
     "emoji": [emoji.slobber],
        "en": ["slobber", "slobbering"],
        "es": ["babeándo", "babeando", "baba"],
        "ja": ["よだれをたらしている"],
        "ko": ["침 흘리기", "침"],
        "ne": ["स्लोबर"],
        "pt": ["babando", "baba"],
        "zh": ["口水", "流口水"]
  },
  "smile": {
     "emoji": [emoji.smile],
        "en": ["smile", "smiling"],
        "es": ["sonriéndo", "sonriendo", "sonreír", "sonreir", "sonriente", "sonrisa"],
        "ja": ["スマイル"],
        "ko": ["웃음", "웃는 중"],
        "ne": ["हाँसो"],
        "pt": ["sorrindo", "sorriso", "sorridente"],
        "zh": ["笑", "微笑"]
  },
  "snow": {
     "emoji": [emoji.snow],
        "en": ["snow"],
        "es": ["nieve"],
        "ja": ["雪"],
        "ko": ["눈"],
        "ne": ["हिउँ"],
        "pt": ["neve"],
        "zh": ["雪"]
  },
  "spider": {
     "emoji": [emoji.spider],
        "en": ["spider", "spider-bear", "spider bear"],
        "es": ["araña", "arana"],
        "ja": ["スパイダー"],
        "ko": ["거미"],
        "ne": ["माकुरो", "माकुरो भालु"],
        "pt": ["panda-aranha", "aranha"],
        "zh": ["蜘蛛"]
  },
  "standing": {
     "emoji": [emoji.no_emoji],
        "en": ["standing", "stand"],
        "es": ["de pie", "parado"],
        "ja": ["立っている"],
        "ko": ["서다"],
        "ne": ["खडा"],
        "pt": ["de pé", "em pé"],
        "zh": ["站立"]
  },
  "stretching": {
     "emoji": [emoji.no_emoji],
        "en": ["stretching", "stretch"],
        "es": ["estirándose", "estirandose"],
        "ja": ["ストレッチしている"],
        "ko": ["스트레칭"],
        "ne": ["तन्नु", "तान्न"],
        "pt": ["espreguiçando-se"],
        "zh": ["拉伸"]
  },
  "surprise": {
     "emoji": [emoji.fireworks],
        "en": ["surprise", "surprised"],
        "es": ["sorpresa", "sorprendido", "sorprendida"],
        "ja": ["びっくり"],
        "ko": ["놀라움"],
        "ne": ["अचम्म"],
        "pt": ["surpreso", "surpresa", "surpreendido"],
        "zh": ["惊喜"]
  },
  "tail": {
     "emoji": [emoji.snake],
        "en": ["tail"],
        "es": ["cola"],
        "ja": ["しっぽ"],
        "ko": ["꼬리"],
        "ne": ["पुच्छर"],
        "pt": ["cauda", "rabo"],
        "zh": ["尾巴"]
  },
  "techitechi": {
     "emoji": [emoji.target],
        "en": ["techitechi", "spot", "cute spot"],
        "es": ["lunares", "lunar"],
        "ja": ["テチテチ"],
        "ko": ["목표"],
        "ne": ["राम्रो स्थान"],
        "pt": ["pinta", "pintinha"],
        "zh": ["目标"]
  },
  "tongue": {
     "emoji": [emoji.tongue],
        "en": ["tongue"],
        "es": ["lengua"],
        "ja": ["べろ"],
        "ko": ["혀"],
        "ne": ["जिब्रो"],
        "pt": ["língua"],
        "zh": ["舌"]
  },
  "toys": {
     "emoji": [emoji.football],
        "en": ["toy", "toys"],
        "es": ["juguete", "juguetes"],
        "ja": ["遊具", "おもちゃ", "おもちゃ"],
        "ko": ["장난감"],
        "ne": ["खेलौना"],
        "pt": ["brinquedo", "brinquedos"],
        "zh": ["玩具"]
  },
  "tree": {
     "emoji": [emoji.tree],
        "en": ["tree", "trees"],
        "es": ["árbol", "arbol", "árboles", "arboles"],
        "ja": ["木"],
        "ko": ["나무"],
        "ne": ["रूख"],
        "pt": ["árvore", "árvores"],
        "zh": ["树"]
  },
  "upside-down": {
     "emoji": [emoji.upside_down],
        "en": ["upside-down", "upside down"],
        "es": ["al revés", "al reves", "cabeza abajo"],
        "ja": ["逆さま"],
        "ko": ["거꾸로", "뒤집힌"],
        "ne": ["तलको माथि"],
        "pt": ["cabeça para baixo", "ponta-cabeça"],
        "zh": ["翻转"]
  },
  "wink": {
     "emoji": [emoji.wink],
        "en": ["wink", "winking"],
        "es": ["guiño", "guino"],
        "ja": ["ウィンク"],
        "ko": ["윙크"],
        "ne": ["आखा भ्किम्काउनु"],
        "pt": ["piscando", "piscada", "piscadela", "piscar de olhos"],
        "zh": ["眨眼"]
  },
  "wet": {
     "emoji": [emoji.raincloud],
        "en": ["wet"],
        "es": ["mojado", "mojada"],
        "ja": ["濡れた"],
        "ko": ["젖은", "축축한"],
        "ne": ["भिजेको"],
        "pt": ["molhado", "molhada"],
        "zh": ["湿"]
  },
  "white face": {
     "emoji": [emoji.no_emoji],
        "en": ["white face", "light face"],
        "es": ["cara blanca"],
        "ja": ["色白さん", "しろめん", "白面", "白めん"],
        "ko": ["하얀 얼굴", "밝은 얼굴"],
        "ne": ["सेतो अनुहार"],
        "pt": ["face branca"],
        "zh": ["浅色的脸"]
  },
  "window": {
     "emoji": [emoji.window],
        "en": ["window"],
        "es": ["ventana"],
        "ja": ["窓", "まど"],
        "ko": ["창문"],
        "ne": ["विन्डो"],
        "pt": ["janela"],
        "zh": ["窗"]
  },
  "whiskers": {
     "emoji": [emoji.whiskers],
        "en": ["whiskers", "whisker"],
        "es": ["bigotes", "bigote"],
        "ja": ["ひげ"],
        "ko": ["수염"],
        "ne": ["फुसफुस"],
        "pt": ["bigode", "bigodes"],
        "zh": ["晶須"]
  },
  "yawn": {
     "emoji": [emoji.yawn],
        "en": ["yawn", "yawning"],
        "es": ["bostezo", "bostezando"],
        "ja": ["あくび"],
        "ko": ["하품", "하품하기"],
        "ne": ["जांभई"],
        "pt": ["bocejo", "bocejando"],
        "zh": ["哈欠", "呵欠"]
  }
}

/** Map a browser specified language to one of our supported options. */
export function defaultDisplayLanguage() {
  // Read language settings from browser's Accept-Language header
  // TODO ES6
  Pandas.def.languages.forEach(function(option) {
    if ((navigator.languages.includes(option)) &&
        (Displayed == undefined)) {
      Displayed = option
    }
  })
  // Read language setting if it's there
  const test = window.localStorage.getItem("language")
  if (test != null) {
    if (Pandas.def.languages.includes(test)) {
      Displayed = test
    }
  }  
  // Fallback to English
  if (Displayed == undefined)
    Displayed = "en"
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
  const order = currentOrder(Pandas.language_order(entity), Displayed)
  // Default values that we want to ignore if we can
  const default_animal = saveEntityKeys(Pandas.def.animal, order)
  const default_zoo = saveEntityKeys(Pandas.def.zoo, order)
  const empty_values = [undefined].concat(Object.values(Pandas.def.unknown))
                                  .concat(Object.values(default_animal))
                                  .concat(Object.values(default_zoo))
  // Derive the zoo/panda language-translatable keys by getting a list of
  // the separate language keys from the original object, and adding a
  // synthetic list of keys that would apply for the current display language
  const language_entity = listDisplayKeys(entity, order, Displayed)
  // Start replacing this language's value with an available value in the
  // language.order list. Just stuff it in the original entity's key.
  for (const key of language_entity) {
    const blacklist_key = key.split(".")[1]   // No language suffix
    if (fallback_blacklist.includes(blacklist_key))
      continue  // Ignore blacklist fields
    if (empty_values.includes(entity[key])) {
      for (language of order) {
        if (language == Displayed)
          continue  // Don't take replacement values from current language
        const [ _, desired ] = key.split('.')
        var new_key = `${language}.${desired}`
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
    gui.flag["en"] = flags["UK"]
  } else {
    for (const lang of navigator.languages) {
      if (lang.indexOf("en") == 0) {
        const commonwealth = navigator.languages.indexOf(lang)
        if (commonwealth < us) {
          gui.flag["en"] = flags["UK"]
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
    gui.flag["zh"] = flags["Taiwan"]
  }
  // Korean locale flag
  const korean = "ko-KR"
  if (navigator.languages.includes(korean)) {
    gui.flag["ko"] = flags["South Korea"]
  }
  // TODO: Portuguese vs. Brazil flags
  const brazil = "pt-BR"
  if (navigator.languages.includes(brazil)) {
    gui.flag["pt"] = flags["Brazil"]
  }
}

/**
 * Do language fallback for anything reporting as `unknown` or _empty_ in an
 * info block
 */
export function fallbackInfo(info, original) {
  var bundle = info
  var order = currentOrder(info.language_order, Displayed)
  // Default values that we want to ignore if we can
  var default_animal = saveEntityKeys(Pandas.def.animal, order)
  var default_zoo = saveEntityKeys(Pandas.def.zoo, order)
  const empty_values = [undefined].concat(Object.values(Pandas.def.unknown))
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
        if (language == Displayed)
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
  if ((info.zoo != undefined) && (info.zoo != Pandas.def.zoo)) {
    bundle.zoo = fallbackEntity(info.zoo)
  }
  if ((info.birthplace != undefined) && (info.birthplace != Pandas.def.zoo)) {
    bundle.birthplace = fallbackEntity(info.birthplace)
  }
  for (const index in info.mom) {
    if ((info.mom[index] != undefined) && 
        (info.mom[index] != Pandas.def.animal)) {
      info.mom[index] = fallbackEntity(info.mom[index])
    }
  }
  for (const index in info.dad) {
    if ((info.dad[index] != undefined) && 
        (info.dad[index] != Pandas.def.animal)) {
      info.dad[index] = fallbackEntity(info.dad[index])
    }      
  }
  for (const index in info.litter) {
    if ((info.litter[index] != undefined) && 
        (info.litter[index] != Pandas.def.animal)) {
       info.litter[index] = fallbackEntity(info.litter[index])
    }
  }
  for (const index in info.siblings) {
    if ((info.siblings[index] != undefined) && 
        (info.siblings[index] != Pandas.def.animal)) {
       info.siblings[index] = fallbackEntity(info.siblings[index])
    }
  }
  for (const index in info.children) {
    if ((info.children[index] != undefined) && 
        (info.children[index] != Pandas.def.animal)) {
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
  const words = []
  const output = []
  if (input.includes(' ')) {
    words = input.split(' ')
  } else {
    words.push(input)
  }
  words.forEach(function(word) {
    const latin = testString(input, "Latin")
    if ((latin == true) && (Query.env.preserve_case == false)) {
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
  const ouptut = ((mode == "first") || (words == 1))
    ? input.charAt(0).toUpperCase() + input.slice(1)
    : input.replace(/(?:^|\s)\S/g, (a) => a.toUpperCase())
  return output
}

/** Make a phrase out of parts, with commas and terminal _and_ */
export function commaPhrase(pieces) {
  const p = document.createElement('p')
  for (let i = 0; i < pieces.length; i++) {
    const m = document.createTextNode(pieces[i])
    const c = document.createTextNode(messages.comma[Displayed])
    const a = document.createTextNode(messages.and_words[Displayed])
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
    const c = messages.comma[Displayed] + " "
    const a = messages.and_words[Displayed]
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
  const currentBias = bias[current_language]
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
  const order = currentOrder(entity_order, Displayed)
  order.unshift(Displayed)   // Display language always comes first
  for (let language of order) {
    const name = entity[language + ".name"]
    if (name != undefined) {
      return name 
    }
  }
  // Fallback default name
  // TODO ES6
  return Pandas.def.animal[Displayed + ".name"]
}

/**
 * For Japanese language searches, whenever a hiragana string is searched, we
 * try to support also searching for the katakana equivalent characters.
 */
export function hiraganaToKatakana(input) {
  const source_range = Pandas.def.ranges['ja'][1]   // Hiragana range regex
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
  const source_range = Pandas.def.ranges['ja'][2]   // Katakana range regex
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
  const obj_langs = order.concat(Pandas.def.languages)  // Dupes not important
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
  const lang_values = Pandas.def.languages.concat("emoji")
  for (const ctag in tags) {
    for (const lang of lang_values) {
      if (tags[ctag][lang].includes(input)) {
        return ctag
      }
    }
  }
  // Need to search polyglots too, for things like "baby"
  for (const ctag in polyglots) {
    for (const lang of lang_values) {
      if (polyglots[ctag][lang].includes(input)) {
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
    const range = Pandas.def.ranges['ja'][1]
    return range.test(input)   // True if any characters match the hiragana range
  }
  if (test_name == "Katakana") {
    const range = Pandas.def.ranges['ja'][2]
    return range.test(input)   // True if any characters match the katakana range
  }
  if ((test_name == "Latin") || (test_name == "English")) {
    const ranges = Pandas.def.ranges['en']
    const latin = ranges.some((range) => range.test(input))
    return latin   // True if any characters match the latin range
  }
  return false   // The test doesn't exist
}

/** Take specific english words and unpluralize them if necessary */
export function unpluralize(pieces) {
  const output = []
  if (Displayed == "en") {
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
  } else if (Displayed == "es") {
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
  } else if (Displayed == "ko") {
    for (let input of pieces) {
      input = input.replace(/(\d+) 사진들/, "$1 사진")
                   .replace(/(\d+) 동물들/, "$1 동물")
                   .replace(/(\d+) 판다들/, "$1 판다")
                   .replace(/새로운 (\d+) 기여자들/, "새로운 $1 기여자")
                   .replace(/사진 태그들/, "사진 태그")  
      output.push(input)
    }
    return output
  } else if (Displayed == "pt") {
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
      icon.innerText = gui.flag[Displayed]   // Replace flag icon
      text.innerText = gui[lookup][Displayed][Displayed]   // Replace language icon text
    } else {
      text.innerText = gui[lookup][Displayed]   // Replace icon text
    }
  }
  // On the Links page? Redraw it
  if ((window.location.hash == "#links") && (P.db != undefined)) {
    Page.links.render()
  }
  // Update the placeholder text for a search bar
  if (document.forms['searchForm'] != undefined) {
    if (P.db == undefined) {
      document.forms['searchForm']['searchInput'].placeholder =
        gui.loading[Displayed]
    } else {
      document.forms['searchForm']['searchInput'].placeholder =
        "➤ " + gui.search[Displayed]
    }
  }
  // Change the page title
  document.title = gui.title[Displayed]
  // Write localStorage for your chosen language. This is better than a cookie
  // since the server doesn't see what language you're using in each request.
  window.localStorage.setItem('language', Displayed)
}
