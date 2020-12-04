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
  "cn": ["latin"],
  "en": [],
  "jp": ["latin"],
  "np": ["latin"]
}

// Types of alphabets, so we can fall back to an alphabet that someone
// is capable of reading based on their language skills. In practice,
// we opt to fall back to latin languages since that alphabet is more
// widely understood
Language.alphabets = {
  "cjk": ["cn", "jp", "kr"],
  "cyrillic": ["ru"],
  "latin": ["de", "dk", "en", "es", "fr", "nl", "pl", "se"],
}


// Character translation tables per language. Just hiragana/katakana.
// Define this for all objects, not just for the instance.
Language.charset = {
  "jp": {
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
       "わ", "ゐ",		   "ゑ", "を",
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
       "ヤ",		   "ユ",      "ヨ",
       "ラ", "リ", "ル", "レ", "ロ",
       "ワ", "ヰ",       "ヱ", "ヲ",
                   "ン",
       "ァ", "ィ", "ゥ", "ェ", "ォ",
       "ャ",       "ュ",      "ョ"]
  }
}

// Default parameters for entities that lack language information
Language.L.default = {
  "order": ["en", "jp"]
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
         "money": "💸",
       "monocle": "🧐",
          "moon": "🌙",
        "mother": "👩🏻",
        "muzzle": "🐴",
          "nerd": "🤓",
      "no_emoji": "⚪",
       "no_more": "🚫",
          "nose": "👃",
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
        "window": "🖼",
          "wink": "😉",
         "worry": "😢",
           "wip": "🚧",
          "yawn": "😪",
           "zoo": "🦁"
}

// TODO: key on other language versions of country names
Language.L.flags = {
     "Argentina": "🇦🇷",
     "Australia": "🇦🇺",
       "Austria": "🇦🇹",
       "Belgium": "🇧🇪",
        "Bhutan": "🇧🇹",
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
   "Isle of Man": "🇮🇲",
         "Italy": "🇮🇹",
         "Japan": "🇯🇵",
        "Mexico": "🇲🇽",
         "Nepal": "🇳🇵",
   "Netherlands": "🇳🇱",
   "New Zealand": "🇳🇿",
        "Poland": "🇵🇱",
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
    "cn": "关于",
    "en": "About",
    "jp": "概要",
    "np": "बारेमा"
  },
  "autumn": {
    "cn": "秋",
    "en": "Autumn",
    "jp": "秋",
    "np": "शरद तु"
  },
  "babies": {
    "cn": "婴儿",
    "en": "Babies",
    "jp": "乳幼児",
    "np": "बच्चाहरु"
  },
  "children": {
    "cn": Pandas.def.relations.children["cn"],
    "en": "Children",   // Capitalization
    "jp": Pandas.def.relations.children["jp"],
    "np": "बच्चाहरु"
  },
  "contribute": {
    "cn": "上传照片",
    "en": "Submit a Photo",
    "jp": "写真を提出する",
    "np": "फोटो पेश गर्नुहोस्"
  },
  "contribute_link": {
    "en": "https://docs.google.com/forms/d/1kKBv92o09wFIBFcvooYLm2cG8XksGcVQQSiu9SpHGf0",
    "jp": "https://docs.google.com/forms/d/1wEhwNieyonPNSk6q8fflUT3e4kyAsIlAFmeib1tW4Jk"
  },
  "copied": {
    "cn": "复制",
    "en": "Copied",
    "jp": "写す",
    "np": "अनुकरण गनु"
  },
  "fall": {
    "cn": "秋",   // Convenience duplicate of autumn
    "en": "Autumn",
    "jp": "秋",
    "np": "शरद तु"
  },
  "family": {
    "cn": "家族",
    "en": "Family",
    "jp": "ファミリ",
    "np": "परिवार"
  },
  "father": {
    "cn": "父亲",
    "en": "Father",
    "jp": "父",
    "np": "बुबा"
  },
  "flag": {
    "cn": Language.L.flags["China"],
    "en": Language.L.flags["USA"],
    "es": Language.L.flags["Spain"],
    "jp": Language.L.flags["Japan"],
    "np": Language.L.flags["Nepal"]
  },
  "footerLink_rpf": {
    "cn": "小熊猫族谱项目",
    "en": "Red Panda Lineage",
    "jp": "Red Panda Lineage",
    "np": "Red Panda Lineage"
  },
  "footerLink_rpn": {
    "cn": "Red Panda Network",
    "en": "Red Panda Network",
    "jp": "Red Panda Network",
    "np": "Red Panda Network"
  },
  "home": {
    "cn": "主页",
    "en": "Home",
    "es": "Home",
    "jp": "ホーム",
    "np": "होमपेज"
  },
  "instagramLinks_body": {
    "cn": "",
    "en": "Without all the dedicated and loving Instagram red panda fans I " +
          "know, this site would not exist. Thank you so much!",
    "jp": "",
    "np": ""
  },
  "instagramLinks_button": {
    "cn": "IG",
    "en": "Instagram",
    "jp": "インスタグラム",
    "np": "Instagram"
  },
  "instagramLinks_header": {
    "cn": "Instagram 小熊猫",
    "en": "Red Pandas on Instagram",
    "jp": "Instagram レッサーパンダ",
    "np": "Instagram निगल्य पोन्या"
  },
  "language": {
    "cn": {
      "cn": "汉语",
      "en": "英语",
      "es": "西班牙语",
      "jp": "日语",
      "kr": "朝鮮语",
      "np": "尼泊尔语",
      "pl": "波兰语",
      "ru": "俄语",
      "se": "瑞典"
    },
    "en": {
      "cn": "Chinese",
      "en": "English",
      "es": "Spanish",
      "jp": "Japanese",
      "kr": "Korean",
      "np": "Nepalese",
      "pl": "Polish",
      "ru": "Russian",
      "se": "Swedish"
    },
    "es": {
      "cn": "Chino",
      "en": "Ingles",
      "es": "Español",
      "jp": "Japonés",
      "kr": "Coreano",
      "np": "Nepalés",
      "pl": "Polaco",
      "ru": "Ruso",
      "se": "Sueco"
    },
    "jp": {
      "cn": "中国語",
      "en": "英語",
      "es": "スペイン語",
      "jp": "日本語",
      "kr": "韓国語",
      "np": "ネパール語",
      "pl": "ポーランド語",
      "ru": "ロシア語",
      "se": "スウェーデン"
    },
    "np": {
      "cn": "चिनियाँ",
      "en": "अंग्रेजी",
      "es": "स्पनिश",
      "jp": "जापानी",
      "kr": "कोरियन",
      "np": "नेपाली",
      "pl": "पोलिश",
      "ru": "रसियन",
      "se": "स्वीडिश"
    },
    "ru": {
      "cn": "китайский",
      "en": "английский",
      "es": "испанский",
      "jp": "японский",
      "kr": "корейский",
      "np": "непальский",
      "pl": "Польский",
      "ru": "русский",
      "se": "шведский"
    },
    "se": {
      "cn": "Kinesiskt",
      "en": "Engelska",
      "es": "Spanska",
      "jp": "Japanska",
      "kr": "Koreanska",
      "np": "Nepali",
      "pl": "Polska",
      "ru": "Ryska",
      "se": "Svenska"
    }
  },
  "loading": {
    "cn": "加载中...",
    "en": "Loading...",
    "jp": "ローディング",
    "np": "लोड"
  },
  "litter": {
    "cn": Pandas.def.relations.litter["cn"],
    "en": "Litter",   // Capitalization
    "jp": Pandas.def.relations.litter["jp"],
    "np": "रोटी"
  },
  "links": {
    "cn": "链接",
    "en": "Links",
    "jp": "リンク",
    "np": "लिंक"
  },
  "me": {
    "cn": "我",
    "en": "Me",
    "jp": "私",
    "np": "म"
  },
  "media": {
    "cn": "媒体",
    "en": "Media",
    "jp": "メディア",
    "np": "मिडिया"
  },
  "mother": {
    "cn": "母亲",
    "en": "Mother",
    "jp": "母",
    "np": "आमा"
  },
  "nicknames": {
    "cn": "昵称",
    "en": "Nicknames",
    "jp": "ニックネーム",
    "np": "उपनामहरू"
  },
  "othernames": {
    "cn": "其他名称",
    "en": "Other Names",
    "jp": "他の名前",
    "np": "अरु नामहरु"
  },
  "paging": {
    "cn": "更多",
    "en": "More",
    "jp": "もっと",
    "np": "अधिक"
  },
  "parents": {
    "cn": Pandas.def.relations.parents["cn"],
    "en": "Parents",   // Capitalization
    "jp": Pandas.def.relations.parents["jp"],
    "np": "अभिभावक"
  },
  "profile": {
    "cn": "档案",
    "en": "Profile",
    "jp": "プロフィール",
    "np": "प्रोफाइल"
  },
  "quadruplet": {
    "cn": "四胞胎",
    "en": "Quadruplet",
    "jp": "四つ子",
    "np": "प्रोफाइल"
  },
  "random": {
    "cn": "随机",
    "en": "Random",
    "jp": "適当",
    "np": "अनियमित"
  },
  "redPandaCommunity_body": {
    "cn": "",
    "en": "",
    "jp": "",
    "np": ""
  },
  "redPandaCommunity_button": {
    "cn": "社区",
    "en": "Community",
    "jp": "共同体",
    "np": "समुदाय"
  },
  "redPandaCommunity_header": {
    "cn": "小熊猫社区",
    "en": "Red Panda Community",
    "jp": "レッサーパンダの共同体",
    "np": "निगल्य पोन्या समुदाय"
  },
  "refresh": {
    "cn": "刷新",
    "en": "Refresh",
    "jp": "リロード",
    "np": "ताजा गर्नु"
  },
  "search": {
    "cn": "搜索...",
    "en": "Search...",
    "jp": "サーチ...",
    "np": "खोज्नु"
  },
  "seen_date": {
    "cn": "目击日期 <INSERTDATE>",
    "en": "Seen <INSERTDATE>",
    "jp": "TOWRITE <INSERTDATE>",
    "np": "TOWRITE <INSERTDATE>"
  },
  "siblings": {
    "cn": Pandas.def.relations.siblings["cn"],
    "en": "Siblings",   // Capitalization
    "jp": Pandas.def.relations.siblings["jp"],
    "np": "भाइबहिनीहरू"
  },
  "since_date": {
    "cn": "自 <INSERTDATE>",
    "en": "Since <INSERTDATE>",
    "jp": "<INSERTDATE>から",
    "np": "<INSERTDATE>देखि"
  },
  "specialThanksLinks_body": {
    "cn": "",
    "en": "",
    "jp": "",
    "np": ""
  },
  "specialThanksLinks_button": {
    "cn": "鸣谢",
    "en": "Special Thanks",
    "jp": "感佩",
    "np": "विशेष धन्यवाद"
  },
  "specialThanksLinks_header": {
    "cn": "鸣谢",
    "en": "Special Thanks",
    "jp": "感佩",
    "np": "विशेष धन्यवाद"
  },
  "spring": {
    "cn": "春",
    "en": "Spring",
    "jp": "春",
    "np": "वसन्त"
  },
  "summer": {
    "cn": "夏",
    "en": "Summer",
    "jp": "夏",
    "np": "गर्मी"
  },
  "title": {
    "cn": "查找小熊猫",
    "en": "Red Panda Finder",
    "jp": "レッサーパンダのファインダー",
    "np": "निगल्या पोनिया मित्र"
  },
  "top": {
    "cn": "顶部",
    "en": "Top",
    "jp": "上",
    "np": "माथि"
  },
  "tree": {
    "cn": "树",
    "en": "Tree",
    "jp": "木",
    "np": "रूख"
  },
  "twin": {
    "cn": "双胞胎",
    "en": "Twin",
    "jp": "双子",
    "np": "जुम्ल्याहा"
  },
  "triplet": {
    "cn": "三胞胎",
    "en": "Triplet",
    "jp": "三つ子",
    "np": "तीनवटा"
  },
  "winter": {
    "cn": "冬",
    "en": "Winter",
    "jp": "冬",
    "np": "जाडो"
  },
  "zooLinks_body": {
    "cn": "",
    "en": "While many zoos are represented in this dataset, some of them are " +
          "hotspots for seeing Red Pandas.",
    "jp": "",
    "np": ""
  },
  "zooLinks_button": {
    "cn": "动物园",
    "en": "Zoos",
    "jp": "動物園",
    "np": "चिडियाखाना"
  },
  "zooLinks_header": {
    "cn": "小熊猫动物园",
    "en": "Major Red Panda Zoos",
    "jp": "レッサーパンダの動物園",
    "np": "प्रमुख चिडियाखाना"
  }
}

Language.L.messages = {
  "and": {
    "cn": "和",
    "en": " & ",
    "jp": "と",
    "np": " र "
  },
  "and_words": {
    "cn": "和",
    "en": " and ",
    "jp": "と",
    "np": " र "
  },
  "arrived_from_zoo": {
    "cn": ["<INSERTDATE>",
           "，来自",
           "<INSERTZOO>"],
    "en": ["<INSERTDATE>",
           ", from ",
           "<INSERTZOO>"],
    "jp": ["<INSERTDATE>",
           "、",
           "<INSERTZOO>",
           "から"],
    "np": ["<INSERTDATE>",
           " बाट ",
           "<INSERTZOO>"]
  },
  "closed": {
    "cn": [Language.L.emoji.closed + " ",
           "<INSERTDATE>",
           "永久关闭"],
    "en": [Language.L.emoji.closed + " ", 
           "Permanently closed on ",
           "<INSERTDATE>"],
    "jp": [Language.L.emoji.closed + " ",
           "<INSERTDATE>",
           "に閉業"],
    "np": [Language.L.emoji.closed + " ",
           "स्थायी रूपमा ",
           "<INSERTDATE>",
           "बन्द भयो"]
  },
  "comma": {
    "cn": "及",
    "en": ", ",
    "jp": "と",
    "np": ", "
  },
  "credit": {
    "cn": [Language.L.emoji.gift + " ",
           "<INSERTUSER>",
           "提供了",
           "<INSERTNUMBER>",
           "张照片。"],
    "en": [Language.L.emoji.gift + " ",
           "<INSERTUSER>",
           " has contributed ",
           "<INSERTNUMBER>",
           " photos."],
    "jp": [Language.L.emoji.gift + " ",
           "<INSERTUSER>",
           "は",
           "<INSERTNUMBER>",
           "枚の写真を寄稿しました。"],
    "np": [Language.L.emoji.gift + " ",
           "<INSERTUSER>",
           " ले ",
           "<INSERTNUMBER>",
           " फोटो योगदान गरेको छ"]
  },
  "credit_animal_filter_single": {
    "cn": [Language.L.emoji.gift + " ",
           "<INSERTUSER>",
           "提供了",
           "<INSERTNUMBER>",
           "张",
           "<INSERTNAME>",
           "照片。"],
    "en": [Language.L.emoji.gift + " ",
           "<INSERTUSER>",
           " has contributed ",
           "<INSERTNUMBER>",
           " photos of ",
           "<INSERTNAME>",
           "."],
    "jp": [Language.L.emoji.gift + " ",
           "<INSERTUSER>",
           "が",
           "<INSERTNAME>",
           "の写真を",
           "<INSERTNUMBER>",
           "枚投稿しました。"],
    "np": [Language.L.emoji.gift + " ",
           "<INSERTUSER>",
           " ",
           "<INSERTNUMBER>",
           " ",
           "<INSERTNAME>",
           " फोटोहरु योगदान गरेको छ"]
  },
  "departed_to_zoo": {
    "cn": ["<INSERTDATE>",
           "去",
           "<INSERTZOO>"],
    "en": ["<INSERTZOO>",
           " on ",
           "<INSERTDATE>"],
    "jp": ["<INSERTDATE>",
           "に",
           "<INSERTZOO>",
           "に行きました"],
    "np": ["<INSERTZOO>",
           " ",
           "<INSERTDATE>",
           " मा"]
  },
  "find_a_nearby_zoo": {
    "cn": [Language.L.emoji.globe_asia, " 寻找附近的动物园"],
    "en": [Language.L.emoji.globe_americas, " Find a zoo nearby!"],
    "jp": [Language.L.emoji.globe_asia, " 近くの動物園を見つける"],
    "np": [Language.L.emoji.globe_asia, " नजिकै चिडियाखाना खोज्नुहोस्"]
  },
  "footer": {
    "cn": ["如果你喜爱小熊猫，请支持小熊猫网络（",
           "<INSERTLINK_RPN>",
           "）以及你当地的动物园。",
           "族谱数据归属于",
           "<INSERTLINK_RPF>",
           "但相关媒介内容（如图片等）版权归属于原作者。",
           "布局与设计©2020 Justin Fairchild"],
    "en": ["If you love red pandas, please support ",
           "<INSERTLINK_RPN>",
           " as well as your local zoos. Lineage data courtesy of the ",
           "<INSERTLINK_RPF>",
           " project, but linked media remains property of its creators. ",
           "Layout and design ©" +
           "\xa0" +
           "2020 Justin Fairchild."],
    "jp": ["レッサーパンダが好きな人は、地元の動物園だけでなく",
           "<INSERTLINK_RPN>",
           "もサポートしてください。系統データは",
           "<INSERTLINK_RPF>",
           "プロジェクトの好意により提供されていますが、リンクされたメディアは引き続き作成者の所有物です。",
           "設計©2020 Justin Fairchild"],
    "np": ["यदि तपाईं निगल्य पोन्या मन पराउनुहुन्छ, कृपया ",
           "<INSERTLINK_RPN>",
           " साथै तपाईंको स्थानीय चिडियाखानालाई समर्थन गर्नुहोस्। ",
           "<INSERTLINK_RPF>",
           " प्रोजेक्टको वंश डाटा शिष्टाचार, तर मिडिया यसको सिर्जनाकर्ताहरूको सम्पत्ति रहन्छ।",
           " लेआउट र डिजाइन प्रतिलिपि अधिकार २०२० Justin Fairchild द्वारा।"]
  },
  "found_animal": {
    "cn": [Language.L.emoji.flower, " ",
           Language.L.emoji.see_and_say, 
           " ",
           "<INSERTNAME>",
           " has been found and is safe!"],
    "en": [Language.L.emoji.flower, " ",
           Language.L.emoji.see_and_say, 
           " ",
           "<INSERTNAME>",
           " has been found and is safe!"],
    "jp": [Language.L.emoji.flower, " ",
           Language.L.emoji.see_and_say, 
           " ",
           "<INSERTNAME>",
           " has been found and is safe!"],
    "np": [Language.L.emoji.flower, " ",
           Language.L.emoji.see_and_say, 
           " ",
           "<INSERTNAME>",
           " has been found and is safe!"]
  },
  "goodbye": {
    "cn": ["后会有期, ",
           "<INSERTNAME>",
           "。",
           Language.L.emoji.died,
           "（",
           "<INSERTBIRTH>",
           " — ",
           "<INSERTDEATH>",
           "）"],
    "en": ["Good-bye, ",
           "<INSERTNAME>",
           ". ",
           Language.L.emoji.died,
           " (",
           "<INSERTBIRTH>",
           " — ",
           "<INSERTDEATH>",
           ")"],
    "jp": ["ありがとう, ",
           "<INSERTNAME>",
           "。",
           Language.L.emoji.died, 
           "（",
           "<INSERTBIRTH>",
           " — ",
           "<INSERTDEATH>",
           "）"],
    "np": ["विदाई, ",
           "<INSERTNAME>",
           " ",
           Language.L.emoji.died,
           " (",
           "<INSERTBIRTH>",
           " — ",
           "<INSERTDEATH>",
           ")"]
  },
  "happy_birthday": {
    "cn": [Language.L.emoji.birthday,
           "<INSERTNAME>",
           "生日快乐！（",
           "<INSERTNUMBER>",
           "岁）"],
    "en": [Language.L.emoji.birthday,
           " Happy Birthday, ",
           "<INSERTNAME>",
           "! (",
           "<INSERTNUMBER>",
           ")"],
    "jp": [Language.L.emoji.birthday,
           " ",
           "<INSERTNAME>",
           "、誕生日おめでとう！（",
           "<INSERTNUMBER>",
           "歳）"],
    "np": [Language.L.emoji.birthday,
           " ",
           "जन्मदिनको शुभकामना, ",
           "<INSERTNAME>",
           "! (",
           "<INSERTNUMBER>",
           ")"]
  },
  "landing_mothersday": {
    "cn": ["母亲节快乐"],
    "en": ["Happy Mother's Day!"],
    "jp": ["母の日おめでとう"],
    "np": ["खुसी आमाको दिन!"]
  },
  "list_comma": {
    "cn": "、",
    "en": ", ",
    "jp": "、",
    "np": ", "
  },
  "lost_animal": {
    "cn": [Language.L.emoji.alert, " ",
           Language.L.emoji.see_and_say, 
           " If you see ",
           "<INSERTNAME>",
           ", contact ",
           "<ZOONAME>",
           ": ",
           "<ZOOCONTACT>"],
    "en": [Language.L.emoji.alert, " ",
           Language.L.emoji.see_and_say, 
           " If you see ",
           "<INSERTNAME>",
           ", contact ",
           "<ZOONAME>",
           ": ",
           "<ZOOCONTACT>"],
    "jp": [Language.L.emoji.alert, " ",
           Language.L.emoji.see_and_say, 
           " If you see ",
           "<INSERTNAME>",
           ", contact ",
           "<ZOONAME>",
           ": ",
           "<ZOOCONTACT>"],
    "np": [Language.L.emoji.alert, " ",
           Language.L.emoji.see_and_say, 
           " If you see ",
           "<INSERTNAME>",
           ", contact ",
           "<ZOONAME>",
           ": ",
           "<ZOOCONTACT>"],
  },
  "lunch_time": {
    "cn": [Language.L.emoji.paws, " ",
           "午饭吃什么？", " ",
           Language.L.emoji.greens],
    "en": [Language.L.emoji.paws, " ",
           "What's for lunch?", " ",
           Language.L.emoji.greens],
    "jp": [Language.L.emoji.paws, " ",
           "昼食は何ですか？", " ",
           Language.L.emoji.greens],
    "np": [Language.L.emoji.paws, " ",
           "खाजाको लागि के हो?", " ",
           Language.L.emoji.greens],
  },
  "missing_you": {
    "cn": ["我们想你, ",
           "<INSERTNAME>",
           "。",
           Language.L.emoji.died,
           "（",
           "<INSERTBIRTH>",
           " — ",
           "<INSERTDEATH>",
           "）"],
    "en": ["We miss you, ",
           "<INSERTNAME>",
           ". ",
           Language.L.emoji.died,
           " (",
           "<INSERTBIRTH>",
           " — ",
           "<INSERTDEATH>",
           ")"],
    "jp": ["あなたがいなくてとても寂しい, ",
           "<INSERTNAME>",
           "。",
           Language.L.emoji.died, 
           "（",
           "<INSERTBIRTH>",
           " — ",
           "<INSERTDEATH>",
           "）"],
    "np": ["हामी तिमीलाई सम्झिन्छौं",
           "<INSERTNAME>",
           " ",
           Language.L.emoji.died,
           " (",
           "<INSERTBIRTH>",
           " — ",
           "<INSERTDEATH>",
           ")"]    
  },
  "nearby_zoos": {
    "cn": [Language.L.emoji.website,
           " ",
           Language.L.emoji.home,
           " 查找附近的动物园。",
           "如果地理位置失败，",
           "请尝试搜索您的城市。"],
    "en": [Language.L.emoji.website,
           " ",
           Language.L.emoji.home,
           " Finding nearby zoos. ",
           "If geolocation fails, try ",
           "searching for your city."],
    "jp": [Language.L.emoji.website,
           " ",
           Language.L.emoji.home,
           " 近くの動物園を見上げます。",
           "ジオロケーションが失敗した場合は、",
           "都市を検索してみてください。"],
    "np": [Language.L.emoji.website, 
           " ",
           Language.L.emoji.home,
           " नजिकका चिडियाखानाहरू भेट्टाउँदै।",
           " यदि भौगोलिक स्थान असफल भयो भने,",
           " आफ्नो शहरको लागि खोजी प्रयास गर्नुहोस्।"]
  },
  "new_photos": {
    "contributors": {
      "cn": [Language.L.emoji.giftwrap,
             "<INSERTCOUNT>",
             "新贡献者"],
      "en": [Language.L.emoji.giftwrap,
             " ",
             "<INSERTCOUNT>",
             " new contributors"],
      "jp": [Language.L.emoji.giftwrap,
             "<INSERTCOUNT>",
             "人の新しい貢献者"],
      "np": [Language.L.emoji.giftwrap,
             " ",
             "<INSERTCOUNT>",
             " योगदानकर्ताहरू नयाँ"]
    },
    "pandas": {
      "cn": [Language.L.emoji.profile,
             " ",
             "<INSERTCOUNT>",
             "只新小熊猫"],
      "en": [Language.L.emoji.profile,
             " ",
             "<INSERTCOUNT>",
             " new red pandas"],
      "jp": [Language.L.emoji.profile,
             " ",
             "<INSERTCOUNT>",
             "つの新しいレッサーパンダ"],
      "np": [Language.L.emoji.profile,
             " ",
             "<INSERTCOUNT>",
             " निगल्य पोन्या नयाँ"]
    },
    "photos": {
      "cn": ["<INSERTCOUNT>",
             "张新照片"], 
      "en": ["<INSERTCOUNT>",
             " new photos"],
      "jp": ["<INSERTCOUNT>",
             "枚の新しい写真"],
      "np": ["<INSERTCOUNT>",
             " छवि नयाँ"]
    },
    "suffix": {
      "cn": ["本星期！"],
      "en": [" this week!"],
      "jp": ["今週！"],
      "np": ["यो हप्ता"]
    },
    "zoos": {
      "cn": [Language.L.emoji.zoo,
             "<INSERTCOUNT>",
             "个新动物园"],
      "en": [Language.L.emoji.zoo,
            " ",
            "<INSERTCOUNT>",
            " new zoos"],
      "jp": [Language.L.emoji.zoo,
             "<INSERTCOUNT>",
             "つの新しい動物園"],
      "np": [Language.L.emoji.zoo,
             " ",
             "<INSERTCOUNT>",
             " नयाँ चिडियाखाना"]
    }
  },
  "no_result": {
    "cn": ["没有找到这只小熊猫"],
    "en": ["No Pandas Found"],
    "jp": ["パンダが見つかりません"],
    "np": ["कुनै निगल्य पोन्या फेला परेन"]
  },
  "no_group_media_result": {
    "cn": ["找不到合影"],
    "en": ["No Group Photos Found"],
    "jp": ["集合写真は見つかりませんでした"],
    "np": ["कुनै निगल्य पोन्या समूह भेटिएन"]
  },
  "no_subject_tag_result": {
    "cn": ["没有关联照片"],
    "en": ["No Tagged Photos"],
    "jp": ["このパンダのタグ付けされた写真はありません"],
    "np": ["कुनै फोटोहरू ट्याग छैनन्"]
  },
  "no_zoos_nearby": {
    "cn": ["附近没有动物园"],
    "en": ["No Zoos Nearby"],
    "jp": ["近くに動物園はありません"],
    "np": ["नजिकै कुनै चिडियाखाना छैन"]
  },
  "overflow": {
    "cn": ["显示前",
          "<INSERTLIMIT>",
          "个"],
    "en": [" First ",
           "<INSERTLIMIT>",
           " shown."],
    "jp": ["最初の",
           "<INSERTLIMIT>",
           "を表示"],
    "np": [" ",
           "<INSERTLIMIT>",
           " मात्र"]
  },
  "profile_babies_children": {
    "cn": ["<INSERTNAME>",
           "有",
           "<INSERTBABIES>",
           "个孩子"],
    "en": ["<INSERTNAME>",
           " has ",
           "<INSERTBABIES>",
           " children."],
    "jp": ["<INSERTNAME>",
           "の子供",
           "<INSERTBABIES>",
           "人"],
    "np": ["<INSERTNAME>",
           " को ",
           "<INSERTBABIES>",
           " बच्चाहरु छन्"]
  },
  "profile_babies_siblings": {
    "cn": ["<INSERTNAME>",
           "有",
           "<INSERTBABIES>",
           "个孩子"],
    "en": ["<INSERTNAME>",
           " has ",
           "<INSERTBABIES>",
           " baby siblings."],
    "jp": ["<INSERTNAME>",
           "には",
           "<INSERTBABIES>",
           "人の赤ちゃんの兄弟がいます"],
    "np": ["<INSERTNAME>",
           " ",
           "<INSERTBABIES>",
           " बच्चाका भाई बहिनीहरू छन्"]
  },
  "profile_brothers": {
    "cn": ["<INSERTNAME>",
           "有",
           "<INSERTBROTHERS>",
           "个兄弟"],
    "en": ["<INSERTNAME>",
           " has ",
           "<INSERTBROTHERS>",
           " brothers."],
    "jp": ["<INSERTNAME>",
           "には",
           "<INSERTBROTHERS>",
           "人の兄弟がいます"],
    "np": ["<INSERTNAME>",
           " छ ",
           "<INSERTBROTHERS>",
           " भाइहरु"]
  },
  "profile_brothers_babies": {
    "cn": ["<INSERTNAME>",
           "有",
           "<INSERTBROTHERS>",
           "个姐妹",
           "<INSERTBABIES>",
           "个新生儿"],
    "en": ["<INSERTNAME>",
           " has ",
           "<INSERTBROTHERS>",
           " brothers and ",
           "<INSERTBABIES>",
           " newborns."],
    "jp": ["<INSERTNAME>",
           "には",
           "<INSERTBROTHERS>",
           "人の兄弟と",
           "<INSERTBABIES>",
           "人の赤ちゃんの兄弟がいます"],
    "np": ["<INSERTNAME>",
           " छ ",
           "<INSERTBROTHERS>",
           " भाइहरु र ",
           "<INSERTBABIES>",
           " नवजात शिशुहरू"]
  },
  "profile_children": {
    "cn": ["<INSERTNAME>",
           "一共有",
           "<INSERTTOTAL>",
           "个孩子: ",
           "<INSERTDAUGHTERS>",
           "个女儿和",
           "<INSERTSONS>",
           "个儿子！"],
    "en": ["<INSERTNAME>",
           " has ",
           "<INSERTTOTAL>",
           " children: ",
           "<INSERTDAUGHTERS>",
           " girls and ",
           "<INSERTSONS>",
           " boys!"],
    "jp": ["<INSERTNAME>",
           "には",
           "<INSERTTOTAL>",
           "人の子供がいます：",
           "<INSERTDAUGHTERS>",
           "人の女の子と",
           "<INSERTSONS>",
           "人の男の子"],
    "np": ["<INSERTNAME>",
           " छ ",
           "<INSERTTOTAL>",
           " बच्चाहरु: ",
           "<INSERTDAUGHTERS>",
           " छोरीहरू र ",
           "<INSERTSONS>",
           " छोराहरू!"]
  },
  "profile_children_babies": {
    "cn": ["<INSERTNAME>",
           "一共有",
           "<INSERTTOTAL>",
           "个孩子: ",
           "<INSERTDAUGHTERS>",
           "个女儿，",
           "<INSERTSONS>",
           "个儿子，以及",
           "<INSERTBABIES>",
           "个新生儿！"],
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
    "jp": ["<INSERTNAME>",
           "には",
           "<INSERTTOTAL>",
           "人の子供がいます：",
           "<INSERTDAUGHTERS>",
           "人の女の子と、",
           "<INSERTSONS>",
           "人の男の子、および",
           "<INSERTBABIES>",
           "人の子供"],
    "np": ["<INSERTNAME>",
           " छ ",
           "<INSERTTOTAL>",
           " बच्चाहरु: ",
           "<INSERTDAUGHTERS>",
           " छोरीहरू, ",
           "<INSERTSONS>",
           " छोराहरू र ",
           "<INSERTBABIES>",
           " बच्चाहरु!"]
  },
  "profile_daughters": {
    "cn": ["<INSERTNAME>",
           "有",
           "<INSERTDAUGHTERS>",
           "个女儿"],
    "en": ["<INSERTNAME>",
           " has ",
           "<INSERTDAUGHTERS>",
           " daughters."],
    "jp": ["<INSERTNAME>",
           "には",
           "<INSERTDAUGHTERS>",
           "人の娘がいます"],
    "np": ["<INSERTNAME>",
           " छ ",
           "<INSERTDAUGHTERS>",
           " छोरीहरू"]
  },
  "profile_daughters_babies": {
    "cn": ["<INSERTNAME>",
           "有",
           "<INSERTDAUGHTERS>",
           "个女儿和",
           "<INSERTBABIES>",
           "个新生儿！"],
    "en": ["<INSERTNAME>",
           " has ",
           "<INSERTDAUGHTERS>",
           " daughters and ",
           "<INSERTBABIES>",
           " newborns!"],
    "jp": ["<INSERTNAME>",
           "には",
           "<INSERTDAUGHTERS>",
           "人の娘と",
           "<INSERTBABIES>",
           "人の子供がいます"],
    "np": ["<INSERTNAME>",
           " छ ",
           "<INSERTDAUGHTERS>",
           " छोरीहरू र ",
           "<INSERTBABIES>",
           " बच्चाहरु"]
  },
  "profile_family": {
    "cn": ["<INSERTNAME>",
           "的直系亲属"],
    "en": ["<INSERTNAME>",
           "'s Immediate Family"],
    "jp": ["<INSERTNAME>",
           "の直近の家族"],
    "np": ["<INSERTNAME>",
           "को निकट परिवार"]
  },
  "profile_sisters": {
    "cn": ["<INSERTNAME>",
           "有",
           "<INSERTSISTERS>",
           "个姐妹"],
    "en": ["<INSERTNAME>",
           " has ",
           "<INSERTSISTERS>",
           " sisters."],
    "jp": ["<INSERTNAME>",
           "には",
           "<INSERTSISTERS>",
           "の姉妹がいます"],
    "np": ["<INSERTNAME>",
           " छ ",
           "<INSERTSISTERS>",
           " बहिनीहरू"]
  },
  "profile_sisters_babies": {
    "cn": ["<INSERTNAME>",
           "有",
           "<INSERTSISTERS>",
           "个姐妹和",
           "<INSERTBABIES>",
           "个新生儿"],
    "en": ["<INSERTNAME>",
           " has ",
           "<INSERTSISTERS>",
           " sisters and ",
           "<INSERTBABIES>",
           " newborns."],
    "jp": ["<INSERTNAME>",
           "には",
           "<INSERTSISTERS>",
           "の姉妹と",
           "<INSERTBABIES>",
           "人の赤ちゃんの兄弟がいます"],
    "np": ["<INSERTNAME>",
           " छ ",
           "<INSERTSISTERS>",
           " बहिनीहरू र ",
           "<INSERTBABIES>",
           " बच्चा भाई बहिनीहरू"]
  },
  "profile_siblings": {
    "cn": ["<INSERTNAME>",
           "有",
           "<INSERTTOTAL>",
           "个同胞: ",
           "<INSERTSISTERS>",
           "个姐妹和",
           "<INSERTBROTHERS>",
           "个兄弟！"],
    "en": ["<INSERTNAME>",
           " has ",
           "<INSERTTOTAL>",
           " siblings: ",
           "<INSERTSISTERS>",
           " sisters and ",
           "<INSERTBROTHERS>",
           " brothers!"],
    "jp": ["<INSERTNAME>",
           "には",
           "<INSERTTOTAL>",
           "人の兄弟がいます。",
           "<INSERTSISTERS>",
           "人の姉妹と",
           "<INSERTBROTHERS>",
           "人の兄弟"],
    "np": ["<INSERTNAME>",
           " छ ",
           "<INSERTTOTAL>",
           " भाइबहिनीहरू: ",
           "<INSERTSISTERS>",
           " बहिनीहरू र ",
           "<INSERTBROTHERS>",
           " भाइहरु"]
  },
  "profile_siblings_babies": {
    "cn": ["<INSERTNAME>",
           "有",
           "<INSERTTOTAL>",
           "个同胞：",
           "<INSERTSISTERS>",
           "个姐妹，",
           "<INSERTBROTHERS>",
           "个兄弟，以及",
           "<INSERTBABIES>",
           "个新生儿！"],
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
    "jp": ["<INSERTNAME>",
           "には",
           "<INSERTTOTAL>",
           "人の兄弟がいます：",
           "<INSERTSISTERS>",
           "人の姉妹、",
           "<INSERTBROTHERS>",
           "人の兄弟、および",
           "<INSERTBABIES>",
           "人の赤ちゃんの兄弟"],
    "np": ["<INSERTNAME>",
           " छ ",
           "<INSERTTOTAL>",
           " भाइबहिनीहरू: ",
           "<INSERTSISTERS>",
           " बहिनीहरू, ",
           "<INSERTBROTHERS>",
           " भाइहरु र ",
           "<INSERTBABIES>",
           " बच्चाहरु!"]
  },
  "profile_sons": {
    "cn": ["<INSERTNAME>",
           "有",
           "<INSERTSONS>",
           "个儿子"],
    "en": ["<INSERTNAME>",
           " has ",
           "<INSERTSONS>",
           " sons."],
    "jp": ["<INSERTNAME>",
           "の息子は",
           "<INSERTSONS>",
           "人です"],
    "np": ["<INSERTNAME>",
           " छ ",
           "<INSERTSONS>",
           " छोराहरू"]
  },
  "profile_sons_babies": {
    "cn": ["<INSERTNAME>",
           "有",
           "<INSERTSONS>",
           "个儿子和",
           "<INSERTBABIES>",
           "个新生儿！"],
    "en": ["<INSERTNAME>",
           " has ",
           "<INSERTSONS>",
           " sons and ",
           "<INSERTBABIES>",
           " newborns!"],
    "jp": ["<INSERTNAME>",
           "には",
           "<INSERTSONS>",
           "人の息子と",
           "<INSERTBABIES>",
           "人の子供がいます"],
    "np": ["<INSERTNAME>",
           " छ ",
           "<INSERTSONS>",
           " छोराहरू र ",
           "<INSERTBABIES>",
           " बच्चाहरु!"]
  },
  "profile_where": {
    "cn": ["<INSERTNAME>",
           "住在哪里？"],
    "en": ["Where has ",
           "<INSERTNAME>",
           " lived?"],
    "jp": ["<INSERTNAME>",
           "はどこに住んでいましたか？"],
    "np": ["<INSERTNAME>",
           " कहाँ बस्यो?"]
  },
  "remembering_you_together": {
    "cn": [Language.L.emoji.hearts, " ",
           "<INSERTNAMES>",
           ": 我们永远不会忘记你。",
           Language.L.emoji.paws],
    "en": [Language.L.emoji.hearts, " ",
           "<INSERTNAMES>",
           ": We will never forget you. ",
           " ", Language.L.emoji.paws],
    "jp": [Language.L.emoji.hearts, " ",
           "<INSERTNAMES>",
           "〜私たちは君を決して忘れません。",
           Language.L.emoji.paws],
    "np": [Language.L.emoji.hearts, " ",
           "<INSERTNAMES>",
           ": हामी तिमीलाई कहिल्यै बिर्सिने छैनौं। ",
           Language.L.emoji.paws]
  },
  "shovel_pandas": {
    "cn": [Language.L.emoji.dig, " ",
           "寻找埋藏的宝藏", " ",
           Language.L.emoji.treasure],
    "en": [Language.L.emoji.dig, " ",
           "Searching for buried treasure!", " ",
           Language.L.emoji.treasure],
    "jp": [Language.L.emoji.dig, " ",
           "埋蔵金を探す", " ",
           Language.L.emoji.treasure],
    "np": [Language.L.emoji.dig, " ",
           "गाडिएको खजाना खोजी गर्दै", " ",
           Language.L.emoji.treasure]
  },
  "tag_combo": {
    "cn": ["组合搜索:",
           "<INSERTNUM>",
           "相片。"],
    "en": [" combo: ",
           "<INSERTNUM>",
           " photos."],
    "jp": ["コンボ検索:",
           "<INSERTNUM>",
           "写真。"],
    "np": ["कम्बो: ",
           "<INSERTNUM>",
           " फोटोहरू"]
  },
  "tag_subject": {
    "cn": ["<INSERTNUM>",
           "张",
           "<INSERTNAME>",
           "<INSERTEMOJI>",
           "<INSERTTAG>",
           "的照片"],
    "en": ["<INSERTNUM>",
           " ",
           "<INSERTNAME>",
           " photos tagged ",
           "<INSERTEMOJI>",
           " ",
           "<INSERTTAG>",
           "."],
    "jp": ["<INSERTNUM>",
           "枚の",
           "<INSERTNAME>",
           "の",
           "<INSERTEMOJI>",
           "<INSERTTAG>",
           "。"],
    "np": ["<INSERTNUM>",
           " ",
           "<INSERTNAME>",
           " फोटोहरू ट्याग गरियो ",
           "<INSERTEMOJI>",
           " ",
           "<INSERTTAG>",
           "।"]
  },
  "trick_or_treat": {
    "cn": [Language.L.emoji.pumpkin, " ",
           "怪异的南瓜", " ",
           Language.L.emoji.pumpkin],
    "en": [Language.L.emoji.pumpkin, " ",
           "Trick or Treat", " ",
           Language.L.emoji.pumpkin],
    "jp": [Language.L.emoji.pumpkin, " " ,
           "不気味なカボチャ", " ",
           Language.L.emoji.pumpkin],
    "np": [Language.L.emoji.pumpkin, " " ,
           "डरलाग्दो कद्दु", " ",
           Language.L.emoji.pumpkin]
  },
  "zoo_details_babies": {
    "cn": [Language.L.emoji.baby,
           " ",
           "自",
           "<INSERTYEAR>",
           "年以来出生的",
           "<INSERTBABIES>",
           "名婴儿"],
    "en": [Language.L.emoji.baby,
           " ",
           "<INSERTBABIES>",
           " cubs born since ",
           "<INSERTYEAR>"],
    "jp": [Language.L.emoji.baby,
           " ",
           "<INSERTYEAR>",
           "年から生まれた",
           "<INSERTBABIES>",
           "人の赤ちゃん"],
    "np": [Language.L.emoji.baby,
           " ",
           "<INSERTBABIES>",
           " पछि बच्चा जन्मे ",
           "<INSERTYEAR>"]
  },
  "zoo_details_departures": {
    "cn": [Language.L.emoji.truck,
           " ",
           "<INSERTNUM>",
           "最近出发"],
    "en": [Language.L.emoji.truck,
           " ",
           "<INSERTNUM>", 
           " recent departures"],
    "jp": [Language.L.emoji.truck,
           " ",
           "最近の",
           "<INSERTNUM>",
           "回の出発"],
    "np": [Language.L.emoji.truck,
           " ",
           "<INSERTNUM>",
           " भर्खरको प्रस्थान"]
  },
  "zoo_details_pandas_live_here": {
    "cn": [Language.L.emoji.panda,
           " ",
           "<INSERTNUM>",
           "只大熊猫住在这里"],
    "en": [Language.L.emoji.panda,
           " ",
           "<INSERTNUM>",
           " red pandas live here"],
    "jp": [Language.L.emoji.panda,
           " ",
           "ここに",
           "<INSERTNUM>",
           "匹のレッサーパンダが住んでいます"],
    "np": [Language.L.emoji.panda,
           " ",
           "<INSERTNUM>",
           " पांडा यहाँ बस्छन्"]
  },
  "zoo_details_no_pandas_live_here": {
    "cn": [Language.L.emoji.panda,
           " ",
           "没有找到这只小熊猫"],
    "en": [Language.L.emoji.panda,
           " ",
           "No red pandas currently here"],
    "jp": [Language.L.emoji.panda,
           " ",
           "パンダが見つかりません"],
    "np": [Language.L.emoji.panda,
           " ",
           "कुनै निगल्य पोन्या फेला परेन"]
  },
  "zoo_details_records": {
    "cn": [Language.L.emoji.recordbook,
           " ",
           "自",
           "<INSERTYEAR>",
           "年以来",
           "<INSERTNUM>",
           "个记录在数据库中"],
    "en": [Language.L.emoji.recordbook,
           " ",
           "<INSERTNUM>",
           " recorded in the database since ",
           "<INSERTYEAR>"],
    "jp": [Language.L.emoji.recordbook,
           " ",
           "<INSERTYEAR>",
           "年からデータベースに記録された",
           "<INSERTNUM>"],
    "np": [Language.L.emoji.recordbook,
           " ",
           "<INSERTNUM>",
           " रेचोर्ड्स इन द दताबसे सिन्के ",
           "<INSERTYEAR>"]
  },
  "zoo_header_new_arrivals": {
    "cn": [Language.L.emoji.fireworks,
           " ",
           "新来的"],
    "en": [Language.L.emoji.fireworks,
           " ",
           "New Arrivals"],
    "jp": [Language.L.emoji.fireworks,
           " ",
           "新着"],
    "np": [Language.L.emoji.fireworks,
           " ",
           "नयाँ आगमन"]
  },
  "zoo_header_other_pandas": {
    "cn": [Language.L.emoji.panda,
           " ",
           "<INSERTZOO>",
           "里的其他小熊猫"],
    "en": [Language.L.emoji.panda,
           " ",
           "Other Pandas at ",
           "<INSERTZOO>"],
    "jp": [Language.L.emoji.panda,
           " ",
           "<INSERTZOO>",
           "の他のパンダ"],
    "np": [Language.L.emoji.panda,
           " ",
           "<INSERTZOO>",
           " अन्य पोन्या"]
  },
  "zoo_header_recently_departed": {
    "cn": [Language.L.emoji.truck,
           " ",
           "最近离开"],
    "en": [Language.L.emoji.truck,
           " ",
           "Recently Departed"],
    "jp": [Language.L.emoji.truck,
           " ",
           "最近出発しました"],
    "np": [Language.L.emoji.truck,
           " ",
           "भर्खर प्रस्थान"]
  }
}

// These are tags in some contexts, and keywords in others
Language.L.polyglots = {
  "baby": {
    "cn": ["宝宝", "婴儿", "婴儿们"],
 "emoji": [Language.L.emoji.baby],
    "en": ["baby", "babies", "Baby", "Aka-chan", "Akachan"],
    "jp": ["赤", "赤ちゃん"],
    "np": ["बच्चा"]
  }
}

// Search tag translations for searching photos by metadata.
// Limit to 100 photos returned by default, but they don't 
// have to be the same 100 returned each time.
// TODO: duplicate tag management (baby)
// TODO: romanji for japanese terms
Language.L.tags = {
  "air tasting": {
       "cn": ["尝尝空气"],
    "emoji": [Language.L.emoji.tongue + 
              Language.L.emoji.butterfly],
       "en": ["air tasting", 
              "air taste"],
       "jp": ["舌ヒラヒラ"],
       "np": ["हावा चाख्ने"]
  },
  "apple time": {
       "cn": ["苹果时间", "苹果"],
    "emoji": [Language.L.emoji.apple],
       "en": ["apple time", "apple"],
       "jp": ["りんごタイム", "りんご"],
       "np": ["स्याउ समय", "स्याउ"]
  },
  "autumn": {
       "cn": ["秋天"],
    "emoji": [Language.L.emoji.autumn],
       "en": ["autumn", "fall"],
       "jp": ["秋"],
       "np": ["शरद तु"]
  },
  "bamboo": {
       "cn": ["竹子", "竹"],
    "emoji": [Language.L.emoji.bamboo],
       "en": ["bamboo"],
       "jp": ["笹", "竹"],
       "np": ["बाँस"]
  },
  "bear worm": {
       "cn": ["蠕动"],
    "emoji": [Language.L.emoji.caterpillar],
       "en": ["bear worm", "bear-worm"],
       "jp": ["のびのび"],
       "np": ["कीरा भालु"]
  },
  "bite": {
       "cn": ["咬", "吃"],
    "emoji": [Language.L.emoji.tooth],
       "en": ["bite"],
       "jp": ["一口"],
       "np": ["काट्नु"]
  },
  "blink": {
       "cn": ["眨眼"],
    "emoji": [Language.L.emoji.blink],
       "en": ["blink", "blinking"],
       "jp": ["まばたき"],
       "np": ["झिम्काइ"]
  },
  "bridge": {
       "cn": ["吊桥", "桥"],
    "emoji": [Language.L.emoji.bridge],
       "en": ["bridge"],
       "jp": ["吊り橋・渡し木", "架け橋"],
       "np": ["पुल"]
  },
  "brothers": {
       "cn": ["兄弟"],
    "emoji": [Language.L.emoji.brothers],
       "en": ["brothers", "bros"],
       "jp": ["男兄弟"],
       "np": ["भाइहरु"]
  },
  "carry": {
       "cn": ["运", "拿"],
    "emoji": [Language.L.emoji.carry],
       "en": ["carry", "holding"],
       "jp": ["笹運び", "枝運び", "運ぶ"],
       "np": ["बोक्नु", "समात्नु"]
  },
  "cherry blossoms": {
       "cn": ["樱花"],
    "emoji": [Language.L.emoji.cherry_blossom],
       "en": ["cherry blossoms", "cherry blossom"],
       "jp": ["桜"],
       "np": ["चेरी खिल"]
  },
  "climb": {
       "cn": ["爬"],
    "emoji": [Language.L.emoji.climb],
       "en": ["climb", "climbing"],
       "jp": ["木登り", "登る"],
       "np": ["चढाई"]
  },
  "couple": {
       "cn": ["夫妇", "情侣"],
    "emoji": [Language.L.emoji.couple],
       "en": ["couple", "partners"],
       "jp": ["カップル", "夫婦", "ふうふ"],
       "np": ["जोडी"]
  },
  "destruction": {
       "cn": ["破坏"],
    "emoji": [Language.L.emoji.tornado],
       "en": ["chaos", "destruction", "mess"],
       "jp": ["破壊"],
       "np": ["विनाश"]
  },
  "dig": {
       "cn": ["挖"],
    "emoji": [Language.L.emoji.dig],
       "en": ["dig", "digging", "digs"],
       "jp": ["穴掘り"],
       "np": ["खन्नुहोस्"]
  },
  "dish": {
       "cn": ["盘子"],
    "emoji": [Language.L.emoji.dish],
       "en": ["dish", "plate"],
       "jp": ["ごはん"],
       "np": ["थाल"]
  },
  "door": {
       "cn": ["门"],
    "emoji": [Language.L.emoji.door],
       "en": ["door"],
       "jp": ["扉", "戸"],
       "np": ["ढोका"]
  },
  "ear": {
       "cn": ["耳"],
    "emoji": [Language.L.emoji.ear],
       "en": ["ear", "ears"],
       "jp": ["耳"],
       "np": ["कान"]
  },
  "eye": {
       "cn": ["眼睛", "眼"],
    "emoji": [Language.L.emoji.eye],
       "en": ["eye", "eyes"],
       "jp": ["目"],
       "np": ["कान"]
  },
  "flowers": {
       "cn": ["花"],
    "emoji": [Language.L.emoji.flower],
       "en": ["flower", "flowers"],
       "jp": ["花"],
       "np": ["फूल", "फूलहरू"]
  },
  "grooming": {
       "cn": ["梳毛"],
    "emoji": [Language.L.emoji.shower],
       "en": ["groom", "grooming", "cleaning"],
       "jp": ["毛づくろい"],
       "np": ["फूलहरू"]
  },
  "grumpy": {
       "cn": ["牢骚满腹"],
    "emoji": [Language.L.emoji.grumpy],
       "en": ["grumpy", "grouchy"],
       "jp": ["ご機嫌ナナメ"],
       "np": ["नराम्रो"]
  },
  "hammock": {
       "cn": ["吊床"],
    "emoji": [Language.L.emoji.camping],
       "en": ["hammock"],
       "jp": ["ハンモック"],
       "np": ["ह्यामॉक"]
  },
  "home": {
       "cn": ["家"],
    "emoji": [Language.L.emoji.home],
       "en": ["home"],
       "jp": ["お家"],
       "np": ["घर"]
  },
  "in love": {
       "cn": ["热恋", "恋爱"],
    "emoji": [Language.L.emoji.hearts],
       "en": ["in love", "love"],
       "jp": ["恋"],
       "np": ["मायामा"]
  },
  "itchy": {
       "cn": ["挠痒", "抓痒"],
    "emoji": [Language.L.emoji.itch],
       "en": ["itchy", "scratchy"],
       "jp": ["カイカイ", "かゆい"],
       "np": ["खुजली"]
  },
  "jizo": {
       "cn": ["地藏菩萨"],
    "emoji": [Language.L.emoji.jizo],
       "en": ["jizo", "jizo statue", "statue"],
       "jp": ["お地蔵さん"],
       "np": ["मूर्ति"]
  },
  "keeper": {
       "cn": ["饲养员"],
    "emoji": [Language.L.emoji.weary],
       "en": ["keeper", "zookeeper"],
       "jp": ["飼育員"],
       "np": ["चिडियाखाना"]
  },
  "kiss": {
       "cn": ["接吻", "亲亲", "吻"],
    "emoji": [Language.L.emoji.kiss],
       "en": ["kissing", "kiss"],
       "jp": ["接吻", "せっぷん", "キス"],
       "np": ["चुम्बन"]
  },
  "laying down": {
       "cn": ["躺"],
    "emoji": [Language.L.emoji.bed],
       "en": ["lay down", "laying down"],
       "jp": ["寝そべっている"],
       "np": ["तल राख्नु"]
  },
  "lips": {
       "cn": ["唇"],
    "emoji": [Language.L.emoji.lips],
       "en": ["lips"],
       "jp": ["くちびる"],
       "np": ["ओठ"]
  },
  "long-tongue": {
       "cn": ["伸长舌头"],
    "emoji": [Language.L.emoji.tongue +
              Language.L.emoji.tongue],
       "en": ["long tongue", "long-tongue"],
       "jp": ["長い舌"],
       "np": ["लामो जीभ"]
  },
  "lunch time": {
       "cn": ["午餐时间"],
    "emoji": [Language.L.emoji.bento],
       "en": ["lunch time", "lunch"],
       "jp": ["ランチの時間"],
       "np": ["खाजा समय", "भोजन"]
  },
  "mofumofu": {
        "cn": ["软软"],
     "emoji": [Language.L.emoji.teddybear],
        "en": ["mofumofu", "fluffy", "punchy"],
        "jp": ["モフモフ"],
        "np": ["रमाईलो"]
  },
  "muzzle": {
        "cn": ["口鼻套"],
     "emoji": [Language.L.emoji.muzzle],
        "en": ["muzzle", "snout"],
        "jp": ["マズル"],
        "np": ["थूली", "थोरै"]
  },
  "night": {
        "cn": ["夜", "晚上"],
     "emoji": [Language.L.emoji.moon],
        "en": ["night"],
        "jp": ["夜"],
        "np": ["रात"]
  },
  "nose": {
        "cn": ["鼻子"],
     "emoji": [Language.L.emoji.nose],
        "en": ["nose", "snout"],
        "jp": ["鼻"],
        "np": ["नाक"]
  },
  "old": {
        "cn": ["老人"],
     "emoji": [Language.L.emoji.grandpa],
        "en": ["old"],
        "jp": ["シニアパンダさん", "年老いた"],
        "np": ["पुरानो"]
  },
  "panda bowl": {
        "cn": ["碗"],
     "emoji": [Language.L.emoji.panda + 
               Language.L.emoji.bowl],
        "en": ["panda bowl", "bowl"],
        "jp": ["エサ鉢"],
        "np": ["पोनिया कटोरा"]
  },
  "paws": {
        "cn": ["爪"],
     "emoji": [Language.L.emoji.paws],
        "en": ["paws", "feet"],
        "jp": ["足"],
        "np": ["पन्जा"]
  },
  "peek": {
        "cn": ["偷窥"],
     "emoji": [Language.L.emoji.monocle],
        "en": ["peek", "peeking"],
        "jp": ["チラ見"],
        "np": ["झिक्नु"]
  },
  "playing": {
        "cn": ["玩耍"],
     "emoji": [Language.L.emoji.playing],
        "en": ["playing", "play"],
        "jp": ["拝み食い", "両手食い"],
        "np": ["खेलिरहेको", "खेल्नु"]
  },
  "poop": {
        "cn": ["便便"],
     "emoji": [Language.L.emoji.poop],
        "en": ["poop"],
        "jp": [Language.L.emoji.poop],
        "np": [Language.L.emoji.poop]
  },
  "pooping": {
        "cn": ["便便"],
     "emoji": [Language.L.emoji.panda +
               Language.L.emoji.poop],
        "en": ["pooping"],
        "jp": ["💩している"],
        "np": [Language.L.emoji.panda +
               Language.L.emoji.poop]
  },
  "portrait": {
        "cn": ["肖像"],
     "emoji": [Language.L.emoji.portrait],
        "en": ["portrait"],
        "jp": ["顔写真"],
        "np": ["चित्र"]
  },
  "praying": {
        "cn": ["祈祷"],
     "emoji": [Language.L.emoji.pray],
        "en": ["praying", "pray"],
        "jp": ["お祈りしている"],
        "np": ["प्रार्थना गर्दै", "प्रार्थना"]
  },
  "profile": {
        "cn": ["资料"],
     "emoji": [Language.L.emoji.profile],
        "en": ["profile"],
        "jp": ["プロフィール画像"],
        "np": ["प्रोफाइल"]
  },
  "pull-up": {
        "cn": ["引体向上"],
     "emoji": [Language.L.emoji.weight],
        "en": ["pull-up", "pull-ups", "pullup"],
        "jp": ["鉄棒", "懸垂"],
        "np": ["तान्नु"]
  },
  "pumpkin": {
        "cn": ["南瓜"],
     "emoji": [Language.L.emoji.pumpkin],
        "en": ["pumpkin", "halloween"],
        "jp": ["かぼちゃ", "南瓜"],
        "np": ["कद्दू", "हेलोवीन"]
  },
  "reiwa": {
        "cn": ["令和"],
     "emoji": [Language.L.emoji.reiwa],
        "en": ["reiwa"],
        "jp": ["令和"],
        "np": [Language.L.emoji.reiwa]
  },
  "scale": {
        "cn": ["测体重"],
     "emoji": [Language.L.emoji.scale],
        "en": ["scale", "weigh-in", "weight"],
        "jp": ["体重計", "たいじゅうけい"],
        "np": ["स्केल", "तौल"]
  },
  "shake": {
        "cn": ["摇晃"],
     "emoji": [Language.L.emoji.cyclone],
        "en": ["shake", "shaking"],
        "jp": ["ドリパン", "ブルブル", "ゆらゆら"],
        "np": ["हल्लाउनु"]
  },
  "shedding": {
        "cn": ["换毛"],
     "emoji": [Language.L.emoji.worry],
        "en": ["shedding", "changing fur", "losing fur", "losing hair"],
        "jp": ["換毛", "泣いている"],
        "np": ["सुस्त"]
  },
  "shoots": {
        "cn": ["竹笋"],
     "emoji": [Language.L.emoji.bamboo],
        "en": ["shoots", "shoot"],
        "jp": ["竹の子", "たけのこ"],
        "np": ["बाँस को टुप्पो"]
  },
  "siblings": {
        "cn": ["同胞"],
     "emoji": [Language.L.emoji.siblings],
        "en": ["siblings"],
        "jp": ["兄弟", "きょうだい"],
        "np": ["भाइबहिनीहरू"]
  },
  "sisters": {
        "cn": ["姐妹"],
     "emoji": [Language.L.emoji.sisters],
        "en": ["sisters"],
        "jp": ["姉妹"],
        "np": ["बहिनीहरू"]
  },
  "sleeping": {
        "cn": ["睡觉"],
     "emoji": [Language.L.emoji.sleeping],
        "en": ["sleeping", "sleep", "asleep"],
        "jp": ["寝ている"],
        "np": ["सुत्नु", "निद्रा"]
  },
  "slobber": {
        "cn": ["口水", "流口水"],
     "emoji": [Language.L.emoji.slobber],
        "en": ["slobber", "slobbering"],
        "jp": ["よだれをたらしている"],
        "np": ["स्लोबर"]
  },
  "smile": {
        "cn": ["笑", "微笑"],
     "emoji": [Language.L.emoji.smile],
        "en": ["smile", "smiling"],
        "jp": ["スマイル"],
        "np": ["हाँसो"]
  },
  "snow": {
        "cn": ["雪"],
     "emoji": [Language.L.emoji.snow],
        "en": ["snow"],
        "jp": ["雪"],
        "np": ["हिउँ"]
  },
  "spider": {
        "cn": ["蜘蛛"],
     "emoji": [Language.L.emoji.spider],
        "en": ["spider", "spider-bear", "spider bear"],
        "jp": ["スパイダー"],
        "np": ["माकुरो", "माकुरो भालु"]
  },
  "standing": {
        "cn": ["站立"],
     "emoji": [Language.L.emoji.no_emoji],
        "en": ["standing", "stand"],
        "jp": ["立っている"],
        "np": ["खडा"]
  },
  "stretching": {
        "cn": ["拉伸"],
     "emoji": [Language.L.emoji.no_emoji],
        "en": ["stretching", "stretch"],
        "jp": ["ストレッチしている"],
        "np": ["तन्नु", "तान्न"]
  },
  "surprise": {
        "cn": ["惊喜"],
     "emoji": [Language.L.emoji.fireworks],
        "en": ["surprise", "surprised"],
        "jp": ["びっくり"],
        "np": ["अचम्म"]
  },
  "tail": {
        "cn": ["尾巴"],
     "emoji": [Language.L.emoji.snake],
        "en": ["tail"],
        "jp": ["しっぽ"],
        "np": ["पुच्छर"]
  },
  "techitechi": {
        "cn": ["目标"],
     "emoji": [Language.L.emoji.target],
        "en": ["techitechi", "spot", "cute spot"],
        "jp": ["テチテチ"],
        "np": ["राम्रो स्थान"]
  },
  "tongue": {
        "cn": ["舌"],
     "emoji": [Language.L.emoji.tongue],
        "en": ["tongue"],
        "jp": ["べろ"],
        "np": ["जिब्रो"]
  },
  "toys": {
        "cn": ["玩具"],
     "emoji": [Language.L.emoji.football],
        "en": ["toy", "toys"],
        "jp": ["遊具", "おもちゃ", "おもちゃ"],
        "np": ["खेलौना"]
  },
  "tree": {
        "cn": ["树"],
     "emoji": [Language.L.emoji.tree],
        "en": ["tree", "trees"],
        "jp": ["木"],
        "np": ["रूख"]
  },
  "upside-down": {
        "cn": ["翻转"],
     "emoji": [Language.L.emoji.upside_down],
        "en": ["upside-down", "upside down"],
        "jp": ["逆さま"],
        "np": ["तलको माथि"]
  },
  "wink": {
        "cn": ["眨眼"],
     "emoji": [Language.L.emoji.wink],
        "en": ["wink", "winking"],
        "jp": ["ウィンク"],
        "np": ["आखा भ्किम्काउनु"]
  },
  "wet": {
        "cn": ["湿"],
     "emoji": [Language.L.emoji.raincloud],
        "en": ["wet"],
        "jp": ["濡れた"],
        "np": ["भिजेको"]
  },
  "white face": {
        "cn": ["浅色的脸"],
     "emoji": [Language.L.emoji.no_emoji],
        "en": ["white face", "light face"],
        "jp": ["色白さん", "しろめん", "白面", "白めん"],
        "np": ["सेतो अनुहार"]
  },
  "window": {
        "cn": ["窗"],
     "emoji": [Language.L.emoji.window],
        "en": ["window"],
        "jp": ["窓", "まど"],
        "np": ["विन्डो"]
  },
  "yawn": {
        "cn": ["哈欠", "呵欠"],
     "emoji": [Language.L.emoji.yawn],
        "en": ["yawn", "yawning"],
        "jp": ["あくび"],
        "np": ["जांभई"]
  }
}

/*
   Language selection functions
*/
// Map a browser specified language to one of our supported options.
Language.L.defaultDisplayLanguage = function() {
  // Read language settings from browser's Accept-Language header
  Object.keys(Pandas.def.languages).forEach(function(option) {
    if ((navigator.languages.indexOf(option) != -1) &&
        (this.display == undefined)) {
      this.display = Pandas.def.languages[option];
    }
  });
  // Read language cookie if it's there
  var test = this.storage.getItem("language");
  if (test != null) {
    if (Object.values(Pandas.def.languages).indexOf(test) != -1) {
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
    Language.L.gui.flag["cn"] = Language.L.flags["Taiwan"];        
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
  var source_range = Pandas.def.ranges['jp'][1];   // Hiragana range regex
  var test = source_range.test(input);
  if (test == false) {
    return input;
  } else {
    var output = "";
    for (let char of input) {
      var index = Language.charset["jp"].hiragana.indexOf(char); 
      if (index > -1) { 
        var swap = Language.charset["jp"].katakana[index];
        output += swap;
      } else {
        output += char;
      }
    }
  }
  return output;
}

Language.katakanaToHiragana = function(input) {
  var source_range = Pandas.def.ranges['jp'][2];   // Katakana range regex
  var test = source_range.test(input);
  if (test == false) {
    return input;
  } else {
    var output = "";
    for (let char of input) {
      var index = Language.charset["jp"].katakana.indexOf(char); 
      if (index > -1) { 
        var swap = Language.charset["jp"].hiragana[index];
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
  var obj_langs = order.concat(Object.values(Pandas.def.languages));  // Dupes not important
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
  var lang_values = Object.values(Pandas.def.languages).concat("emoji");
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
    var range = Pandas.def.ranges['jp'][1];
    return range.test(input);   // True if any characters match the hiragana range
  }
  if (test_name == "Katakana") {
    var range = Pandas.def.ranges['jp'][2];
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
  } else {
    return pieces;
  }
}
