/*
    Language fallback methods
*/

var Language = {};   // Namespace

Language.L = {};     // Prototype

Language.init = function() {
  var language = Object.create(Language.L);
  // The current displayed language in the page, and stored in the 
  // browser's localStorage API
  language.display = undefined;
  language.storage = window.localStorage;
  // Construct tag lists with arbitrary capitalization
  for (let tag in language.tags) {
    var en_tags = language.tags[tag]["en"];
    var first_cap = en_tags.map(x => Language.capitalize(x, "first"));
    var all_cap = en_tags.map(y => Language.capitalize(y, "all"));
    language.tags[tag]["en"] = en_tags.concat(first_cap)
                                      .concat(all_cap)
                                      .filter(function(value, index, self) {
                                        return self.indexOf(value) === index;
                                      });
  }
  return language;
}

/*
   Language elements translatable in the GUI
*/
// Bias values. This helps choose what the most likely second-language
// for a given display language might be. This was added due to the
// likelihood that Chinese speakers may be able to read English characters,
// but not Japanese -- so we should fall back to English for them, despite
// what an entity's preferred language order might be.
Language.L.bias = {
  "en": [],
  "es": ["latin"],
  "ja": ["latin"],
  "ko": ["latin"],
  "ne": ["latin"],
  "pt": ["latin"],
  "zh": ["latin"]
}
// Types of alphabets, so we can fall back to an alphabet that someone
// is capable of reading based on their language skills. In practice,
// we opt to fall back to latin languages since that alphabet is more
// widely understood
Language.alphabets = {
  "cjk": ["ja", "ko", "zh"],
  "cyrillic": ["ru"],
  "latin": ["da", "de", "en", "es", "fr", "nl", "pl", "pt", "sv"],
}

// Character translation tables per language. Just hiragana/katakana.
// Define this for all objects, not just for the instance.
Language.charset = {
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

// Date formats for parsing support fallbacks, if there
// would otherwise be ambiguity in the dates
Language.L.date_locale = {
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

// Default parameters for entities that lack language information
Language.L.default = {
  "order": ["en", "ja"]
}

// TODO: do we need localized emojis for various things?
Language.L.emoji = {
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

// TODO: key on other language versions of country names
Language.L.flags = {
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

Language.L.gui = {
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
    "en": Language.L.flags["USA"],
    "es": Language.L.flags["Spain"],
    "ja": Language.L.flags["Japan"],
    "ko": Language.L.flags["South Korea"],
    "ne": Language.L.flags["Nepal"],
    "pt": Language.L.flags["Portugal"],
    "zh": Language.L.flags["China"]
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

Language.L.messages = {
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
    "en": [Language.L.emoji.autumn,
           " Season of changing colors ",
           Language.L.emoji.autumn],
    "es": [Language.L.emoji.autumn,
           " Temporada de colores cambiantes ",
           Language.L.emoji.autumn],
    "ja": [Language.L.emoji.autumn,
           " 色が変わる季節 ",
           Language.L.emoji.autumn],
    "ko": [Language.L.emoji.autumn,
           "색이 변하는 계절 ",
           Language.L.emoji.autumn],
    "ne": [Language.L.emoji.autumn, 
           " रंग परिवर्तन को मौसम ",
           Language.L.emoji.autumn],
    "pt": [Language.L.emoji.autumn,
           " Estação de mudança de cores ",
           Language.L.emoji.autumn],
    "zh": [Language.L.emoji.autumn, 
           " 变色的季节 ",
           Language.L.emoji.autumn]
  },
  "baby_photos": {
    "en": [Language.L.emoji.baby,
           " Precious little angels ",
           Language.L.emoji.baby],
    "es": [Language.L.emoji.baby,
           " Angelitos preciosos ",
           Language.L.emoji.baby],
    "ja": [Language.L.emoji.baby,
           " 貴重な小さな天使 ",
           Language.L.emoji.baby],
    "ko": [Language.L.emoji.baby,
           "소중한 작은 천사들 ",
           Language.L.emoji.baby],
    "ne": [Language.L.emoji.baby,
           " बहुमूल्य साना स्वर्गदूतहरू ",
           Language.L.emoji.baby],
    "pt": [Language.L.emoji.baby,
           " Anjinhos preciosos ",
           Language.L.emoji.baby],
    "zh": [Language.L.emoji.baby,
           " 珍贵的小天使 ",
           Language.L.emoji.baby]
  },
  "birthday_overflow": {
    "en": [Language.L.emoji.fireworks,
           " ",
           "<INSERTCOUNT>",
           " birthdays today!"],
    "es": [Language.L.emoji.fireworks,
           " ¡",
           "<INSERTCOUNT>",
           " cumpleaños hoy!"],
    "ja": [Language.L.emoji.fireworks,
           " 今日は",
           "<INSERTCOUNT>",
           "歳の誕生日！"],
    "ko": [Language.L.emoji.fireworks,
           " 오늘 ",
           "<INSERTCOUNT>",
           " 생일!"],
    "ne": [Language.L.emoji.fireworks,
           " आज ",
           "<INSERTCOUNT>",
           " जन्मदिन!"],
    "pt": [Language.L.emoji.fireworks,
           " ",
           "<INSERTCOUNT>",
           " aniversários hoje!"],
    "zh": [Language.L.emoji.fireworks,
           " 今天",
           "<INSERTCOUNT>",
           "个生日！"]
  },
  "closed": {
    "en": [Language.L.emoji.closed + " ", 
           "Permanently closed on ",
           "<INSERTDATE>"],
    "es": [Language.L.emoji.closed + " ",
           "Cerrado permanentemente el ",
           "<INSERTDATE>"],
    "ja": [Language.L.emoji.closed + " ",
           "<INSERTDATE>",
           "に閉業"],
    "ko": [Language.L.emoji.closed + " ",
           "<INSERTDATE>",
           " 영구 폐쇄"],
    "ne": [Language.L.emoji.closed + " ",
           "स्थायी रूपमा ",
           "<INSERTDATE>",
           "बन्द भयो"],
    "pt": [Language.L.emoji.closed + " ", 
           "Permanentemente fechado em ",
           "<INSERTDATE>"],
    "zh": [Language.L.emoji.closed + " ",
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
    "en": [Language.L.emoji.gift + " ",
           "<INSERTUSER>",
           " has contributed ",
           "<INSERTNUMBER>",
           " photos."],
    "es": [Language.L.emoji.gift + " ",
           "<INSERTUSER>",
           " ha contribuido con ",
           "<INSERTNUMBER>",
           " fotos."],
    "ja": [Language.L.emoji.gift + " ",
           "<INSERTUSER>",
           "は",
           "<INSERTNUMBER>",
           "枚の写真を寄稿しました。"],
    "ko": [Language.L.emoji.gift + " ",
           "<INSERTUSER>",
           "이(가) ",
           "<INSERTNUMBER>",
           "장의 사진을 제공했습니다."],
    "ne": [Language.L.emoji.gift + " ",
           "<INSERTUSER>",
           " ले ",
           "<INSERTNUMBER>",
           " फोटो योगदान गरेको छ"],
    "pt": [Language.L.emoji.gift + " ",
           "<INSERTUSER>",
           " contribuiu com ",
           "<INSERTNUMBER>",
           " fotos."],
    "zh": [Language.L.emoji.gift + " ",
           "<INSERTUSER>",
           "提供了",
           "<INSERTNUMBER>",
           "张照片。"]
  },
  "credit_animal_filter_single": {
    "en": [Language.L.emoji.gift + " ",
           "<INSERTUSER>",
           " has contributed ",
           "<INSERTNUMBER>",
           " photos of ",
           "<INSERTNAME>",
           "."],
    "es": [Language.L.emoji.gift + " ",
           "<INSERTUSER>",
           " ha contribuido con ",
           "<INSERTNUMBER>",
           " fotos de ",
           "<INSERTNAME>",
           "."],
    "ja": [Language.L.emoji.gift + " ",
           "<INSERTUSER>",
           "が",
           "<INSERTNAME>",
           "の写真を",
           "<INSERTNUMBER>",
           "枚投稿しました。"],
    "ko": [Language.L.emoji.gift + " ",
           "<INSERTUSER>",
           "이(가) ",
           "<INSERTNAME>",
           "의 사진을",
           "<INSERTNUMBER>",
           "장 제공했습니다."],   
    "ne": [Language.L.emoji.gift + " ",
           "<INSERTUSER>",
           " ",
           "<INSERTNUMBER>",
           " ",
           "<INSERTNAME>",
           " फोटोहरु योगदान गरेको छ"],
    "pt": [Language.L.emoji.gift + " ",
           "<INSERTUSER>",
           " contribuiu com ",
           "<INSERTNUMBER>",
           " fotos de ",
           "<INSERTNAME>",
           "."],
    "zh": [Language.L.emoji.gift + " ",
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
    "en": [Language.L.emoji.globe_americas, " Find a zoo nearby!"],
    "es": [Language.L.emoji.globe_americas, " ¡Encuentra un zoológico cerca de ti!"],
    "ja": [Language.L.emoji.globe_asia, " 近くの動物園を見つける"],
    "ko": [Language.L.emoji.globe_asia, " 주변 동물원 찾기"],
    "ne": [Language.L.emoji.globe_asia, " नजिकै चिडियाखाना खोज्नुहोस्"],
    "pt": [Language.L.emoji.globe_americas, " Encontre um zoológico próximo!"],
    "zh": [Language.L.emoji.globe_asia, " 寻找附近的动物园"]
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
    "en": [Language.L.emoji.flower, " ",
           Language.L.emoji.see_and_say, 
           " ",
           "<INSERTNAME>",
           " has been found and is safe!"],
    "es": [Language.L.emoji.flower, " ",
           Language.L.emoji.see_and_say,
           " ¡",
           "<INSERTNAME>",
           " ha sido encontrado y está a salvo!"],
    "ja": [Language.L.emoji.flower, " ",
           Language.L.emoji.see_and_say, 
           " ",
           "<INSERTNAME>",
           " has been found and is safe!"],
    "ko": [Language.L.emoji.flower, " ",
           Language.L.emoji.see_and_say, 
           " ",
           "<INSERTNAME>",
           "이(가) 발견되었습니다!"],
    "ne": [Language.L.emoji.flower, " ",
           Language.L.emoji.see_and_say, 
           " ",
           "<INSERTNAME>",
           " has been found and is safe!"],
    "pt": [Language.L.emoji.flower, " ",
           Language.L.emoji.see_and_say, 
           " ",
           "<INSERTNAME>",
           " foi encontrado(a) e está a salvo!"],
    "zh": [Language.L.emoji.flower, " ",
           Language.L.emoji.see_and_say, 
           " ",
           "<INSERTNAME>",
           " has been found and is safe!"]
  },
  "goodbye": {
    "en": ["Good-bye, ",
           "<INSERTNAME>",
           ". ",
           Language.L.emoji.died,
           " (",
           "<INSERTBIRTH>",
           " — ",
           "<INSERTDEATH>",
           ")"],
    "es": ["Hasta siempre, ",
           "<INSERTNAME>",
           ". ",
           Language.L.emoji.died,
           " (",
           "<INSERTBIRTH>",
           " — ",
           "<INSERTDEATH>",
           ")"],
    "ja": ["ありがとう, ",
           "<INSERTNAME>",
           "。",
           Language.L.emoji.died, 
           "（",
           "<INSERTBIRTH>",
           " — ",
           "<INSERTDEATH>",
           "）"],
    "ko": ["안녕... 잘 가,",
           "<INSERTNAME>",
           ". ",
           Language.L.emoji.died,
           " (",
           "<INSERTBIRTH>",
           " — ",
           "<INSERTDEATH>",
           ")"],   
    "ne": ["विदाई, ",
           "<INSERTNAME>",
           " ",
           Language.L.emoji.died,
           " (",
           "<INSERTBIRTH>",
           " — ",
           "<INSERTDEATH>",
           ")"],
    "pt": ["Adeus, ",
           "<INSERTNAME>",
           ". ",
           Language.L.emoji.died,
           " (",
           "<INSERTBIRTH>",
           " — ",
           "<INSERTDEATH>",
           ")"],
    "zh": ["后会有期, ",
           "<INSERTNAME>",
           "。",
           Language.L.emoji.died,
           "（",
           "<INSERTBIRTH>",
           " — ",
           "<INSERTDEATH>",
           "）"]
  },
  "happy_birthday": {
    "en": [Language.L.emoji.birthday,
           " Happy Birthday, ",
           "<INSERTNAME>",
           "! (",
           "<INSERTNUMBER>",
           ")"],
    "es": [Language.L.emoji.birthday,
           " ¡Feliz cumpleaños, ",
           "<INSERTNAME>",
           "! (",
           "<INSERTNUMBER>",
           ")"],
    "ja": [Language.L.emoji.birthday,
           " ",
           "<INSERTNAME>",
           "、誕生日おめでとう！（",
           "<INSERTNUMBER>",
           "歳）"],
    "ko": [Language.L.emoji.birthday,
           "<INSERTNAME>",
           "의 생일을 축하합니다! (",
           "<INSERTNUMBER>",
           "세)"],
    "ne": [Language.L.emoji.birthday,
           " ",
           "जन्मदिनको शुभकामना, ",
           "<INSERTNAME>",
           "! (",
           "<INSERTNUMBER>",
           ")"],
    "pt": [Language.L.emoji.birthday,
           " Feliz aniversário, ",
           "<INSERTNAME>",
           "! (",
           "<INSERTNUMBER>",
           ")"],
    "zh": [Language.L.emoji.birthday,
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
    "en": [Language.L.emoji.alert, " ",
           Language.L.emoji.see_and_say, 
           " If you see ",
           "<INSERTNAME>",
           ", contact ",
           "<ZOONAME>",
           ": ",
           "<ZOOCONTACT>"],
    "es": [Language.L.emoji.alert, " ",
           Language.L.emoji.see_and_say,
           " Si ves a ",
           "<INSERTNAME>",
           " contacta a ",
           "<ZOONAME>",
           ": ",
           "<ZOOCONTACT>"],
    "ja": [Language.L.emoji.alert, " ",
           Language.L.emoji.see_and_say, 
           " If you see ",
           "<INSERTNAME>",
           ", contact ",
           "<ZOONAME>",
           ": ",
           "<ZOOCONTACT>"],
    "ko": [Language.L.emoji.alert, " ",
           Language.L.emoji.see_and_say, 
           " If you see ",
           "<INSERTNAME>",
           ", contact ",
           "<ZOONAME>",
           ": ",
           "<ZOOCONTACT>"],
    "ne": [Language.L.emoji.alert, " ",
           Language.L.emoji.see_and_say, 
           " If you see ",
           "<INSERTNAME>",
           ", contact ",
           "<ZOONAME>",
           ": ",
           "<ZOOCONTACT>"],
    "pt": [Language.L.emoji.alert, " ",
           Language.L.emoji.see_and_say, 
           " Se vir ",
           "<INSERTNAME>",
           ", contacte ",
           "<ZOONAME>",
           ": ",
           "<ZOOCONTACT>"],
    "zh": [Language.L.emoji.alert, " ",
           Language.L.emoji.see_and_say, 
           " If you see ",
           "<INSERTNAME>",
           ", contact ",
           "<ZOONAME>",
           ": ",
           "<ZOOCONTACT>"]
  },
  "lunch_time": {
    "en": [Language.L.emoji.paws, " ",
           "What's for lunch?", " ",
           Language.L.emoji.greens],
    "es": [Language.L.emoji.paws, " ",
           "¿Qué hay de comer?", " ",
           Language.L.emoji.greens],
    "ja": [Language.L.emoji.paws, " ",
           "昼食は何ですか？", " ",
           Language.L.emoji.greens],
    "ko": [Language.L.emoji.paws, " ",
           "오늘 점심 메뉴는 무엇인가요?", " ",
           Language.L.emoji.greens],
    "ne": [Language.L.emoji.paws, " ",
           "खाजाको लागि के हो?", " ",
           Language.L.emoji.greens],
    "pt": [Language.L.emoji.paws, " ",
           "O que tem para o almoço?", " ",
           Language.L.emoji.greens],
    "zh": [Language.L.emoji.paws, " ",
           "午饭吃什么？", " ",
           Language.L.emoji.greens]
  },
  "missing_you": {
    "en": ["We miss you, ",
           "<INSERTNAME>",
           ". ",
           Language.L.emoji.died,
           " (",
           "<INSERTBIRTH>",
           " — ",
           "<INSERTDEATH>",
           ")"],
    "es": ["Te extrañamos, ",
           "<INSERTNAME>",
           ". ",
           Language.L.emoji.died,
           " (",
           "<INSERTBIRTH>",
           " — ",
           "<INSERTDEATH>",
           ")"],
    "ja": ["あなたがいなくてとても寂しい, ",
           "<INSERTNAME>",
           "。",
           Language.L.emoji.died, 
           "（",
           "<INSERTBIRTH>",
           " — ",
           "<INSERTDEATH>",
           "）"],
    "ko": ["보고 싶어,",
           "<INSERTNAME>",
           ". ",
           Language.L.emoji.died,
           " (",
           "<INSERTBIRTH>",
           " — ",
           "<INSERTDEATH>",
           ")"],
    "ne": ["हामी तिमीलाई सम्झिन्छौं",
           "<INSERTNAME>",
           " ",
           Language.L.emoji.died,
           " (",
           "<INSERTBIRTH>",
           " — ",
           "<INSERTDEATH>",
           ")"],
    "pt": ["Saudades de você, ",
           "<INSERTNAME>",
           ". ",
           Language.L.emoji.died,
           " (",
           "<INSERTBIRTH>",
           " — ",
           "<INSERTDEATH>",
           ")"],
    "zh": ["我们想你, ",
           "<INSERTNAME>",
           "。",
           Language.L.emoji.died,
           "（",
           "<INSERTBIRTH>",
           " — ",
           "<INSERTDEATH>",
           "）"]
  },
  "nearby_zoos": {
    "en": [Language.L.emoji.website,
           " ",
           Language.L.emoji.home,
           " Finding nearby zoos. ",
           "If geolocation fails, try ",
           "searching for your city."],
    "es": [Language.L.emoji.website,
           " ",
           Language.L.emoji.home,
           " Encontrar zoológicos cercanos. ", 
           "Si la geolocalización falla, intente ",
           " buscar su ciudad."],
    "ja": [Language.L.emoji.website,
           " ",
           Language.L.emoji.home,
           " 近くの動物園を見上げます。",
           "ジオロケーションが失敗した場合は、",
           "都市を検索してみてください。"],
    "ko": [Language.L.emoji.website,
           " ",
           Language.L.emoji.home,
           " 가까운 동물원을 찾고 있어요. ",
           "위치 정보가 실패하면,",
           "도시 이름으로 검색해보세요."],   
    "ne": [Language.L.emoji.website, 
           " ",
           Language.L.emoji.home,
           " नजिकका चिडियाखानाहरू भेट्टाउँदै।",
           " यदि भौगोलिक स्थान असफल भयो भने,",
           " आफ्नो शहरको लागि खोजी प्रयास गर्नुहोस्।"],
    "pt": [Language.L.emoji.website,
           " ",
           Language.L.emoji.home,
           " Procurando zoológicos próximos. ",
           "Se a geolocalização falhar, ",
           "tente pesquisar sua cidade."],
    "zh": [Language.L.emoji.website,
           " ",
           Language.L.emoji.home,
           " 查找附近的动物园。",
           "如果地理位置失败，",
           "请尝试搜索您的城市。"]
  },
  "new_photos": {
    "contributors": {
      "en": [Language.L.emoji.giftwrap,
             " ",
             "<INSERTCOUNT>",
             " new contributors"],
      "es": [Language.L.emoji.giftwrap,
            " ",
            "<INSERTCOUNT>",
            " nuevos contribuyentes"],
      "ja": [Language.L.emoji.giftwrap,
             "<INSERTCOUNT>",
             "人の新しい貢献者"],
      "ko": [Language.L.emoji.giftwrap,
             "<INSERTCOUNT>",
             "새 기여자"],
      "ne": [Language.L.emoji.giftwrap,
             " ",
             "<INSERTCOUNT>",
             " योगदानकर्ताहरू नयाँ"],
      "pt": [Language.L.emoji.giftwrap,
             " ",
             "<INSERTCOUNT>",
             " novos contribuintes"],
      "zh": [Language.L.emoji.giftwrap,
             "<INSERTCOUNT>",
             "新贡献者"]
    },
    "pandas": {
      "en": [Language.L.emoji.profile,
             " ",
             "<INSERTCOUNT>",
             " new red pandas"],
      "es": [Language.L.emoji.profile,
             " ",
             "<INSERTCOUNT>",
             " nuevos pandas rojos"],
      "ja": [Language.L.emoji.profile,
             " ",
             "<INSERTCOUNT>",
             "つの新しいレッサーパンダ"],
      "ko": [Language.L.emoji.profile,
             " ",
             "<INSERTCOUNT>",
             " 새로운 레서판다가 찾아왔어요!"],
      "ne": [Language.L.emoji.profile,
             " ",
             "<INSERTCOUNT>",
             " निगल्य पोन्या नयाँ"],
      "pt": [Language.L.emoji.profile,
             " ",
             "<INSERTCOUNT>",
             " novos pandas-vermelhos"],
      "zh": [Language.L.emoji.profile,
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
      "en": [Language.L.emoji.zoo,
             " ",
             "<INSERTCOUNT>",
             " new zoos"],
      "es": [Language.L.emoji.zoo,
             " ",
             "<INSERTCOUNT>",
             " nuevos zoológicos"],
      "ja": [Language.L.emoji.zoo,
             "<INSERTCOUNT>",
             "つの新しい動物園"],
      "ko": [Language.L.emoji.zoo,
             " ",
             "<INSERTCOUNT>",
             "새로운 동물원"],
      "ne": [Language.L.emoji.zoo,
             " ",
             "<INSERTCOUNT>",
             " नयाँ चिडियाखाना"],
      "pt": [Language.L.emoji.zoo,
             " ",
             "<INSERTCOUNT>",
             " novos zoológicos"],
      "zh": [Language.L.emoji.zoo,
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
    "en": [Language.L.emoji.hearts, " ",
           "<INSERTNAMES>",
           ": We will never forget you. ",
           " ", Language.L.emoji.paws],
    "es": [Language.L.emoji.hearts, " ",
           "<INSERTNAMES>",
           ": Nosotros nunca te olvidaremos. ",
           " ", Language.L.emoji.paws],
    "ja": [Language.L.emoji.hearts, " ",
           "<INSERTNAMES>",
           "〜私たちは君を決して忘れません。",
           Language.L.emoji.paws],
    "ko": [Language.L.emoji.hearts, " ",
           "<INSERTNAMES>",
           ": 우리는 너를 절대 잊지 않을 거야.",
           Language.L.emoji.paws],
    "ne": [Language.L.emoji.hearts, " ",
           "<INSERTNAMES>",
           ": हामी तिमीलाई कहिल्यै बिर्सिने छैनौं। ",
           Language.L.emoji.paws],
    "pt": [Language.L.emoji.hearts, " ",
           "<INSERTNAMES>",
           ": Nunca esqueceremos de você. ",
           " ", Language.L.emoji.paws],
    "zh": [Language.L.emoji.hearts, " ",
           "<INSERTNAMES>",
           ": 我们永远不会忘记你。",
           Language.L.emoji.paws]
  },
  "shovel_pandas": {
    "en": [Language.L.emoji.dig, " ",
           "Searching for buried treasure!", " ",
           Language.L.emoji.treasure],
    "es": [Language.L.emoji.dig, " ",
           "¡Buscando tesoros enterrados!", " ",
           Language.L.emoji.treasure],
    "ja": [Language.L.emoji.dig, " ",
           "埋蔵金を探す", " ",
           Language.L.emoji.treasure],
    "ko": [Language.L.emoji.dig, " ",
           "숨겨진 보물을 찾고 있어요!", " ",
           Language.L.emoji.treasure],
    "ne": [Language.L.emoji.dig, " ",
           "गाडिएको खजाना खोजी गर्दै", " ",
           Language.L.emoji.treasure],
    "pt": [Language.L.emoji.dig, " ",
           "Procurando o tesouro enterrado!", " ",
           Language.L.emoji.treasure],
    "zh": [Language.L.emoji.dig, " ",
           "寻找埋藏的宝藏", " ",
           Language.L.emoji.treasure]
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
    "en": [Language.L.emoji.pumpkin, " ",
           "Trick or Treat", " ",
           Language.L.emoji.pumpkin],
    "es": [Language.L.emoji.pumpkin, " ",
           "¡Truco o trato!", " ",
           Language.L.emoji.pumpkin],
    "ja": [Language.L.emoji.pumpkin, " ",
           "不気味なカボチャ", " ",
           Language.L.emoji.pumpkin],
    "ko": [Language.L.emoji.pumpkin, " ",
           "사탕 안 주면 장난칠 거야!", " ",
           Language.L.emoji.pumpkin],
    "ne": [Language.L.emoji.pumpkin, " ",
           "डरलाग्दो कद्दु", " ",
           Language.L.emoji.pumpkin],
    "pt": [Language.L.emoji.pumpkin, " ",
           "Gostosuras ou travessuras", " ",
           Language.L.emoji.pumpkin],
    "zh": [Language.L.emoji.pumpkin, " ",
           "怪异的南瓜", " ",
           Language.L.emoji.pumpkin]
  },
  "zoo_details_babies": {
    "en": [Language.L.emoji.baby,
           " ",
           "<INSERTBABIES>",
           " cubs born since ",
           "<INSERTYEAR>"],
    "es": [Language.L.emoji.baby,
           " ",
           "<INSERTBABIES>",
           " cachorros nacidos desde ",
           "<INSERTYEAR>"],
    "ja": [Language.L.emoji.baby,
           " ",
           "<INSERTYEAR>",
           "年から生まれた",
           "<INSERTBABIES>",
           "人の赤ちゃん"],
    "ko": [Language.L.emoji.baby,
           " ",
           "<INSERTYEAR>",
           "년에 태어난 아기는 ",
           "<INSERTBABIES>",
           "마리예요."],
    "ne": [Language.L.emoji.baby,
           " ",
           "<INSERTBABIES>",
           " पछि बच्चा जन्मे ",
           "<INSERTYEAR>"],
    "pt": [Language.L.emoji.baby,
           " ",
           "<INSERTBABIES>",
           " filhotes nascidos desde ",
           "<INSERTYEAR>"],
    "zh": [Language.L.emoji.baby,
           " ",
           "自",
           "<INSERTYEAR>",
           "年以来出生的",
           "<INSERTBABIES>",
           "名婴儿"]
  },
  "zoo_details_departures": {
    "en": [Language.L.emoji.truck,
           " ",
           "<INSERTNUM>", 
           " recent departures"],
    "es": [Language.L.emoji.truck,
           " ",
           "<INSERTNUM>",
           " partidas recientes."],
    "ja": [Language.L.emoji.truck,
           " ",
           "最近の",
           "<INSERTNUM>",
           "回の出発"],
    "ko": [Language.L.emoji.truck,
           " ",
           "최근에 이동한 ",
           "<INSERTNUM>",
           "마리의 레서판다"],
    "ne": [Language.L.emoji.truck,
           " ",
           "<INSERTNUM>",
           " भर्खरको प्रस्थान"],
    "pt": [Language.L.emoji.truck,
           " ",
           "<INSERTNUM>", 
           " partidas recentes"],
    "zh": [Language.L.emoji.truck,
           " ",
           "<INSERTNUM>",
           "最近出发"]
  },
  "zoo_details_pandas_live_here": {
    "en": [Language.L.emoji.panda,
           " ",
           "<INSERTNUM>",
           " red pandas live here"],
    "es": [Language.L.emoji.panda,
           " Hay ",
           "<INSERTNUM>",
           " panda rojos en este zoológico"],
    "ja": [Language.L.emoji.panda,
           " ",
           "ここに",
           "<INSERTNUM>",
           "匹のレッサーパンダが住んでいます"],
    "ko": [Language.L.emoji.panda,
           " ",
           "이곳에는 ",
           "<INSERTNUM>",
           "마리의 레서판다가 살고 있어요."],
    "ne": [Language.L.emoji.panda,
           " ",
           "<INSERTNUM>",
           " पांडा यहाँ बस्छन्"],
    "pt": [Language.L.emoji.panda,
           " ",
           "<INSERTNUM>",
           " pandas-vermelhos moram aqui"],
    "zh": [Language.L.emoji.panda,
           " ",
           "<INSERTNUM>",
           "只大熊猫住在这里"]
  },
  "zoo_details_no_pandas_live_here": {
    "en": [Language.L.emoji.panda,
           " ",
           "No red pandas currently here"],
    "es": [Language.L.emoji.panda,
           " ",
           "Por ahora aquí no hay pandas rojos."],
    "ja": [Language.L.emoji.panda,
           " ",
           "パンダが見つかりません"],
    "ko": [Language.L.emoji.panda,
           " ",
           "이곳에는 레서판다가 없어요."],
    "ne": [Language.L.emoji.panda,
           " ",
           "कुनै निगल्य पोन्या फेला परेन"],
    "pt": [Language.L.emoji.panda,
           " ",
           "Nenhum panda-vermelho atualmente aqui"],
    "zh": [Language.L.emoji.panda,
           " ",
           "没有找到这只小熊猫"]
  },
  "zoo_details_records": {
    "en": [Language.L.emoji.recordbook,
           " ",
           "<INSERTNUM>",
           " recorded in the database since ",
           "<INSERTYEAR>"],
    "es": [Language.L.emoji.recordbook,
           " ",
           "<INSERTNUM>",
           " registrados aquí desde ",
           "<INSERTYEAR>"],
    "ja": [Language.L.emoji.recordbook,
           " ",
           "<INSERTYEAR>",
           "年からデータベースに記録された",
           "<INSERTNUM>"],
    "ko": [Language.L.emoji.recordbook,
           " ",
           "<INSERTYEAR>",
           "년부터 데이터베이스에 저장된 ",
           "<INSERTNUM>",
           "개의 기록이 있어요."],      
    "ne": [Language.L.emoji.recordbook,
           " ",
           "<INSERTNUM>",
           " रेचोर्ड्स इन द दताबसे सिन्के ",
           "<INSERTYEAR>"],
    "pt": [Language.L.emoji.recordbook,
           " ",
           "<INSERTNUM>",
           " registrados na base de dados desde ",
           "<INSERTYEAR>"],
    "zh": [Language.L.emoji.recordbook,
           " ",
           "自",
           "<INSERTYEAR>",
           "年以来",
           "<INSERTNUM>",
           "个记录在数据库中"]
  },
  "zoo_header_new_arrivals": {
    "en": [Language.L.emoji.fireworks,
           " ",
           "New Arrivals"],
    "es": [Language.L.emoji.fireworks,
           " ",
           "Los recién llegados"],
    "ja": [Language.L.emoji.fireworks,
           " ",
           "新着"],
    "ko": [Language.L.emoji.fireworks,
           " ",
           "새로운 친구들"],
    "ne": [Language.L.emoji.fireworks,
           " ",
           "नयाँ आगमन"],
    "pt": [Language.L.emoji.fireworks,
           " ",
           "Novas chegadas"],
    "zh": [Language.L.emoji.fireworks,
           " ",
           "新来的"]
  },
  "zoo_header_other_pandas": {
    "en": [Language.L.emoji.panda,
           " ",
           "Other Pandas at ",
           "<INSERTZOO>"],
    "es": [Language.L.emoji.panda,
           " ",
           "Otros pandas en ",
           "<INSERTZOO>"],
    "ja": [Language.L.emoji.panda,
           " ",
           "<INSERTZOO>",
           "の他のパンダ"],
    "ko": [Language.L.emoji.panda,
           " ",
           "<INSERTZOO>",
           "의 다른 레서판다들"],   
    "ne": [Language.L.emoji.panda,
           " ",
           "<INSERTZOO>",
           " अन्य पोन्या"],
    "pt": [Language.L.emoji.panda,
           " ",
           "Outros pandas em ",
           "<INSERTZOO>"],
    "zh": [Language.L.emoji.panda,
           " ",
           "<INSERTZOO>",
           "里的其他小熊猫"]
  },
  "zoo_header_recently_departed": {
    "en": [Language.L.emoji.truck,
           " ",
           "Recently Departed"],
    "es": [Language.L.emoji.truck,
           " ",
           "Hace poco se fueron"],
    "ja": [Language.L.emoji.truck,
           " ",
           "最近出発しました"],
    "ko": [Language.L.emoji.truck,
           " ",
           "최근에 떠난 친구들"],
    "ne": [Language.L.emoji.truck,
           " ",
           "भर्खर प्रस्थान"],
    "pt": [Language.L.emoji.truck,
           " ",
           "Partiram recentemente"],
    "zh": [Language.L.emoji.truck,
           " ",
           "最近离开"]
  }
}

// These are tags in some contexts, and keywords in others
Language.L.polyglots = {
  "baby": {
 "emoji": [Language.L.emoji.baby],
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
Language.L.tags = {
  "air tasting": {
    "emoji": [Language.L.emoji.tongue + 
              Language.L.emoji.butterfly],
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
    "emoji": [Language.L.emoji.apple],
       "en": ["apple time", "apple"],
       "es": ["hora de la manazana", "manzana"],
       "ja": ["りんごタイム", "りんご"],
       "ko": ["사과 냠냠", "사과"],
       "ne": ["स्याउ समय", "स्याउ"],
       "pt": ["maçã", "hora da maçã"],
       "zh": ["苹果时间", "苹果"]
  },
  "autumn": {
    "emoji": [Language.L.emoji.autumn],
       "en": ["autumn", "fall"],
       "es": ["otoño"],
       "ja": ["秋"],
       "ko": ["가을"],
       "ne": ["शरद तु"],
       "pt": ["outono"],
       "zh": ["秋天"]
  },
  "bamboo": {
    "emoji": [Language.L.emoji.bamboo],
       "en": ["bamboo"],
       "es": ["bambú", "bambu"],
       "ja": ["笹", "竹"],
       "ko": ["대나무", "대나무"],
       "ne": ["बाँस"],
       "pt": ["bambu"],
       "zh": ["竹子", "竹"]
  },
  "bear worm": {
    "emoji": [Language.L.emoji.caterpillar],
       "en": ["bear worm", "bear-worm"],
       "es": ["gusan-oso", "gusanoso"],
       "ja": ["のびのび"],
       "ko": ["철푸덕"],
       "ne": ["कीरा भालु"],
       "pt": ["relaxado"],
       "zh": ["蠕动"]
  },
  "bite": {
    "emoji": [Language.L.emoji.tooth],
       "en": ["bite"],
       "es": ["morder"],
       "ja": ["一口"],
       "ko": ["깨물기"],
       "ne": ["काट्नु"],
       "pt": ["mordida"],
       "zh": ["咬", "吃"]
  },
  "blink": {
    "emoji": [Language.L.emoji.blink],
       "en": ["blink", "blinking"],
       "es": ["parpadear", "parpadeo"],
       "ja": ["まばたき"],
       "ko": ["눈 깜빡임"],
       "ne": ["झिम्काइ"],
       "pt": ["pestanejando", "pestanejo"],
       "zh": ["眨眼"]
  },
  "bridge": {
    "emoji": [Language.L.emoji.bridge],
       "en": ["bridge"],
       "es": ["puente"],
       "ja": ["吊り橋・渡し木", "架け橋"],
       "ko": ["다리"],
       "ne": ["पुल"],
       "pt": ["ponte"],
       "zh": ["吊桥", "桥"]
  },
  "brothers": {
    "emoji": [Language.L.emoji.brothers],
       "en": ["brothers", "bros"],
       "es": ["hermanos"],
       "ja": ["男兄弟"],
       "ko": ["형제"],
       "ne": ["भाइहरु"],
       "pt": ["irmãos"],
       "zh": ["兄弟"]
  },
  "carry": {
    "emoji": [Language.L.emoji.carry],
       "en": ["carry", "holding"],
       "es": ["llevando", "sosteniendo"],
       "ja": ["笹運び", "枝運び", "運ぶ"],
       "ko": ["배송"],
       "ne": ["बोक्नु", "समात्नु"],
       "pt": ["levando", "carregando", "segurando"],
       "zh": ["运", "拿"]
  },
  "cherry blossoms": {
    "emoji": [Language.L.emoji.cherry_blossom],
       "en": ["cherry blossoms", "cherry blossom"],
       "es": ["flor de cerezo", "flores de cerezo"],
       "ja": ["桜"],
       "ko": ["벚꽃"],
       "ne": ["चेरी खिल"],
       "pt": ["flor de cerejeira", "flores de cerejeira", "flor de cereja", "flores de cereja"],
       "zh": ["樱花"]
  },
  "climb": {
    "emoji": [Language.L.emoji.climb],
       "en": ["climb", "climbing"],
       "es": ["trepando", "escalando"],
       "ja": ["木登り", "登る"],
       "ko": ["등산"],
       "ne": ["चढाई"],
       "pt": ["escalando", "subindo"],
       "zh": ["爬"]
  },
  "close-up": {
    "emoji": [Language.L.emoji.close_up],
       "en": ["close-up", "closeup", "close"],
       "es": ["de cerca", "cerca"],
       "ja": ["閉じる"],
       "ko": ["가까이 보기"],
       "ne": ["क्लोज-अप", "नजिक"],
       "pt": ["fechar-se", "perto"],
       "zh": ["特写"]
  },
  "couple": {
    "emoji": [Language.L.emoji.couple],
       "en": ["couple", "partners"],
       "es": ["pareja"],
       "ja": ["カップル", "夫婦", "ふうふ"],
       "ko": ["커플", "부부"],
       "ne": ["जोडी"],
       "pt": ["casal", "par"],
       "zh": ["夫妇", "情侣"]
  },
  "destruction": {
    "emoji": [Language.L.emoji.tornado],
       "en": ["chaos", "destruction", "mess"],
       "es": ["caos", "destrucción", "destruccion", "desorden"],
       "ja": ["破壊"],
       "ko": ["난장판", "엉망진창"],
       "ne": ["विनाश"],
       "pt": ["caos", "destruição", "bagunça"],
       "zh": ["破坏"]
  },
  "dig": {
    "emoji": [Language.L.emoji.dig],
       "en": ["dig", "digging", "digs"],
       "es": ["cavando", "excavando"],
       "ja": ["穴掘り"],
       "ko": [ "구멍 파기", "땅을 파다"],
       "ne": ["खन्नुहोस्"],
       "pt": ["cavando", "escavando"],
       "zh": ["挖"]
  },
  "dish": {
    "emoji": [Language.L.emoji.dish],
       "en": ["dish", "plate"],
       "es": ["plato"],
       "ja": ["ごはん"],
       "ko": ["접시"],
       "ne": ["थाल"],
       "pt": ["prato"],
       "zh": ["盘子"]
  },
  "door": {
    "emoji": [Language.L.emoji.door],
       "en": ["door"],
       "es": ["puerta"],
       "ja": ["扉", "戸"],
       "ko": ["문"],
       "ne": ["ढोका"],
       "pt": ["porta"],
       "zh": ["门"]
  },
  "ear": {
    "emoji": [Language.L.emoji.ear],
       "en": ["ear", "ears"],
       "es": ["oreja", "orejas"],
       "ja": ["耳"],
       "ko": ["귀"],
       "ne": ["कान"],
       "pt": ["orelha", "orelhas"],
       "zh": ["耳"]
  },
  "eye": {
    "emoji": [Language.L.emoji.eye],
       "en": ["eye", "eyes"],
       "es": ["ojo", "ojos"],
       "ja": ["目"],
       "ko": ["눈"],
       "ne": ["कान"],
       "pt": ["olho", "olhos"],
       "zh": ["眼睛", "眼"]
  },
  "flowers": {
    "emoji": [Language.L.emoji.flower],
       "en": ["flower", "flowers"],
       "es": ["flor", "flores"],
       "ja": ["花"],
       "ko": ["꽃"],
       "ne": ["फूल", "फूलहरू"],
       "pt": ["flor", "flores"],
       "zh": ["花"]
  },
  "grooming": {
    "emoji": [Language.L.emoji.shower],
       "en": ["groom", "grooming", "cleaning"],
       "es": ["limpiándose", "limpiandose", "lamiéndose", "lamiendose", "lavándose", "lavandose"],
       "ja": ["毛づくろい"],
       "ko": ["몸 단장"],
       "ne": ["फूलहरू"],
       "pt": ["limpando-se"],
       "zh": ["梳毛"]
  },
  "grumpy": {
    "emoji": [Language.L.emoji.grumpy],
       "en": ["grumpy", "grouchy"],
       "es": ["gruñona", "gruñón", "grunona", "grunon"],
       "ja": ["ご機嫌ナナメ"],
       "ko": ["심술궂은", "투덜거리는", "기분이 나쁜"],
       "ne": ["नराम्रो"],
       "pt": ["rabugento", "mal-humorado"],
       "zh": ["牢骚满腹"]
  },
  "hammock": {
    "emoji": [Language.L.emoji.camping],
       "en": ["hammock"],
       "es": ["hamaca"],
       "ja": ["ハンモック"],
       "ko": ["해먹", "그물 침대"],
       "ne": ["ह्यामॉक"],
       "pt": ["rede de dormir"],
       "zh": ["吊床"]
  },
  "home": {
    "emoji": [Language.L.emoji.home],
       "en": ["home"],
       "es": ["casa", "en casa"],
       "ja": ["お家"],
       "ko": ["집"],
       "ne": ["घर"],
       "pt": ["casa", "lar"],
       "zh": ["家"]
  },
  "in love": {
    "emoji": [Language.L.emoji.hearts],
       "en": ["in love", "love"],
       "es": ["enamorado"],
       "ja": ["恋"],
       "ko": ["사랑"],
       "ne": ["मायामा"],
       "pt": ["amor", "apaixonado"],
       "zh": ["热恋", "恋爱"]
  },
  "itchy": {
    "emoji": [Language.L.emoji.itch],
       "en": ["itchy", "scratchy"],
       "es": ["rascándose", "rascandose"],
       "ja": ["カイカイ", "かゆい"],
       "ko": ["가려운", "긁기", "간지러운"],
       "ne": ["खुजली"],
       "pt": ["coceira", "coçando"],
       "zh": ["挠痒", "抓痒"]
  },
  "jizo": {
    "emoji": [Language.L.emoji.jizo],
       "en": ["jizo", "jizo statue", "statue"],
       "es": ["estatua"],
       "ja": ["お地蔵さん"],
       "ko": ["불상"],
       "ne": ["मूर्ति"],
       "pt": ["posição de estátua"],
       "zh": ["地藏菩萨"]
  },
  "keeper": {
    "emoji": [Language.L.emoji.weary],
       "en": ["keeper", "zookeeper"],
       "es": ["cuidador", "cuidadora"],
       "ja": ["飼育員"],
       "ko": ["사육사", "동물원 사육사"],
       "ne": ["चिडियाखाना"],
       "pt": ["cuidador", "cuidadora"],
       "zh": ["饲养员"]
  },
  "kiss": {
    "emoji": [Language.L.emoji.kiss],
       "en": ["kissing", "kiss"],
       "es": ["beso", "besos"],
       "ja": ["接吻", "せっぷん", "キス"],
       "ko": ["뽀뽀", "키스", "입맞춤"],
       "ne": ["चुम्बन"],
       "pt": ["beijo", "beijos", "beijando"],
       "zh": ["接吻", "亲亲", "吻"]
  },
  "laying down": {
    "emoji": [Language.L.emoji.bed],
       "en": ["lay down", "laying down"],
       "es": ["acostado", "recostado"],
       "ja": ["寝そべっている"],
       "ko": ["누워 있기", "눕다", "쉬기"],
       "ne": ["तल राख्नु"],
       "pt": ["deitado", "deitando-se"],
       "zh": ["躺"]
  },
  "lips": {
    "emoji": [Language.L.emoji.lips],
       "en": ["lips"],
       "es": ["labios"],
       "ja": ["くちびる"],
       "ko": ["입술"],
       "ne": ["ओठ"],
       "pt": ["lábios"],
       "zh": ["唇"]
  },
  "long-tongue": {
    "emoji": [Language.L.emoji.tongue +
              Language.L.emoji.tongue],
       "en": ["long tongue", "long-tongue"],
       "es": ["sacando la lengua"],
       "ja": ["長い舌"],
       "ko": ["긴 혀"],
       "ne": ["लामो जीभ"],
       "pt": ["mostrando a língua"],
       "zh": ["伸长舌头"]
  },
  "lunch time": {
    "emoji": [Language.L.emoji.bento],
       "en": ["lunch time", "lunch"],
       "es": ["hora de comer", "almuerzo"],
       "ja": ["ランチの時間"],
       "ko": ["점심 시간"],
       "ne": ["खाजा समय", "भोजन"],
       "pt": ["almoço", "hora do almoço"],
       "zh": ["午餐时间"]
  },
  "mofumofu": {
     "emoji": [Language.L.emoji.teddybear],
        "en": ["mofumofu", "fluffy", "punchy"],
        "es": ["rechoncho", "rechoncha", "esponjoso", "esponjosa"],
        "ja": ["モフモフ"],
        "ko": ["포근포근", "복슬복슬", "부드러운"],
        "ne": ["रमाईलो"],
        "pt": ["felpudo", "fofo", "gorducho", "rechonchudo"],
        "zh": ["软软"]
  },
  "muzzle": {
     "emoji": [Language.L.emoji.muzzle],
        "en": ["muzzle", "snout"],
        "es": ["hocico", "trompa"],
        "ja": ["マズル"],
        "ko": ["주둥이"],
        "ne": ["थूली", "थोरै"],
        "pt": ["focinho"],
        "zh": ["口鼻套"]
  },
  "night": {
     "emoji": [Language.L.emoji.moon],
        "en": ["night"],
        "es": ["noche"],
        "ja": ["夜"],
        "ko": ["밤"],
        "ne": ["रात"],
        "pt": ["noite"],
        "zh": ["夜", "晚上"]
  },
  "nose": {
     "emoji": [Language.L.emoji.nose],
        "en": ["nose", "snout"],
        "es": ["nariz", "hocico"],
        "ja": ["鼻"],
        "ko": ["코"],
        "ne": ["नाक"],
        "pt": ["nariz"],
        "zh": ["鼻子"]
  },
  "old": {
     "emoji": [Language.L.emoji.grandpa],
        "en": ["old"],
        "es": ["viejo", "vieja"],
        "ja": ["シニアパンダさん", "年老いた"],
        "ko": ["늙은", "나이 든", "연로한"],
        "ne": ["पुरानो"],
        "pt": ["idoso", "idosa"],
        "zh": ["老人"]
  },
  "panda bowl": {
     "emoji": [Language.L.emoji.panda + 
               Language.L.emoji.bowl],
        "en": ["panda bowl", "bowl"],
        "es": ["bola de panda", "bola"],
        "ja": ["エサ鉢"],
        "ko": ["밥그릇"],
        "ne": ["पोनिया कटोरा"],
        "pt": ["tigela de panda", "tigela"],
        "zh": ["碗"]
  },
  "paws": {
     "emoji": [Language.L.emoji.paws],
        "en": ["paws", "feet"],
        "es": ["patas", "pies"],
        "ja": ["足"],
        "ko": ["발", "발바닥"],
        "ne": ["पन्जा"],
        "pt": ["patas", "pés"],
        "zh": ["爪"]
  },
  "peek": {
     "emoji": [Language.L.emoji.monocle],
        "en": ["peek", "peeking"],
        "es": ["ojeando", "mirando", "curioseando"],
        "ja": ["チラ見"],
        "ko": ["엿보기", "살짝 보기", "훔쳐보기"],
        "ne": ["झिक्नु"],
        "pt": ["espiando"],
        "zh": ["偷窥"]
  },
  "playing": {
     "emoji": [Language.L.emoji.playing],
        "en": ["playing", "play"],
        "es": ["jugando", "jugar"],
        "ja": ["拝み食い", "両手食い"],
        "ko": ["놀기", "놀이 중", "장난치기"],
        "ne": ["खेलिरहेको", "खेल्नु"],
        "pt": ["brincando"],
        "zh": ["玩耍"]
  },
  "poop": {
     "emoji": [Language.L.emoji.poop],
        "en": ["poop"],
        "es": ["heces", "caca", "mierda"],
        "ja": [Language.L.emoji.poop],
        "ko": ["응가"],
        "ne": [Language.L.emoji.poop],
        "pt": ["cocô", "cocó", "caca"],
        "zh": ["便便"]
  },
  "pooping": {
     "emoji": [Language.L.emoji.panda +
               Language.L.emoji.poop],
        "en": ["pooping"],
        "es": ["defecando", "haciendo caca", "cagando"],
        "ja": ["💩している"],
        "ko": ["응가 중"],
        "ne": [Language.L.emoji.panda +
               Language.L.emoji.poop],
        "pt": ["fazendo cocô", "fazendo caca"],
        "zh": ["便便"]
  },
  "portrait": {
     "emoji": [Language.L.emoji.portrait],
        "en": ["portrait", "square"],
        "es": ["retrato", "cuadrada"],
        "ja": ["顔写真"],
        "ko": ["초상화"],
        "ne": ["चित्र"],
        "pt": ["retrato"],
        "zh": ["肖像"]
  },
  "praying": {
     "emoji": [Language.L.emoji.pray],
        "en": ["praying", "pray"],
        "es": ["rezando", "orando"],
        "ja": ["お祈りしている"],
        "ko": ["기도하기", "기도 중"],
        "ne": ["प्रार्थना गर्दै", "प्रार्थना"],
        "pt": ["rezando", "orando", "mãos postas"],
        "zh": ["祈祷"]
  },
  "profile": {
     "emoji": [Language.L.emoji.profile],
        "en": ["profile"],
        "es": ["perfil"],
        "ja": ["プロフィール画像"],
        "ko": ["프로필"],
        "ne": ["प्रोफाइल"],
        "pt": ["perfil"],
        "zh": ["资料"]
  },
  "pull-up": {
     "emoji": [Language.L.emoji.weight],
        "en": ["pull-up", "pull-ups", "pullup"],
        "es": ["flexiones", "dominadas"],
        "ja": ["鉄棒", "懸垂"],
        "ko": ["턱걸이"],
        "ne": ["तान्नु"],
        "pt": ["flexões"],
        "zh": ["引体向上"]
  },
  "pumpkin": {
     "emoji": [Language.L.emoji.pumpkin],
        "en": ["pumpkin", "halloween"],
        "es": ["calabaza"],
        "ja": ["かぼちゃ", "南瓜"],
        "ko": ["호박", "할로윈"],
        "ne": ["कद्दू", "हेलोवीन"],
        "pt": ["abóbora"],
        "zh": ["南瓜"]
  },
  "reiwa": {
     "emoji": [Language.L.emoji.reiwa],
        "en": ["reiwa"],
        "es": ["reiwa"],
        "ja": ["令和"],
        "ko": ["레이와"],
        "ne": [Language.L.emoji.reiwa],
        "pt": ["reiwa"],
        "zh": ["令和"]
  },
  "sample": {
     "emoji": [Language.L.emoji.panda],
        "en": ["sample"],
        "es": ["muestra"],
        "ja": ["見本", "試料", "試供品"],
        "ko": ["샘플"],
        "ne": ["नमूना"],
        "pt": ["amostra"],
        "zh": ["样本", "样品", "样"]
  },
  "scale": {
     "emoji": [Language.L.emoji.scale],
        "en": ["scale", "weigh-in", "weight"],
        "es": ["balanza", "pesa"],
        "ja": ["体重計", "たいじゅうけい"],
        "ko": ["체중계", "저울"],
        "ne": ["स्केल", "तौल"],
        "pt": ["balança", "peso"],
        "zh": ["测体重"]
  },
  "shake": {
     "emoji": [Language.L.emoji.cyclone],
        "en": ["shake", "shaking"],
        "es": ["sacudiéndose", "sacudiendose"],
        "ja": ["ドリパン", "ブルブル", "ゆらゆら"],
        "ko": ["흔들기", "흔들림", "떨림"],
        "ne": ["हल्लाउनु"],
        "pt": ["sacudindo-se"],
        "zh": ["摇晃"]
  },
  "shedding": {
     "emoji": [Language.L.emoji.worry],
        "en": ["shedding", "changing fur", "losing fur", "losing hair"],
        "es": ["mudando", "mudando el pelo", "cambiando el pelo"],
        "ja": ["換毛", "泣いている"],
        "ko": ["털갈이"],
        "ne": ["सुस्त"],
        "pt": ["mudando o pelo", "perdendo pelo"],
        "zh": ["换毛"]
  },
  "shoots": {
     "emoji": [Language.L.emoji.bamboo],
        "en": ["shoots", "shoot"],
        "es": ["brotes"],
        "ja": ["竹の子", "たけのこ"],
        "ko": ["죽순"],
        "ne": ["बाँस को टुप्पो"],
        "pt": ["brotos", "broto"],
        "zh": ["竹笋"]
  },
  "siblings": {
     "emoji": [Language.L.emoji.siblings],
        "en": ["siblings"],
        "es": ["hermanos"],
        "ja": ["兄弟", "きょうだい"],
        "ko": ["형제·자매"],
        "ne": ["भाइबहिनीहरू"],
        "pt": ["irmãos(ãs)"],
        "zh": ["同胞"]
  },
  "sisters": {
     "emoji": [Language.L.emoji.sisters],
        "en": ["sisters"],
        "es": ["hermanas"],
        "ja": ["姉妹"],
        "ko": ["자매"],
        "ne": ["बहिनीहरू"],
        "pt": ["irmãs"],
        "zh": ["姐妹"]
  },
  "sleeping": {
     "emoji": [Language.L.emoji.sleeping],
        "en": ["sleeping", "sleep", "asleep"],
        "es": ["durmiendo", "dormido", "dormida", "durmiéndose", "durmiendose", "dormir"],
        "ja": ["寝ている"],
        "ko": ["잠", "잠자는 중", "수면"],
        "ne": ["सुत्नु", "निद्रा"],
        "pt": ["dormindo"],
        "zh": ["睡觉"]
  },
  "slobber": {
     "emoji": [Language.L.emoji.slobber],
        "en": ["slobber", "slobbering"],
        "es": ["babeándo", "babeando", "baba"],
        "ja": ["よだれをたらしている"],
        "ko": ["침 흘리기", "침"],
        "ne": ["स्लोबर"],
        "pt": ["babando", "baba"],
        "zh": ["口水", "流口水"]
  },
  "smile": {
     "emoji": [Language.L.emoji.smile],
        "en": ["smile", "smiling"],
        "es": ["sonriéndo", "sonriendo", "sonreír", "sonreir", "sonriente", "sonrisa"],
        "ja": ["スマイル"],
        "ko": ["웃음", "웃는 중"],
        "ne": ["हाँसो"],
        "pt": ["sorrindo", "sorriso", "sorridente"],
        "zh": ["笑", "微笑"]
  },
  "snow": {
     "emoji": [Language.L.emoji.snow],
        "en": ["snow"],
        "es": ["nieve"],
        "ja": ["雪"],
        "ko": ["눈"],
        "ne": ["हिउँ"],
        "pt": ["neve"],
        "zh": ["雪"]
  },
  "spider": {
     "emoji": [Language.L.emoji.spider],
        "en": ["spider", "spider-bear", "spider bear"],
        "es": ["araña", "arana"],
        "ja": ["スパイダー"],
        "ko": ["거미"],
        "ne": ["माकुरो", "माकुरो भालु"],
        "pt": ["panda-aranha", "aranha"],
        "zh": ["蜘蛛"]
  },
  "standing": {
     "emoji": [Language.L.emoji.no_emoji],
        "en": ["standing", "stand"],
        "es": ["de pie", "parado"],
        "ja": ["立っている"],
        "ko": ["서다"],
        "ne": ["खडा"],
        "pt": ["de pé", "em pé"],
        "zh": ["站立"]
  },
  "stretching": {
     "emoji": [Language.L.emoji.no_emoji],
        "en": ["stretching", "stretch"],
        "es": ["estirándose", "estirandose"],
        "ja": ["ストレッチしている"],
        "ko": ["스트레칭"],
        "ne": ["तन्नु", "तान्न"],
        "pt": ["espreguiçando-se"],
        "zh": ["拉伸"]
  },
  "surprise": {
     "emoji": [Language.L.emoji.fireworks],
        "en": ["surprise", "surprised"],
        "es": ["sorpresa", "sorprendido", "sorprendida"],
        "ja": ["びっくり"],
        "ko": ["놀라움"],
        "ne": ["अचम्म"],
        "pt": ["surpreso", "surpresa", "surpreendido"],
        "zh": ["惊喜"]
  },
  "tail": {
     "emoji": [Language.L.emoji.snake],
        "en": ["tail"],
        "es": ["cola"],
        "ja": ["しっぽ"],
        "ko": ["꼬리"],
        "ne": ["पुच्छर"],
        "pt": ["cauda", "rabo"],
        "zh": ["尾巴"]
  },
  "techitechi": {
     "emoji": [Language.L.emoji.target],
        "en": ["techitechi", "spot", "cute spot"],
        "es": ["lunares", "lunar"],
        "ja": ["テチテチ"],
        "ko": ["목표"],
        "ne": ["राम्रो स्थान"],
        "pt": ["pinta", "pintinha"],
        "zh": ["目标"]
  },
  "tongue": {
     "emoji": [Language.L.emoji.tongue],
        "en": ["tongue"],
        "es": ["lengua"],
        "ja": ["べろ"],
        "ko": ["혀"],
        "ne": ["जिब्रो"],
        "pt": ["língua"],
        "zh": ["舌"]
  },
  "toys": {
     "emoji": [Language.L.emoji.football],
        "en": ["toy", "toys"],
        "es": ["juguete", "juguetes"],
        "ja": ["遊具", "おもちゃ", "おもちゃ"],
        "ko": ["장난감"],
        "ne": ["खेलौना"],
        "pt": ["brinquedo", "brinquedos"],
        "zh": ["玩具"]
  },
  "tree": {
     "emoji": [Language.L.emoji.tree],
        "en": ["tree", "trees"],
        "es": ["árbol", "arbol", "árboles", "arboles"],
        "ja": ["木"],
        "ko": ["나무"],
        "ne": ["रूख"],
        "pt": ["árvore", "árvores"],
        "zh": ["树"]
  },
  "upside-down": {
     "emoji": [Language.L.emoji.upside_down],
        "en": ["upside-down", "upside down"],
        "es": ["al revés", "al reves", "cabeza abajo"],
        "ja": ["逆さま"],
        "ko": ["거꾸로", "뒤집힌"],
        "ne": ["तलको माथि"],
        "pt": ["cabeça para baixo", "ponta-cabeça"],
        "zh": ["翻转"]
  },
  "wink": {
     "emoji": [Language.L.emoji.wink],
        "en": ["wink", "winking"],
        "es": ["guiño", "guino"],
        "ja": ["ウィンク"],
        "ko": ["윙크"],
        "ne": ["आखा भ्किम्काउनु"],
        "pt": ["piscando", "piscada", "piscadela", "piscar de olhos"],
        "zh": ["眨眼"]
  },
  "wet": {
     "emoji": [Language.L.emoji.raincloud],
        "en": ["wet"],
        "es": ["mojado", "mojada"],
        "ja": ["濡れた"],
        "ko": ["젖은", "축축한"],
        "ne": ["भिजेको"],
        "pt": ["molhado", "molhada"],
        "zh": ["湿"]
  },
  "white face": {
     "emoji": [Language.L.emoji.no_emoji],
        "en": ["white face", "light face"],
        "es": ["cara blanca"],
        "ja": ["色白さん", "しろめん", "白面", "白めん"],
        "ko": ["하얀 얼굴", "밝은 얼굴"],
        "ne": ["सेतो अनुहार"],
        "pt": ["face branca"],
        "zh": ["浅色的脸"]
  },
  "window": {
     "emoji": [Language.L.emoji.window],
        "en": ["window"],
        "es": ["ventana"],
        "ja": ["窓", "まど"],
        "ko": ["창문"],
        "ne": ["विन्डो"],
        "pt": ["janela"],
        "zh": ["窗"]
  },
  "whiskers": {
     "emoji": [Language.L.emoji.whiskers],
        "en": ["whiskers", "whisker"],
        "es": ["bigotes", "bigote"],
        "ja": ["ひげ"],
        "ko": ["수염"],
        "ne": ["फुसफुस"],
        "pt": ["bigode", "bigodes"],
        "zh": ["晶須"]
  },
  "yawn": {
     "emoji": [Language.L.emoji.yawn],
        "en": ["yawn", "yawning"],
        "es": ["bostezo", "bostezando"],
        "ja": ["あくび"],
        "ko": ["하품", "하품하기"],
        "ne": ["जांभई"],
        "pt": ["bocejo", "bocejando"],
        "zh": ["哈欠", "呵欠"]
  }
}

/*
   Language selection functions
*/
// Map a browser specified language to one of our supported options.
Language.L.defaultDisplayLanguage = function() {
  // Read language settings from browser's Accept-Language header
  Pandas.def.languages.forEach(function(option) {
    if ((navigator.languages.indexOf(option) != -1) &&
        (this.display == undefined)) {
      this.display = option;
    }
  });
  // Read language cookie if it's there
  var test = this.storage.getItem("language");
  if (test != null) {
    if (Pandas.def.languages.indexOf(test) != -1) {
      this.display = test;
    }
  }  
  // Fallback to English
  if (this.display == undefined) {
    this.display = "en";
  }
  // Adjust flags. For UK locales, make the English language flag
  // a union-jack. For mainland China locales, make Taiwan flag
  // look like a Chinese flag.
  this.fallbackFlags();
}

// Do language fallback for anything reporting as "unknown" or "empty" in a zoo or animal object
Language.L.fallbackEntity = function(entity) {
  var output = entity;
  var order = Language.currentOrder(Pandas.language_order(entity), this.display);
  // Default values that we want to ignore if we can
  var default_animal = Language.saveEntityKeys(Pandas.def.animal, order);
  var default_zoo = Language.saveEntityKeys(Pandas.def.zoo, order);
  var empty_values = [undefined].concat(Object.values(Pandas.def.unknown))
                                .concat(Object.values(default_animal))
                                .concat(Object.values(default_zoo));
  // Derive the zoo/panda language-translatable keys by getting a list of
  // the separate language keys from the original object, and adding a
  // synthetic list of keys that would apply for the current display language
  var language_entity = Language.listDisplayKeys(entity, order, this.display);
  // Start replacing this language's value with an available value in the
  // language.order list. Just stuff it in the original entity's key.
  for (var key of language_entity) {
    var blacklist_key = key.split(".")[1];   // No language suffix
    if (Language.fallback_blacklist.indexOf(blacklist_key) != -1) {
      continue;  // Ignore blacklist fields
    }
    if (empty_values.indexOf(entity[key]) != -1) {
      for (language of order) {
        if (language == L.display) {
          continue;  // Don't take replacement values from current language
        }
        [ _, desired ] = key.split('.');
        var new_key = language + "." + desired;
        if (empty_values.indexOf(entity[new_key]) == -1) {
          // Put this language's value in the displayed output
          output[key] = entity[new_key];
          break;
        }
      } // If no available non-empty strings in other languages, do nothing
    }
  }
  return output;
}

// Do locale adjustments for which flags appear as language flags
Language.L.fallbackFlags = function() {
  // If an English locale other than USA, or if no English locale
  // defined at all, default the "english" language flag to UK flag.
  var us = navigator.languages.indexOf("en-US");
  if (us == -1) {
    Language.L.gui.flag["en"] = Language.L.flags["UK"];
  } else {
    for (let lang of navigator.languages) {
      if (lang.indexOf("en") == 0) {
        commonwealth = navigator.languages.indexOf(lang);
        if (commonwealth < us) {
          Language.L.gui.flag["en"] = Language.L.flags["UK"];
          break;
        }
      }
    }
  }
  // If a Chinese locale other than Taiwan, default the "chinese"
  // language flag to the China flag.
  var china = "zh-CN";
  var taiwan = "zh-TW";
  if ((navigator.languages.indexOf(taiwan) != -1) &&
      (navigator.languages.indexOf(china) != -1) &&
      (navigator.languages.indexOf(taiwan) < navigator.languages.indexOf(china))) {
    Language.L.gui.flag["zh"] = Language.L.flags["Taiwan"];        
  }
  // Korean locale flag
  var korean = "ko-KR";
  if (navigator.languages.indexOf(korean) != -1) {
    Language.L.gui.flag["ko"] = Language.L.flags["South Korea"];
  }

  // TODO: Portuguese vs. Brazil flags
  var brazil = "pt-BR";
  if (navigator.languages.indexOf(brazil) != -1) {
    Language.L.gui.flag["pt"] = Language.L.flags["Brazil"];
  }
}

// Do language fallback for anything reporting as "unknown" or "empty" in an info block
Language.L.fallbackInfo = function(info, original) {
  var bundle = info;
  var order = Language.currentOrder(info.language_order, this.display);
  // Default values that we want to ignore if we can
  var default_animal = Language.saveEntityKeys(Pandas.def.animal, order);
  var default_zoo = Language.saveEntityKeys(Pandas.def.zoo, order);
  var empty_values = [undefined].concat(Object.values(Pandas.def.unknown))
                                .concat(Object.values(default_animal))
                                .concat(Object.values(default_zoo));
  // Derive the info-block language-translatable keys by getting a list of
  // the separate language keys from the original object, slicing off
  // the lanugage prefix, and de-duplicating.
  var language_info = Language.listInfoKeys(original, order);
  // Start replacing this language's value with an available value in the
  // language.order list. Just stuff it in the original info blob's key.
  for (var key of language_info) {
    if (Language.fallback_blacklist.indexOf(key) != -1) {
      continue;  // Ignore blacklist fields
    }
    if (empty_values.indexOf(info[key]) != -1) {
      for (language of order) {
        if (language == this.display) {
          continue;  // Don't take replacement values from current language
        }
        var new_key = language + "." + key;
        if (empty_values.indexOf(original[new_key]) == -1) {
          // Put this language's value in the displayed output
          bundle[key] = original[new_key];
          break;
        }
      } // If no available non-empty strings in other languages, do nothing
    }
  }

  // Replace nested zoo or birthplace text for panda entities similarly
  if ((info.zoo != undefined) && (info.zoo != Pandas.def.zoo)) {
    bundle.zoo = this.fallbackEntity(info.zoo);
  }
  if ((info.birthplace != undefined) && (info.birthplace != Pandas.def.zoo)) {
    bundle.birthplace = this.fallbackEntity(info.birthplace);
  }
  for (let index in info.mom) {
    if ((info.mom[index] != undefined) && 
        (info.mom[index] != Pandas.def.animal)) {
      info.mom[index] = this.fallbackEntity(info.mom[index]);
    }
  }
  for (let index in info.dad) {
    if ((info.dad[index] != undefined) && 
        (info.dad[index] != Pandas.def.animal)) {
      info.dad[index] = this.fallbackEntity(info.dad[index]);
    }      
  }
  for (let index in info.litter) {
    if ((info.litter[index] != undefined) && 
        (info.litter[index] != Pandas.def.animal)) {
       info.litter[index] = this.fallbackEntity(info.litter[index]);
    }
  }
  for (let index in info.siblings) {
    if ((info.siblings[index] != undefined) && 
        (info.siblings[index] != Pandas.def.animal)) {
       info.siblings[index] = this.fallbackEntity(info.siblings[index]);
    }
  }
  for (let index in info.children) {
    if ((info.children[index] != undefined) && 
        (info.children[index] != Pandas.def.animal)) {
       info.children[index] = this.fallbackEntity(info.children[index]);
    }
  }
  return bundle;
}

// Update all GUI elements based on the currently chosen language
Language.L.update = function() {
  // Update menu buttons. TODO: grab these buttons by class
  var menu_button_ids = ['languageButton', 'aboutButton', 'randomButton',
                         'linksButton', 'profileButton', 'mediaButton', 
                         'timelineButton'];
  var menu_button_elements = menu_button_ids.map(x => 
    document.getElementById(x)).filter(x => x != undefined);
  // Any buttons in the page? Redraw with correct language settings
  for (let element of menu_button_elements) {
    var id = element.id;
    var lookup = id.replace("Button", "");
    [icon, text] = element.childNodes[0].childNodes;
    if (id == "languageButton") {
      icon.innerText = this.gui.flag[this.display];   // Replace flag icon
      text.innerText = this.gui[lookup][this.display][this.display]   // Replace language icon text
    } else {
      text.innerText = this.gui[lookup][this.display];   // Replace icon text
    }
  }
  // On the Links page? Redraw it
  if ((window.location.hash == "#links") && (P.db != undefined)) {
    Page.links.render();
  }
  // Update the placeholder text for a search bar
  if (document.forms['searchForm'] != undefined) {
    if (P.db == undefined) {
      document.forms['searchForm']['searchInput'].placeholder = this.gui.loading[this.display];
    } else {
      document.forms['searchForm']['searchInput'].placeholder = "➤ " + this.gui.search[this.display];
    }
  }
  // Change the page title
  document.title = this.gui.title[this.display];
  // Write localStorage for your chosen language. This is better than a cookie
  // since the server never has to see what language you're using in each request.
  this.storage.setItem('language', this.display);
}

/*
    Language helper and utility functions
*/
// For names stored in Roman characters, they often start with a capital letter.
// So input queries not capitalized need to be corrected for searching.
Language.capitalNames = function(input) {
  var words = [];
  var output = [];
  if (input.indexOf(' ') != -1) {
    words = input.split(' ');
  } else {
    words.push(input);
  }
  words.forEach(function(word) {
    latin = Language.testString(input, "Latin");
    if ((latin == true) && (Query.env.preserve_case == false)) {
      word = word.replace(/^\w/, function(chr) {
        return chr.toUpperCase();
      });
      word = word.replace(/-./, function(chr) {
        return chr.toUpperCase();
      });
      word = word.replace(/ ./, function(chr) {
        return chr.toUpperCase();
      });
    }
    // Return either the modified or unmodified word to the list
    output.push(word);
  });
  return output.join(' ');   // Recombine terms with spaces
}

// Capitalize words in a string
Language.capitalize = function(input, mode) {
  var output = "";
  var words = input.split(" ").length;
  if ((mode == "first") || (words == 1)) {
    output = input.charAt(0).toUpperCase() + input.slice(1);
  } else {
    output = input.replace(/(?:^|\s)\S/g, function(a) {
      return a.toUpperCase();
    });
  }
  return output;
}

// Make a phrase out of parts, with commas and terminal "and"
Language.commaPhrase = function(pieces) {
  var p = document.createElement('p');
  for (var i = 0; i < pieces.length; i++) {
    var m = document.createTextNode(pieces[i]);
    var c = document.createTextNode(Language.L.messages.comma[L.display]);
    var a = document.createTextNode(Language.L.messages.and_words[L.display]);
    p.appendChild(m);
    // Commas
    if ((i < pieces.length - 3) && (pieces.length > 3)) {
      p.appendChild(c);
    }
    // Comma and "and" for long phrases
    if ((i == pieces.length - 3) && (pieces.length > 3)) {
      p.appendChild(c);
      p.appendChild(a);
    }
    // No commas, but just the "and"
    if ((i == pieces.length - 3) && (pieces.length <= 3)) {
      p.appendChild(a);
    }
  }
  return p;
}

// Same as above but for just raw text
Language.commaPhraseBare = function(pieces) {
  var o = "";
  for (var i = 0; i < pieces.length; i++) {
    var m = pieces[i];
    var c = Language.L.messages.comma[L.display] + " ";
    var a = Language.L.messages.and_words[L.display];
    o = o.concat(m);
    // Commas
    if ((i < pieces.length - 2) && (pieces.length > 2)) {
      o = o.concat(c);
    }
    // Comma and "and" for long phrases
    if ((i == pieces.length - 2) && (pieces.length > 2)) {
      o = o.concat(c);
      o = o.concat(a);
    }
    // No commas, but just the "and"
    if ((i == pieces.length - 2) && (pieces.length <= 2)) {
      o = o.concat(a);
    }
  }
  // The fragments may concatenate spaces together, so kill these
  o = o.replace(/\s\s+/g, ' ');
  return o;
}

// Calculate the current fallback language order for a given info block or entity.
// Key here is adding the current display language to the list, so that if a dataset
// doesn't include info for a language, we can overwrite that info anyways!
Language.currentOrder = function(current_list, current_language) {
  var bias = L.bias[current_language];
  if (bias == "latin") {
    bias = [];
    // Iterate through the current list of languages. If one has a latin
    // writing system, use it as an option. This will usually fall back to
    // English, but not always.
    for (let lang of current_list) {
      if (Language.alphabets["latin"].indexOf(lang) != -1) {
        bias.push(lang);
      }
    }
  }
  return bias.concat(current_list)
             .concat(current_language)
             .filter(function(value, index, self) { 
    return self.indexOf(value) === index;  // Remove duplicates in the array
  });
}

// Determine if altname is not worth displaying for furigana by calculating
// its Levenshtein distance. Courtesy of https://gist.github.com/rd4k1
Language.editDistance = function(a, b){
  if(!a || !b) return (a || b).length;
  var m = [];
  for(var i = 0; i <= b.length; i++){
    m[i] = [i];
    if(i === 0) continue;
    for(var j = 0; j <= a.length; j++){
      m[0][j] = j;
      if(j === 0) continue;
      m[i][j] = b.charAt(i - 1) == a.charAt(j - 1) ? m[i - 1][j - 1] : Math.min(
        m[i-1][j-1] + 1,
        m[i][j-1] + 1,
        m[i-1][j] + 1
      );
    }
  }
  return m[b.length][a.length];
};

// For fallback functions, don't replace these fields
Language.fallback_blacklist = ["othernames", "nicknames"];

Language.fallback_name = function(entity) {
  var entity_order = entity["language.order"].split(", ");
  var order = Language.currentOrder(entity_order, L.display);
  order.unshift(L.display);   // Display language always comes first
  for (let language of order) {
    var name = entity[language + ".name"]
    if (name != undefined) {
      return name; 
    }
  }
  // Fallback default name
  return Pandas.def.animal[L.display + ".name"];
}

Language.hiraganaToKatakana = function(input) {
  var source_range = Pandas.def.ranges['ja'][1];   // Hiragana range regex
  var test = source_range.test(input);
  if (test == false) {
    return input;
  } else {
    var output = "";
    for (let char of input) {
      var index = Language.charset["ja"].hiragana.indexOf(char); 
      if (index > -1) { 
        var swap = Language.charset["ja"].katakana[index];
        output += swap;
      } else {
        output += char;
      }
    }
  }
  return output;
}

Language.katakanaToHiragana = function(input) {
  var source_range = Pandas.def.ranges['ja'][2];   // Katakana range regex
  var test = source_range.test(input);
  if (test == false) {
    return input;
  } else {
    var output = "";
    for (let char of input) {
      var index = Language.charset["ja"].katakana.indexOf(char); 
      if (index > -1) { 
        var swap = Language.charset["ja"].hiragana[index];
        output += swap;
      } else {
        output += char;
      }
    }
    return output;
  }
}

// Given a list of keys we're doing language translations for, add a set
// for the current displayed language
Language.listDisplayKeys = function(entity, order, current_language) {
  var entity_keys = Language.listEntityKeys(entity, order);
  var language_keys = entity_keys.map(function(key) {
    [_, primary] = key.split('.');
    return current_language + "." + primary;
  });
  return entity_keys.concat(language_keys).filter(function(value, index, self) {
    return self.indexOf(value) === index;  // De-duplicate language keys
  });
}

// Get the valid language-translatable keys in a zoo or animal object
// like the ones in the Pandas.* methods
Language.listEntityKeys = function(entity, order) {
  var obj_langs = order.concat(Pandas.def.languages);  // Dupes not important
  var filtered = Object.keys(entity).filter(function(key) {
    // List the language-specific keys in a zoo or animal
    [lang, primary] = key.split('.');
    return (obj_langs.indexOf(lang) != -1);
  });
  return filtered;
}

// Get the valid language-translatable keys in an info block from one of
// its panda/zoo entities, like you have in blocks created by Show.acquire*Info
Language.listInfoKeys = function(entity, order) {
  return Language.listEntityKeys(entity, order).map(function(key) {
    [language, desired] = key.split('.');
    return desired;
  }).filter(function(value, index, self) {
    return self.indexOf(value) === index;
  });
}

// Only keep the keys in a panda or zoo object that are meaningfully 
// translatable to different languages
Language.saveEntityKeys = function(entity, order) {
  var filtered = Language.listEntityKeys(entity, order).reduce(function(obj, key) {
    // Only keep JSON values with those matching keys
    obj[key] = entity[key];
    return obj;
  }, {});
  return filtered; 
}

// Only keep the keys in an info block that are meaningfully 
// translatable to different languages
Language.saveInfoKeys = function(info, order) {
  var filtered = Language.listInfoKeys(info, order).reduce(function(obj, key) {
    // Only keep JSON values with those matching keys
    obj[key] = info[key];
    return obj;
  }, {});
  return filtered;
}

// Find the canonical tag given something being parsed as a tag.
// i.e. for "climbing", return "climb".
Language.tagPrimary = function(input) {
  var lang_values = Pandas.def.languages.concat("emoji");
  for (let ctag in Language.L.tags) {
    for (let lang of lang_values) {
      if (Language.L.tags[ctag][lang].indexOf(input) != -1) {
        return ctag;
      }
    }
  }
  // Need to search polyglots too, for things like "baby"
  for (let ctag in Language.L.polyglots) {
    for (let lang of lang_values) {
      if (Language.L.polyglots[ctag][lang].indexOf(input) != -1) {
        return ctag;
      }
    }
  }
}

// Language test functions. If the string is in the given range,
// return true. Depending on the mode, this may be an "all" match
// or an "any" match.
Language.testString = function(input, test_name) {
  if (test_name == "Hiragana") {
    var range = Pandas.def.ranges['ja'][1];
    return range.test(input);   // True if any characters match the hiragana range
  }
  if (test_name == "Katakana") {
    var range = Pandas.def.ranges['ja'][2];
    return range.test(input);   // True if any characters match the katakana range
  }
  if ((test_name == "Latin") || (test_name == "English")) {
    var ranges = Pandas.def.ranges['en'];
    var latin = ranges.some(function(range) {
      return range.test(input);
    });
    return latin;   // True if any characters match the latin range
  }
  return false;   // The test doesn't exist
}

// Take specific english words and unpluralize them if necessary
Language.unpluralize = function(pieces) {
  var output = [];
  if (L.display == "en") {
    for (var input of pieces) {
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
                   .replace(/^one\s/, "One ");
      output.push(input);
    }
    return output;
  } else if (L.display == "es") {
    for (var input of pieces) {
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
                   .replace(/^una\s/, "Una ");
      output.push(input);
    }
    return output;
  } else if (L.display == "ko") {
    for (var input of pieces) {
      input = input.replace(/(\d+) 사진들/, "$1 사진")
                   .replace(/(\d+) 동물들/, "$1 동물")
                   .replace(/(\d+) 판다들/, "$1 판다")
                   .replace(/새로운 (\d+) 기여자들/, "새로운 $1 기여자")
                   .replace(/사진 태그들/, "사진 태그");      
      output.push(input);
    }
    return output;
  } else if (L.display == "pt") {
    for (var input of pieces) {
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
                   .replace(/^uma\s/, "Uma ");
      output.push(input);
    }
    return output;
  } else {
           return pieces;
  }
}
