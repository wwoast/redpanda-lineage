/**
 * Date formats for parsing support fallbacks, if there would otherwise be
 * ambiguity in the dates
 */
export const DateLocale = {
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

/** Defaults for panda or zoo object fields, or date formats */
export const Defaults = {
  age: {
    "en": {
      "year": "year",
      "years": "years",
      "month": "month",
      "months": "months",
      "day": "day",
      "days": "days"
    },
    "es": {
      "year": "año",
      "years": "años",
      "month": "mes",
      "months": "meses",
      "day": "día",
      "days": "días"
    },
    "ja": {
      "year": "歳",
      "years": "歳",
      "month": "月",
      "months": "月",
      "day": "日",
      "days": "日"
    },
    "ko": {
      "year": "세",
      "years": "세",
      "month": "개월",
      "months": "개월",
      "day": "일",
      "days": "일"
    },
    "ne": {
      "year": "बर्ष",
      "years": "बर्ष",
      "month": "महिना",
      "months": "महिना",
      "day": "दिन",
      "days": "दिनहरु"
    },
    "pt": {
      "year": "ano",
      "years": "anos",
      "month": "mês",
      "months": "meses",
      "day": "dia",
      "days": "dias"
    },
    "zh": {
      "year": "年",
      "years": "年",
      "month": "月",
      "months": "月",
      "day": "天",
      "days": "天"
    }
  },
  animal: {
    "_id": "0",
    "birthday": "1970/1/1",
    "birthplace": "0",
    "children": "0",
    "death": "1970/1/1",
    "en.name": "Panda Not Found",
    "en.nicknames": "No Nicknames Recorded",
    "en.othernames": "No Alternate Names Recorded",
    "es.name": "Panda no encontrado",
    "es.nicknames": "No se registraron apodos",
    "es.othernames": "No se registraron nombres alternativos",
    "gender": "Unknown",
    "ja.name": "パンダが見つかりませんでした",
    "ja.nicknames": "ニックネームは記録されていません",
    "ja.othernames": "代わりのスペルは記録されていません",
    "ko.name": "판다를 찾을 수 없습니다",
    "ko.nicknames": "등록된 별명이 없습니다",
    "ko.othernames": "등록된 다른 이름이 없습니다",
    "litter": "0",
    "ne.name": "निगल्या पोनिया फेला परेन",
    "ne.nicknames": "उपनामहरू फेला परेन",
    "ne.othernames": "अरु नामहरु फेला परेन",
    "photo.1": "images/no-panda-portrait.jpg",
    "pt.name": "Panda não encontrado",
    "pt.nicknames": "Nenhum apelido registrado",
    "pt.othernames": "Nenhum nome alternativo registrado",
    "species": "-1",
    "video.1": "images/no-panda-portrait.jpg",
    "zh.name": "TOWRITE",
    "zh.nicknames": "TOWRITE",
    "zh.othernames": "TOWRITE",
    "zoo": "0"
  },
  /** Missing or undescribed authors / photo credits */
  authors: {
    "anonymous": {
      "en": "anonymous",
      "es": "anónimo",
      "ja": "匿名",
      "ko": "익명",
      "ne": "बेनामी",
      "pt": "anônimo",
      "zh": "匿名"
    },
    "uncredited": {
      "en": "uncredited",
      "es": "sin acreditar",
      "ja": "信用されていない",
      "ko": "공로 미기재",
      "ne": "अप्रत्याशित",
      "pt": "não creditado",
      "zh": "沒有信用"
    }
  },
  date: {
    "earliest_year": "1970",
    "en": "MM/DD/YYYY",
    "es": "DD/MM/YYYY",
    "ja": "YYYY年MM月DD日",
    "ko": "YYYY년MM월DD일",
    "ne": "YYYY-MM-DD",
    "pt": "DD/MM/YYYY",
    "zh": "YYYY-MM-DD"
  },
  date_season: {
    "earliest_year": "1970",
    "en": "SEASON YYYY",
    "es": "SEASON YYYY",
    "ja": "SEASON YYYY",
    "ko": "SEASON YYYY",
    "ne": "SEASON YYYY",
    "pt": "SEASON YYYY",
    "zh": "SEASON YYYY"
  },
  gender: {
    "Female": {
      "en": "female",
      "es": "hembra",
      "ja": "メス",
      "ko": "여",
      "ne": "महिला",
      "pt": "fêmea",
      "zh": "女"
    },
    "Male": {
      "en": "male",
      "es": "macho",
      "ja": "オス",
      "ko": "남",
      "ne": "नर",
      "pt": "macho",
      "zh": "男"
    }
  },
  /** 
   * Used for determining what languages are selectable. Don't add new
   * languages to this set until we're ready with panda data in that language.
   * We look for ISO-639-1 codes in the navigator.languages value, and map it
   * to a language definition used within this project's code. The ordering
   * here determines the appearance of the buttons in the language menu.
   */
  languages: ["en", "ja", "zh", "ne", "pt", "es", "ko"],
  /** Used for missing mothers and fathers, where capitalization is needed */
  no_name: {
    "en": "Unknown",
    "es": "Desconocido",
    "ja": "未詳",
    "ko": "알 수 없음",
    "ne": "अज्ञात",
    "pt": "Desconhecido(a)",
    "zh": "不明"
  },
  /** Character ranges */
  ranges: {
    "en": [
      /[\u0020-\u007f]/,   // Basic Latin
      /[\u00a0-\u00ff]/,   // Latin-1 Supplement
      /[\u0100-\u017f]/,   // Latin Supplement A,
      /[\u0180-\u024f]/    // Latin Supplement B
    ],
    "ja": [
      /[\u3000-\u303f]/,   // Japanese punctuation
      /[\u3040-\u309f]/,   // Japanese hiragana
      /[\u30a0-\u30ff]/,   // Japanese katakana,
      /[\uff00-\uffef]/,   // Japanese full-width romanji and half-width katakana
      /[\u4e00-\u9faf]/    // CJK unified Kanji set
    ],
    "ko": [
      /[\uAC00-\uD7AF]/,  // Hangul Syllables (가-힣)
      /[\u1100-\u11FF]/,  // Hangul Jamo (초성, 중성, 종성)
      /[\u3130-\u318F]/,  // Hangul Compatibility Jamo
      /[\u3200-\u33FF]/,  // Korean symbols and punctuation
    ],
    "ne": [
      /[\u0900-\u0954]/    // Devanghari unicode range
    ]
  },
  /** Used for slip-ins in Panda dossiers for brothers/sisters/moms */
  relations: {
    "aunt": {
      "en": "aunt",
      "es": "tía",
      "ja": "叔母",
      "ko": "이모",
      "ne": "काकी",
      "pt": "tia",
      "zh": "姑媽"
    },
    "brother": {
      "en": "brother",
      "es": "hermano",
      "ja": "兄",
      "ko": "형제",
      "ne": "भाई",
      "pt": "irmão",
      "zh": "兄"
    },
    "children": {
      "en": "children",
      "es": "niños",
      "ja": "子供",
      "ko": "자녀",
      "ne": "बच्चाहरु",
      "pt": "filhos(as)",
      "zh": "孩子"
    },
    "cousin": {
      "en": "cousin",
      "es": "primo",
      "ja": "いとこ",
      "ko": "사촌",
      "ne": "भान्जा",
      "pt": "primo(a)",
      "zh": "表姐"
    },
    "father": {
      "en": "father",
      "es": "padre",
      "ja": "父",
      "ko": "아빠",
      "ne": "बुबा",
      "pt": "pai",
      "zh": "父"
    },
    "grandfather": {
      "en": "grandfather",
      "es": "abuelo",
      "ja": "おじいちゃん",
      "ko": "할아버지",
      "ne": "हजुरबुबा",
      "pt": "avô",
      "zh": "祖父"
    },
    "grandmother": {
      "en": "grandmother",
      "es": "abuela",
      "ja": "おばあちゃん",
      "ko": "할머니",
      "ne": "हजुरआमा",
      "pt": "avó",
      "zh": "祖母"
    },
    "litter": {
      "en": "litter",
      "es": "camada",
      "ja": "双子",   /* "同腹仔" */
      "ko": "쌍둥이",
      "ne": "रोटी",
      "pt": "ninhada",
      "zh": "轿子"
    },
    "mother": {
      "en": "mother",
      "es": "madre",
      "ja": "母",
      "ko": "엄마",
      "ne": "आमा",
      "pt": "mãe",
      "zh": "母"
    },
    "nephew": {
      "en": "nephew",
      "es": "sobrino",
      "ja": "甥",
      "ko": "조카(남)",
      "ne": "भतिजा",
      "pt": "sobrinho",
      "zh": "外甥"
    },
    "niece": {
      "en": "niece",
      "es": "sobrina",
      "ja": "姪",
      "ko": "조카(여)",
      "ne": "भान्जी",
      "pt": "sobrinha",
      "zh": "侄女"
    },
    "parents": {
      "en": "parents",
      "es": "padres",
      "ja": "両親",
      "ko": "부모",
      "ne": "अभिभावक",
      "pt": "pais",
      "zh": "父母"
    },
    "sister": {
      "en": "sister",
      "es": "hermana",
      "ja": "姉",
      "ko": "자매",
      "ne": "बहिनी",
      "pt": "irmã",
      "zh": "妹妹"
    },
    "siblings": {
      "en": "siblings",
      "es": "hermanos",
      "ja": "兄弟",
      "ko": "형제·자매",
      "ne": "भाइबहिनीहरू",
      "pt": "irmãos(ãs)",
      "zh": "兄弟姐妹"
    },
    "uncle": {
      "en": "uncle",
      "es": "tío",
      "ja": "叔父",
      "ko": "삼촌",
      "ne": "काका",
      "pt": "tio",
      "zh": "叔叔"
    }
  },
  species: {
    "en": [
      "Ailurus fulgens fulgens",
      "Ailurus fulgens styani",
      "Ailurus fulgens"
    ],
    "es": [
      "Ailurus fulgens fulgens",
      "Ailurus fulgens styani",
      "Ailurus fulgens"
    ],
    "ja": [
      "西レッサーパンダ",
      "シセンレッサーパンダ",
      "未詳レッサーパンダ"
    ],
    "ko": [
      "Ailurus fulgens fulgens",
      "Ailurus fulgens styani",
      "Ailurus fulgens"
    ],
    "ne": [
      "Ailurus fulgens fulgens",
      "Ailurus fulgens styani",
      "Ailurus fulgens"
    ],
    "pt": [
      "Ailurus fulgens fulgens",
      "Ailurus fulgens styani",
      "Ailurus fulgens"
    ],
    "zh": [
      "Ailurus fulgens fulgens",
      "Ailurus fulgens styani",
      "Ailurus fulgens"
    ]
  },
  unknown: {
    "en": "unknown",
    "es": "desconocido",
    "ja": "未詳",
    "ko": "알 수 없음",
    "ne": "अज्ञात",
    "pt": "desconhecido",
    "zh": "不明"
  },
  /** Slightly different default zoo listing, for wild-born animals */
  wild: {
    "_id": "wild.0",
    "en.address": "Captured or Rescued Wild Animal",
    "en.location": "No City, District, or State Info Listed",
    "en.name": "Zoo Not Found",
    "es.address": "Animal Salvaje Capturado o Rescatado",
    "es.location": "No Se Incluye Información de Ciudad, Distrito o Estado",
    "es.name": "Zoo No Encontrado",
    "ja.address": "TOWRITE",
    "ja.location": "市区町村の情報が表示されていない",
    "ja.name": "動物園が見つかりません",
    "ko.address": "포획되거나 구조된 야생 동물",
    "ko.location": "도시, 지역 또는 주 정보가 없습니다",
    "ko.name": "동물원을 찾을 수 없습니다",
    "ne.address": "जंगली जनावर कब्जा वा बचाव",
    "ne.location": "कुनै स्थान जानकारी छैन",
    "ne.name": "चिडियाखाना फेला परेन",
    "photo.1": "images/no-zoo.jpg",
    "pt.address": "Animal selvagem capturado ou resgatado",
    "pt.location": "Nenhuma informação de cidade, distrito ou estado listada",
    "pt.name": "Zoológico não encontrado",
    "video.1": "images/no-zoo.jpg",
    "website": "https://www.worldwildlife.org/",
    "zh.address": "TOWRITE",
    "zh.location": "TOWRITE",
    "zh.name": "TOWRITE"
  },
  zoo: {
    "_id": "0",
    "closed": "1970/1/1",
    "en.address": "No Google Maps Address Recorded",
    "en.location": "No City, District, or State Info Listed",
    "en.name": "Zoo Not Found",
    "es.address": "No Se Registró Ninguna Dirección de Google Maps",
    "es.location": "No Se Incluye Información de Ciudad, Distrito o Estado",
    "es.name": "Zoo No Encontrado",
    "ja.address": "Googleマップのアドレスが記録されていません",
    "ja.location": "市区町村の情報が表示されていない",
    "ja.name": "動物園が見つかりません",
    "ko.address": "Google 지도 주소가 기록되지 않았습니다",
    "ko.location": "도시, 지역 또는 주 정보가 없습니다",
    "ko.name": "동물원을 찾을 수 없습니다",
    "ne.address": "कुनै ठेगाना सूचीबद्ध छैन",
    "ne.location": "कुनै स्थान जानकारी छैन",
    "ne.name": "चिडियाखाना फेला परेन",
    "photo.1": "images/no-zoo.jpg",
    "pt.address": "Nenhum endereço do Google Maps registrado",
    "pt.location": "Nenhuma informação de cidade, distrito ou estado listada",
    "pt.name": "Zoológico não encontrado",
    "video.1": "images/no-zoo.jpg",
    "website": "https://www.worldwildlife.org/",
    "zh.address": "TOWRITE",
    "zh.location": "TOWRITE",
    "zh.name": "TOWRITE"
  }
}

export const Emoji = {
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

/** Default parameters for entities that lack language information */
export const Fallback = {
  "order": ["en", "ja"]
}

export const Flags = {
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

export const Gui = {
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
    "ja": Defaults.relations.children["ja"],
    "ko": "새끼 레서판다들",
    "ne": "बच्चाहरु",
    "pt": "Filhos(as)",
    "zh": Defaults.relations.children["zh"]
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
    "en": Flags["USA"],
    "es": Flags["Spain"],
    "ja": Flags["Japan"],
    "ko": Flags["South Korea"],
    "ne": Flags["Nepal"],
    "pt": Flags["Portugal"],
    "zh": Flags["China"]
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
  "footerLink_washimumu": {
    "en": "washimumu",
    "es": "washimumu",
    "ja": "washimumu",
    "ko": "washimumu",
    "ne": "washimumu",
    "pt": "washimumu",
    "zh": "washimumu",
  },
  "footerLink_wumpwoast": {
    "en": "wumpwoast",
    "es": "wumpwoast",
    "ja": "wumpwoast",
    "ko": "wumpwoast",
    "ne": "wumpwoast",
    "pt": "wumpwoast",
    "zh": "wumpwoast",
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
    "ja": Defaults.relations.litter["ja"],
    "ko": "쌍둥이",
    "ne": "रोटी",
    "pt": "Ninhada",
    "zh": Defaults.relations.litter["zh"]
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
    "ja": Defaults.relations.parents["ja"],
    "ko": "부모",
    "ne": "अभिभावक",
    "pt": "Pais",
    "zh": Defaults.relations.parents["zh"]
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
    "ja": Defaults.relations.siblings["ja"],
    "ko": "형제·자매",
    "ne": "भाइबहिनीहरू",
    "pt": "Irmão(ãs)",
    "zh": Defaults.relations.siblings["zh"]
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

// These are tags in some contexts, and keywords in others
export const Polyglots = {
  "baby": {
 "emoji": [Emoji.baby],
    "en": ["baby", "babies", "Baby", "Aka-chan", "Akachan"],
    "es": ["bebé", "bebe", "bebés", "bebes"],
    "ja": ["赤", "赤ちゃん"],
    "ko": ["아기"],
    "ne": ["बच्चा"],
    "pt": ["bebê", "bebês", "bebé", "bebés"],
    "zh": ["宝宝", "婴儿", "婴儿们"]
  }
}

/**
 * Search tag translations for searching photos by metadata. Use `init()` to
 * ensure alternate capitalizations here. Use `var` to ensure it is hoisted
 * above parser logic when importing.
 * 
 * Limit to 100 photos returned by default, but they don't 
 * have to be the same 100 returned each time.
 * TODO: duplicate tag management (baby)
 * TODO: romanji for japanese terms
 */
export const Tags = {
  "air tasting": {
    "emoji": [Emoji.tongue + 
              Emoji.butterfly],
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
    "emoji": [Emoji.apple],
       "en": ["apple time", "apple"],
       "es": ["hora de la manazana", "manzana"],
       "ja": ["りんごタイム", "りんご"],
       "ko": ["사과 냠냠", "사과"],
       "ne": ["स्याउ समय", "स्याउ"],
       "pt": ["maçã", "hora da maçã"],
       "zh": ["苹果时间", "苹果"]
  },
  "autumn": {
    "emoji": [Emoji.autumn],
       "en": ["autumn", "fall"],
       "es": ["otoño"],
       "ja": ["秋"],
       "ko": ["가을"],
       "ne": ["शरद तु"],
       "pt": ["outono"],
       "zh": ["秋天"]
  },
  "bamboo": {
    "emoji": [Emoji.bamboo],
       "en": ["bamboo"],
       "es": ["bambú", "bambu"],
       "ja": ["笹", "竹"],
       "ko": ["대나무", "대나무"],
       "ne": ["बाँस"],
       "pt": ["bambu"],
       "zh": ["竹子", "竹"]
  },
  "bear worm": {
    "emoji": [Emoji.caterpillar],
       "en": ["bear worm", "bear-worm"],
       "es": ["gusan-oso", "gusanoso"],
       "ja": ["のびのび"],
       "ko": ["철푸덕"],
       "ne": ["कीरा भालु"],
       "pt": ["relaxado"],
       "zh": ["蠕动"]
  },
  "bite": {
    "emoji": [Emoji.tooth],
       "en": ["bite"],
       "es": ["morder"],
       "ja": ["一口"],
       "ko": ["깨물기"],
       "ne": ["काट्नु"],
       "pt": ["mordida"],
       "zh": ["咬", "吃"]
  },
  "blink": {
    "emoji": [Emoji.blink],
       "en": ["blink", "blinking"],
       "es": ["parpadear", "parpadeo"],
       "ja": ["まばたき"],
       "ko": ["눈 깜빡임"],
       "ne": ["झिम्काइ"],
       "pt": ["pestanejando", "pestanejo"],
       "zh": ["眨眼"]
  },
  "bridge": {
    "emoji": [Emoji.bridge],
       "en": ["bridge"],
       "es": ["puente"],
       "ja": ["吊り橋・渡し木", "架け橋"],
       "ko": ["다리"],
       "ne": ["पुल"],
       "pt": ["ponte"],
       "zh": ["吊桥", "桥"]
  },
  "brothers": {
    "emoji": [Emoji.brothers],
       "en": ["brothers", "bros"],
       "es": ["hermanos"],
       "ja": ["男兄弟"],
       "ko": ["형제"],
       "ne": ["भाइहरु"],
       "pt": ["irmãos"],
       "zh": ["兄弟"]
  },
  "carry": {
    "emoji": [Emoji.carry],
       "en": ["carry", "holding"],
       "es": ["llevando", "sosteniendo"],
       "ja": ["笹運び", "枝運び", "運ぶ"],
       "ko": ["배송"],
       "ne": ["बोक्नु", "समात्नु"],
       "pt": ["levando", "carregando", "segurando"],
       "zh": ["运", "拿"]
  },
  "cherry blossoms": {
    "emoji": [Emoji.cherry_blossom],
       "en": ["cherry blossoms", "cherry blossom"],
       "es": ["flor de cerezo", "flores de cerezo"],
       "ja": ["桜"],
       "ko": ["벚꽃"],
       "ne": ["चेरी खिल"],
       "pt": ["flor de cerejeira", "flores de cerejeira", "flor de cereja", "flores de cereja"],
       "zh": ["樱花"]
  },
  "climb": {
    "emoji": [Emoji.climb],
       "en": ["climb", "climbing"],
       "es": ["trepando", "escalando"],
       "ja": ["木登り", "登る"],
       "ko": ["등산"],
       "ne": ["चढाई"],
       "pt": ["escalando", "subindo"],
       "zh": ["爬"]
  },
  "close-up": {
    "emoji": [Emoji.close_up],
       "en": ["close-up", "closeup", "close"],
       "es": ["de cerca", "cerca"],
       "ja": ["閉じる"],
       "ko": ["가까이 보기"],
       "ne": ["क्लोज-अप", "नजिक"],
       "pt": ["fechar-se", "perto"],
       "zh": ["特写"]
  },
  "couple": {
    "emoji": [Emoji.couple],
       "en": ["couple", "partners"],
       "es": ["pareja"],
       "ja": ["カップル", "夫婦", "ふうふ"],
       "ko": ["커플", "부부"],
       "ne": ["जोडी"],
       "pt": ["casal", "par"],
       "zh": ["夫妇", "情侣"]
  },
  "destruction": {
    "emoji": [Emoji.tornado],
       "en": ["chaos", "destruction", "mess"],
       "es": ["caos", "destrucción", "destruccion", "desorden"],
       "ja": ["破壊"],
       "ko": ["난장판", "엉망진창"],
       "ne": ["विनाश"],
       "pt": ["caos", "destruição", "bagunça"],
       "zh": ["破坏"]
  },
  "dig": {
    "emoji": [Emoji.dig],
       "en": ["dig", "digging", "digs"],
       "es": ["cavando", "excavando"],
       "ja": ["穴掘り"],
       "ko": [ "구멍 파기", "땅을 파다"],
       "ne": ["खन्नुहोस्"],
       "pt": ["cavando", "escavando"],
       "zh": ["挖"]
  },
  "dish": {
    "emoji": [Emoji.dish],
       "en": ["dish", "plate"],
       "es": ["plato"],
       "ja": ["ごはん"],
       "ko": ["접시"],
       "ne": ["थाल"],
       "pt": ["prato"],
       "zh": ["盘子"]
  },
  "door": {
    "emoji": [Emoji.door],
       "en": ["door"],
       "es": ["puerta"],
       "ja": ["扉", "戸"],
       "ko": ["문"],
       "ne": ["ढोका"],
       "pt": ["porta"],
       "zh": ["门"]
  },
  "ear": {
    "emoji": [Emoji.ear],
       "en": ["ear", "ears"],
       "es": ["oreja", "orejas"],
       "ja": ["耳"],
       "ko": ["귀"],
       "ne": ["कान"],
       "pt": ["orelha", "orelhas"],
       "zh": ["耳"]
  },
  "eye": {
    "emoji": [Emoji.eye],
       "en": ["eye", "eyes"],
       "es": ["ojo", "ojos"],
       "ja": ["目"],
       "ko": ["눈"],
       "ne": ["कान"],
       "pt": ["olho", "olhos"],
       "zh": ["眼睛", "眼"]
  },
  "flowers": {
    "emoji": [Emoji.flower],
       "en": ["flower", "flowers"],
       "es": ["flor", "flores"],
       "ja": ["花"],
       "ko": ["꽃"],
       "ne": ["फूल", "फूलहरू"],
       "pt": ["flor", "flores"],
       "zh": ["花"]
  },
  "grooming": {
    "emoji": [Emoji.shower],
       "en": ["groom", "grooming", "cleaning"],
       "es": ["limpiándose", "limpiandose", "lamiéndose", "lamiendose", "lavándose", "lavandose"],
       "ja": ["毛づくろい"],
       "ko": ["몸 단장"],
       "ne": ["फूलहरू"],
       "pt": ["limpando-se"],
       "zh": ["梳毛"]
  },
  "grumpy": {
    "emoji": [Emoji.grumpy],
       "en": ["grumpy", "grouchy"],
       "es": ["gruñona", "gruñón", "grunona", "grunon"],
       "ja": ["ご機嫌ナナメ"],
       "ko": ["심술궂은", "투덜거리는", "기분이 나쁜"],
       "ne": ["नराम्रो"],
       "pt": ["rabugento", "mal-humorado"],
       "zh": ["牢骚满腹"]
  },
  "hammock": {
    "emoji": [Emoji.camping],
       "en": ["hammock"],
       "es": ["hamaca"],
       "ja": ["ハンモック"],
       "ko": ["해먹", "그물 침대"],
       "ne": ["ह्यामॉक"],
       "pt": ["rede de dormir"],
       "zh": ["吊床"]
  },
  "home": {
    "emoji": [Emoji.home],
       "en": ["home"],
       "es": ["casa", "en casa"],
       "ja": ["お家"],
       "ko": ["집"],
       "ne": ["घर"],
       "pt": ["casa", "lar"],
       "zh": ["家"]
  },
  "in love": {
    "emoji": [Emoji.hearts],
       "en": ["in love", "love"],
       "es": ["enamorado"],
       "ja": ["恋"],
       "ko": ["사랑"],
       "ne": ["मायामा"],
       "pt": ["amor", "apaixonado"],
       "zh": ["热恋", "恋爱"]
  },
  "itchy": {
    "emoji": [Emoji.itch],
       "en": ["itchy", "scratchy"],
       "es": ["rascándose", "rascandose"],
       "ja": ["カイカイ", "かゆい"],
       "ko": ["가려운", "긁기", "간지러운"],
       "ne": ["खुजली"],
       "pt": ["coceira", "coçando"],
       "zh": ["挠痒", "抓痒"]
  },
  "jizo": {
    "emoji": [Emoji.jizo],
       "en": ["jizo", "jizo statue", "statue"],
       "es": ["estatua"],
       "ja": ["お地蔵さん"],
       "ko": ["불상"],
       "ne": ["मूर्ति"],
       "pt": ["posição de estátua"],
       "zh": ["地藏菩萨"]
  },
  "keeper": {
    "emoji": [Emoji.weary],
       "en": ["keeper", "zookeeper"],
       "es": ["cuidador", "cuidadora"],
       "ja": ["飼育員"],
       "ko": ["사육사", "동물원 사육사"],
       "ne": ["चिडियाखाना"],
       "pt": ["cuidador", "cuidadora"],
       "zh": ["饲养员"]
  },
  "kiss": {
    "emoji": [Emoji.kiss],
       "en": ["kissing", "kiss"],
       "es": ["beso", "besos"],
       "ja": ["接吻", "せっぷん", "キス"],
       "ko": ["뽀뽀", "키스", "입맞춤"],
       "ne": ["चुम्बन"],
       "pt": ["beijo", "beijos", "beijando"],
       "zh": ["接吻", "亲亲", "吻"]
  },
  "laying down": {
    "emoji": [Emoji.bed],
       "en": ["lay down", "laying down"],
       "es": ["acostado", "recostado"],
       "ja": ["寝そべっている"],
       "ko": ["누워 있기", "눕다", "쉬기"],
       "ne": ["तल राख्नु"],
       "pt": ["deitado", "deitando-se"],
       "zh": ["躺"]
  },
  "lips": {
    "emoji": [Emoji.lips],
       "en": ["lips"],
       "es": ["labios"],
       "ja": ["くちびる"],
       "ko": ["입술"],
       "ne": ["ओठ"],
       "pt": ["lábios"],
       "zh": ["唇"]
  },
  "long-tongue": {
    "emoji": [Emoji.tongue +
              Emoji.tongue],
       "en": ["long tongue", "long-tongue"],
       "es": ["sacando la lengua"],
       "ja": ["長い舌"],
       "ko": ["긴 혀"],
       "ne": ["लामो जीभ"],
       "pt": ["mostrando a língua"],
       "zh": ["伸长舌头"]
  },
  "lunch time": {
    "emoji": [Emoji.bento],
       "en": ["lunch time", "lunch"],
       "es": ["hora de comer", "almuerzo"],
       "ja": ["ランチの時間"],
       "ko": ["점심 시간"],
       "ne": ["खाजा समय", "भोजन"],
       "pt": ["almoço", "hora do almoço"],
       "zh": ["午餐时间"]
  },
  "mofumofu": {
     "emoji": [Emoji.teddybear],
        "en": ["mofumofu", "fluffy", "punchy"],
        "es": ["rechoncho", "rechoncha", "esponjoso", "esponjosa"],
        "ja": ["モフモフ"],
        "ko": ["포근포근", "복슬복슬", "부드러운"],
        "ne": ["रमाईलो"],
        "pt": ["felpudo", "fofo", "gorducho", "rechonchudo"],
        "zh": ["软软"]
  },
  "muzzle": {
     "emoji": [Emoji.muzzle],
        "en": ["muzzle", "snout"],
        "es": ["hocico", "trompa"],
        "ja": ["マズル"],
        "ko": ["주둥이"],
        "ne": ["थूली", "थोरै"],
        "pt": ["focinho"],
        "zh": ["口鼻套"]
  },
  "night": {
     "emoji": [Emoji.moon],
        "en": ["night"],
        "es": ["noche"],
        "ja": ["夜"],
        "ko": ["밤"],
        "ne": ["रात"],
        "pt": ["noite"],
        "zh": ["夜", "晚上"]
  },
  "nose": {
     "emoji": [Emoji.nose],
        "en": ["nose", "snout"],
        "es": ["nariz", "hocico"],
        "ja": ["鼻"],
        "ko": ["코"],
        "ne": ["नाक"],
        "pt": ["nariz"],
        "zh": ["鼻子"]
  },
  "old": {
     "emoji": [Emoji.grandpa],
        "en": ["old"],
        "es": ["viejo", "vieja"],
        "ja": ["シニアパンダさん", "年老いた"],
        "ko": ["늙은", "나이 든", "연로한"],
        "ne": ["पुरानो"],
        "pt": ["idoso", "idosa"],
        "zh": ["老人"]
  },
  "panda bowl": {
     "emoji": [Emoji.panda + 
               Emoji.bowl],
        "en": ["panda bowl", "bowl"],
        "es": ["bola de panda", "bola"],
        "ja": ["エサ鉢"],
        "ko": ["밥그릇"],
        "ne": ["पोनिया कटोरा"],
        "pt": ["tigela de panda", "tigela"],
        "zh": ["碗"]
  },
  "paws": {
     "emoji": [Emoji.paws],
        "en": ["paws", "feet"],
        "es": ["patas", "pies"],
        "ja": ["足"],
        "ko": ["발", "발바닥"],
        "ne": ["पन्जा"],
        "pt": ["patas", "pés"],
        "zh": ["爪"]
  },
  "peek": {
     "emoji": [Emoji.monocle],
        "en": ["peek", "peeking"],
        "es": ["ojeando", "mirando", "curioseando"],
        "ja": ["チラ見"],
        "ko": ["엿보기", "살짝 보기", "훔쳐보기"],
        "ne": ["झिक्नु"],
        "pt": ["espiando"],
        "zh": ["偷窥"]
  },
  "playing": {
     "emoji": [Emoji.playing],
        "en": ["playing", "play"],
        "es": ["jugando", "jugar"],
        "ja": ["拝み食い", "両手食い"],
        "ko": ["놀기", "놀이 중", "장난치기"],
        "ne": ["खेलिरहेको", "खेल्नु"],
        "pt": ["brincando"],
        "zh": ["玩耍"]
  },
  "poop": {
     "emoji": [Emoji.poop],
        "en": ["poop"],
        "es": ["heces", "caca", "mierda"],
        "ja": [Emoji.poop],
        "ko": ["응가"],
        "ne": [Emoji.poop],
        "pt": ["cocô", "cocó", "caca"],
        "zh": ["便便"]
  },
  "pooping": {
     "emoji": [Emoji.panda +
               Emoji.poop],
        "en": ["pooping"],
        "es": ["defecando", "haciendo caca", "cagando"],
        "ja": ["💩している"],
        "ko": ["응가 중"],
        "ne": [Emoji.panda +
               Emoji.poop],
        "pt": ["fazendo cocô", "fazendo caca"],
        "zh": ["便便"]
  },
  "portrait": {
     "emoji": [Emoji.portrait],
        "en": ["portrait", "square"],
        "es": ["retrato", "cuadrada"],
        "ja": ["顔写真"],
        "ko": ["초상화"],
        "ne": ["चित्र"],
        "pt": ["retrato"],
        "zh": ["肖像"]
  },
  "praying": {
     "emoji": [Emoji.pray],
        "en": ["praying", "pray"],
        "es": ["rezando", "orando"],
        "ja": ["お祈りしている"],
        "ko": ["기도하기", "기도 중"],
        "ne": ["प्रार्थना गर्दै", "प्रार्थना"],
        "pt": ["rezando", "orando", "mãos postas"],
        "zh": ["祈祷"]
  },
  "profile": {
     "emoji": [Emoji.profile],
        "en": ["profile"],
        "es": ["perfil"],
        "ja": ["プロフィール画像"],
        "ko": ["프로필"],
        "ne": ["प्रोफाइल"],
        "pt": ["perfil"],
        "zh": ["资料"]
  },
  "pull-up": {
     "emoji": [Emoji.weight],
        "en": ["pull-up", "pull-ups", "pullup"],
        "es": ["flexiones", "dominadas"],
        "ja": ["鉄棒", "懸垂"],
        "ko": ["턱걸이"],
        "ne": ["तान्नु"],
        "pt": ["flexões"],
        "zh": ["引体向上"]
  },
  "pumpkin": {
     "emoji": [Emoji.pumpkin],
        "en": ["pumpkin", "halloween"],
        "es": ["calabaza"],
        "ja": ["かぼちゃ", "南瓜"],
        "ko": ["호박", "할로윈"],
        "ne": ["कद्दू", "हेलोवीन"],
        "pt": ["abóbora"],
        "zh": ["南瓜"]
  },
  "reiwa": {
     "emoji": [Emoji.reiwa],
        "en": ["reiwa"],
        "es": ["reiwa"],
        "ja": ["令和"],
        "ko": ["레이와"],
        "ne": [Emoji.reiwa],
        "pt": ["reiwa"],
        "zh": ["令和"]
  },
  "sample": {
     "emoji": [Emoji.panda],
        "en": ["sample"],
        "es": ["muestra"],
        "ja": ["見本", "試料", "試供品"],
        "ko": ["샘플"],
        "ne": ["नमूना"],
        "pt": ["amostra"],
        "zh": ["样本", "样品", "样"]
  },
  "scale": {
     "emoji": [Emoji.scale],
        "en": ["scale", "weigh-in", "weight"],
        "es": ["balanza", "pesa"],
        "ja": ["体重計", "たいじゅうけい"],
        "ko": ["체중계", "저울"],
        "ne": ["स्केल", "तौल"],
        "pt": ["balança", "peso"],
        "zh": ["测体重"]
  },
  "shake": {
     "emoji": [Emoji.cyclone],
        "en": ["shake", "shaking"],
        "es": ["sacudiéndose", "sacudiendose"],
        "ja": ["ドリパン", "ブルブル", "ゆらゆら"],
        "ko": ["흔들기", "흔들림", "떨림"],
        "ne": ["हल्लाउनु"],
        "pt": ["sacudindo-se"],
        "zh": ["摇晃"]
  },
  "shedding": {
     "emoji": [Emoji.worry],
        "en": ["shedding", "changing fur", "losing fur", "losing hair"],
        "es": ["mudando", "mudando el pelo", "cambiando el pelo"],
        "ja": ["換毛", "泣いている"],
        "ko": ["털갈이"],
        "ne": ["सुस्त"],
        "pt": ["mudando o pelo", "perdendo pelo"],
        "zh": ["换毛"]
  },
  "shoots": {
     "emoji": [Emoji.bamboo],
        "en": ["shoots", "shoot"],
        "es": ["brotes"],
        "ja": ["竹の子", "たけのこ"],
        "ko": ["죽순"],
        "ne": ["बाँस को टुप्पो"],
        "pt": ["brotos", "broto"],
        "zh": ["竹笋"]
  },
  "siblings": {
     "emoji": [Emoji.siblings],
        "en": ["siblings"],
        "es": ["hermanos"],
        "ja": ["兄弟", "きょうだい"],
        "ko": ["형제·자매"],
        "ne": ["भाइबहिनीहरू"],
        "pt": ["irmãos(ãs)"],
        "zh": ["同胞"]
  },
  "sisters": {
     "emoji": [Emoji.sisters],
        "en": ["sisters"],
        "es": ["hermanas"],
        "ja": ["姉妹"],
        "ko": ["자매"],
        "ne": ["बहिनीहरू"],
        "pt": ["irmãs"],
        "zh": ["姐妹"]
  },
  "sleeping": {
     "emoji": [Emoji.sleeping],
        "en": ["sleeping", "sleep", "asleep"],
        "es": ["durmiendo", "dormido", "dormida", "durmiéndose", "durmiendose", "dormir"],
        "ja": ["寝ている"],
        "ko": ["잠", "잠자는 중", "수면"],
        "ne": ["सुत्नु", "निद्रा"],
        "pt": ["dormindo"],
        "zh": ["睡觉"]
  },
  "slobber": {
     "emoji": [Emoji.slobber],
        "en": ["slobber", "slobbering"],
        "es": ["babeándo", "babeando", "baba"],
        "ja": ["よだれをたらしている"],
        "ko": ["침 흘리기", "침"],
        "ne": ["स्लोबर"],
        "pt": ["babando", "baba"],
        "zh": ["口水", "流口水"]
  },
  "smile": {
     "emoji": [Emoji.smile],
        "en": ["smile", "smiling"],
        "es": ["sonriéndo", "sonriendo", "sonreír", "sonreir", "sonriente", "sonrisa"],
        "ja": ["スマイル"],
        "ko": ["웃음", "웃는 중"],
        "ne": ["हाँसो"],
        "pt": ["sorrindo", "sorriso", "sorridente"],
        "zh": ["笑", "微笑"]
  },
  "snow": {
     "emoji": [Emoji.snow],
        "en": ["snow"],
        "es": ["nieve"],
        "ja": ["雪"],
        "ko": ["눈"],
        "ne": ["हिउँ"],
        "pt": ["neve"],
        "zh": ["雪"]
  },
  "spider": {
     "emoji": [Emoji.spider],
        "en": ["spider", "spider-bear", "spider bear"],
        "es": ["araña", "arana"],
        "ja": ["スパイダー"],
        "ko": ["거미"],
        "ne": ["माकुरो", "माकुरो भालु"],
        "pt": ["panda-aranha", "aranha"],
        "zh": ["蜘蛛"]
  },
  "standing": {
     "emoji": [Emoji.no_emoji],
        "en": ["standing", "stand"],
        "es": ["de pie", "parado"],
        "ja": ["立っている"],
        "ko": ["서다"],
        "ne": ["खडा"],
        "pt": ["de pé", "em pé"],
        "zh": ["站立"]
  },
  "stretching": {
     "emoji": [Emoji.no_emoji],
        "en": ["stretching", "stretch"],
        "es": ["estirándose", "estirandose"],
        "ja": ["ストレッチしている"],
        "ko": ["스트레칭"],
        "ne": ["तन्नु", "तान्न"],
        "pt": ["espreguiçando-se"],
        "zh": ["拉伸"]
  },
  "surprise": {
     "emoji": [Emoji.fireworks],
        "en": ["surprise", "surprised"],
        "es": ["sorpresa", "sorprendido", "sorprendida"],
        "ja": ["びっくり"],
        "ko": ["놀라움"],
        "ne": ["अचम्म"],
        "pt": ["surpreso", "surpresa", "surpreendido"],
        "zh": ["惊喜"]
  },
  "tail": {
     "emoji": [Emoji.snake],
        "en": ["tail"],
        "es": ["cola"],
        "ja": ["しっぽ"],
        "ko": ["꼬리"],
        "ne": ["पुच्छर"],
        "pt": ["cauda", "rabo"],
        "zh": ["尾巴"]
  },
  "techitechi": {
     "emoji": [Emoji.target],
        "en": ["techitechi", "spot", "cute spot"],
        "es": ["lunares", "lunar"],
        "ja": ["テチテチ"],
        "ko": ["목표"],
        "ne": ["राम्रो स्थान"],
        "pt": ["pinta", "pintinha"],
        "zh": ["目标"]
  },
  "tongue": {
     "emoji": [Emoji.tongue],
        "en": ["tongue"],
        "es": ["lengua"],
        "ja": ["べろ"],
        "ko": ["혀"],
        "ne": ["जिब्रो"],
        "pt": ["língua"],
        "zh": ["舌"]
  },
  "toys": {
     "emoji": [Emoji.football],
        "en": ["toy", "toys"],
        "es": ["juguete", "juguetes"],
        "ja": ["遊具", "おもちゃ", "おもちゃ"],
        "ko": ["장난감"],
        "ne": ["खेलौना"],
        "pt": ["brinquedo", "brinquedos"],
        "zh": ["玩具"]
  },
  "tree": {
     "emoji": [Emoji.tree],
        "en": ["tree", "trees"],
        "es": ["árbol", "arbol", "árboles", "arboles"],
        "ja": ["木"],
        "ko": ["나무"],
        "ne": ["रूख"],
        "pt": ["árvore", "árvores"],
        "zh": ["树"]
  },
  "upside-down": {
     "emoji": [Emoji.upside_down],
        "en": ["upside-down", "upside down"],
        "es": ["al revés", "al reves", "cabeza abajo"],
        "ja": ["逆さま"],
        "ko": ["거꾸로", "뒤집힌"],
        "ne": ["तलको माथि"],
        "pt": ["cabeça para baixo", "ponta-cabeça"],
        "zh": ["翻转"]
  },
  "wink": {
     "emoji": [Emoji.wink],
        "en": ["wink", "winking"],
        "es": ["guiño", "guino"],
        "ja": ["ウィンク"],
        "ko": ["윙크"],
        "ne": ["आखा भ्किम्काउनु"],
        "pt": ["piscando", "piscada", "piscadela", "piscar de olhos"],
        "zh": ["眨眼"]
  },
  "wet": {
     "emoji": [Emoji.raincloud],
        "en": ["wet"],
        "es": ["mojado", "mojada"],
        "ja": ["濡れた"],
        "ko": ["젖은", "축축한"],
        "ne": ["भिजेको"],
        "pt": ["molhado", "molhada"],
        "zh": ["湿"]
  },
  "white face": {
     "emoji": [Emoji.no_emoji],
        "en": ["white face", "light face"],
        "es": ["cara blanca"],
        "ja": ["色白さん", "しろめん", "白面", "白めん"],
        "ko": ["하얀 얼굴", "밝은 얼굴"],
        "ne": ["सेतो अनुहार"],
        "pt": ["face branca"],
        "zh": ["浅色的脸"]
  },
  "window": {
     "emoji": [Emoji.window],
        "en": ["window"],
        "es": ["ventana"],
        "ja": ["窓", "まど"],
        "ko": ["창문"],
        "ne": ["विन्डो"],
        "pt": ["janela"],
        "zh": ["窗"]
  },
  "whiskers": {
     "emoji": [Emoji.whiskers],
        "en": ["whiskers", "whisker"],
        "es": ["bigotes", "bigote"],
        "ja": ["ひげ"],
        "ko": ["수염"],
        "ne": ["फुसफुस"],
        "pt": ["bigode", "bigodes"],
        "zh": ["晶須"]
  },
  "yawn": {
     "emoji": [Emoji.yawn],
        "en": ["yawn", "yawning"],
        "es": ["bostezo", "bostezando"],
        "ja": ["あくび"],
        "ko": ["하품", "하품하기"],
        "ne": ["जांभई"],
        "pt": ["bocejo", "bocejando"],
        "zh": ["哈欠", "呵欠"]
  }
}
