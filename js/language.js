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
  return language;
}

/*
   Language elements translatable in the GUI
*/
// Character translation tables per language. Just hiragana/katakana
Language.L.charset = {
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
                   "ん"],
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
       "ヤ",		   "ユ",		  "ヨ",
       "ラ", "リ", "ル", "レ", "ロ",
       "ワ", "ヰ",       "ヱ", "ヲ",
                   "ン"]
  }
}

// Default parameters for entities that lack language information
Language.L.default = {
  "order": ["en", "jp"]
}

// TODO: do we need localized emojis for various things?
Language.L.emoji = {
        "animal": "🐼",
         "alien": "👽",
         "apple": "🍎",
         "arrow": "➡",
        "author": "✍️",
        "autumn": "🍂",
           "bed": "🛌",
      "birthday": "🎂",
        "bamboo": "🎍",
          "baby": "👶🏻",
         "bento": "🍱",
         "blink": "😑",
          "born": "👼",
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
          "girl": "👧🏻",
       "grandpa": "👴",
        "grumpy": "😠",
        "hearts": "💕",
          "home": "🏡",
          "itch": "🐜",
          "jizo": "🗿",
          "kiss": "💋",
      "language": "‍👁️‍🗨️",
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
         "panda": "🐼",
          "paws": "🐾",
       "playing": "🃏",
          "poop": "💩",
      "portrait": "🖼️",
          "pray": "🙏",
       "profile": "💟",
       "pumpkin": "🎃",
        "random": "🎲",
     "raincloud": "🌧️",
       "refresh": "🔄",
         "reiwa": "🏵️",
         "scale": "⚖️",
        "search": "🔍",
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
         "story": "🎍",
        "target": "🎯",
     "teddybear": "🧸",
         "tooth": "🦷",
           "top": "⬆",
        "tongue": "👅",
       "tornado": "🌪️",
        "travel": "✈️",
          "tree": "🌳",
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
     "Bhutan": "🇧🇹",
     "Canada": "🇨🇦",
      "Chile": "🇨🇱",
      "China": "🇨🇳",
    "Default": "🐼",
    "Denmark": "🇩🇰",
     "France": "🇫🇷",
    "Germany": "🇩🇪",
  "Hong Kong": "🇭🇰",
    "Hungary": "🇭🇺",
    "Ireland": "🇮🇪",
      "India": "🇮🇳",
      "Japan": "🇯🇵",
     "Mexico": "🇲🇽",
      "Nepal": "🇳🇵",
"Netherlands": "🇳🇱",
     "Poland": "🇵🇱",
     "Russia": "🇷🇺",
   "Slovakia": "🇸🇰",
"South Korea": "🇰🇷",
      "Spain": "🇪🇸",
     "Taiwan": "🇹🇼",
   "Thailand": "🇹🇭",
         "UK": "🇬🇧",
        "USA": "🇺🇸"
}

Language.L.gui = {
  "about": {
    "cn": "关于",
    "en": "About",
    "jp": "概要"
  },
  "autumn": {
    "cn": "秋",
    "en": "Autumn",
    "jp": "秋"
  },
  "children": {
    "cn": Pandas.def.relations.children["cn"],
    "en": "Children",   // Capitalization
    "jp": Pandas.def.relations.children["jp"]
  },
  "contribute": {
    "cn": "上传照片",
    "en": "Submit a Photo",
    "jp": "写真を提出する"
  },
  "contribute_link": {
    "en": "https://docs.google.com/forms/d/1kKBv92o09wFIBFcvooYLm2cG8XksGcVQQSiu9SpHGf0",
    "jp": "https://docs.google.com/forms/d/1wEhwNieyonPNSk6q8fflUT3e4kyAsIlAFmeib1tW4Jk"
  },
  "fall": {
    "cn": "秋",   // Convenience duplicate of autumn
    "en": "Autumn",
    "jp": "秋"
  },
  "family": {
    "cn": "家族",
    "en": "Family",
    "jp": "ファミリ"
  },
  "father": {
    "cn": "父亲",
    "en": "Father",
    "jp": "父"
  },
  "flag": {
    "cn": Language.L.flags["China"],
    "en": Language.L.flags["USA"],
    "es": Language.L.flags["Spain"],
    "jp": Language.L.flags["Japan"]
  },
  "footerLink": {
    "cn": "Red Panda Lineage",
    "en": "Red Panda Lineage",
    "jp": "Red Panda Lineage"
  },
  "home": {
    "cn": "主页",
    "en": "Home",
    "es": "Home",
    "jp": "ホーム"
  },
  "instagramLinks_body": {
    "cn": "",
    "en": "Without all the dedicated and loving Instagram red panda fans I " +
          "know, this site would not exist. Thank you so much!",
    "jp": ""
  },
  "instagramLinks_button": {
    "cn": "TOWRITE",
    "en": "Instagram",
    "jp": "インスタグラム"
  },
  "instagramLinks_header": {
    "cn": "Instagram 小熊猫",
    "en": "Red Pandas on Instagram",
    "jp": "Instagram レッサーパンダ"
  },
  "language": {
    "cn": {
      "cn": "汉语",
      "en": "英语",
      "es": "西班牙语",
      "jp": "日语",
      "kr": "朝鮮语",
      "ru": "俄语"
    },
    "en": {
      "cn": "Chinese",
      "en": "English",
      "es": "Spanish",
      "jp": "Japanese",
      "kr": "Korean",
      "ru": "Russian"
    },
    "es": {
      "cn": "Chino",
      "en": "Ingles",
      "es": "Español",
      "jp": "Japonés",
      "kr": "Coreano",
      "ru": "Ruso"
    },
    "jp": {
      "cn": "中国語",
      "en": "英語",
      "es": "スペイン語",
      "jp": "日本語",
      "kr": "韓国語",
      "ru": "ロシア語"
    },
    "ru": {
      "cn": "китайский",
      "en": "английский",
      "es": "испанский",
      "jp": "японский",
      "kr": "корейский",
      "ru": "русский"
    }
  },
  "loading": {
    "cn": "加载中...",
    "en": "Loading...",
    "jp": "ローディング"
  },
  "litter": {
    "cn": Pandas.def.relations.litter["cn"],
    "en": "Litter",   // Capitalization
    "jp": Pandas.def.relations.litter["jp"]
  },
  "links": {
    "cn": "链接",
    "en": "Links",
    "jp": "リンク"
  },
  "me": {
    "cn": "我",
    "en": "Me",
    "jp": "私"
  },
  "media": {
    "cn": "媒体",
    "en": "Media",
    "jp": "メディア"
  },
  "mother": {
    "cn": "母亲",
    "en": "Mother",
    "jp": "母"
  },
  "nicknames": {
    "cn": "昵称",
    "en": "Nicknames",
    "jp": "ニックネーム"
  },
  "othernames": {
    "cn": "其他名称",
    "en": "Other Names",
    "jp": "他の名前"
  },
  "parents": {
    "cn": Pandas.def.relations.parents["cn"],
    "en": "Parents",   // Capitalization
    "jp": Pandas.def.relations.parents["jp"]
  },
  "profile": {
    "cn": "档案",
    "en": "Profile",
    "jp": "プロフィール"
  },
  "quadruplet": {
    "cn": "四胞胎",
    "en": "Quadruplet",
    "jp": "四つ子"
  },
  "random": {
    "cn": "随机",
    "en": "Random",
    "jp": "適当"
  },
  "redPandaCommunity_body": {
    "cn": "",
    "en": "",
    "jp": ""
  },
  "redPandaCommunity_button": {
    "cn": "社区",
    "en": "Community",
    "jp": "共同体"
  },
  "redPandaCommunity_header": {
    "cn": "小熊猫社区",
    "en": "Red Panda Community",
    "jp": "レッサーパンダの共同体"
  },
  "refresh": {
    "cn": "重装",
    "en": "Refresh",
    "jp": "リロード"
  },
  "search": {
    "cn": "搜索...",
    "en": "Search...",
    "jp": "サーチ..."
  },
  "seen_date": {
    "cn": "目击日期 <INSERTDATE>",
    "en": "Seen <INSERTDATE>",
    "jp": "TOWRITE <INSERTDATE>"
  },
  "siblings": {
    "cn": Pandas.def.relations.siblings["cn"],
    "en": "Siblings",   // Capitalization
    "jp": Pandas.def.relations.siblings["jp"]
  },
  "since_date": {
    "cn": "自 <INSERTDATE>",
    "en": "Since <INSERTDATE>",
    "jp": "<INSERTDATE>から"
  },
  "specialThanksLinks_body": {
    "cn": "",
    "en": "",
    "jp": ""
  },
  "specialThanksLinks_button": {
    "cn": "TOWRITE",
    "en": "Special Thanks",
    "jp": "感佩"
  },
  "specialThanksLinks_header": {
    "cn": "TOWRITE",
    "en": "Special Thanks",
    "jp": "感佩"
  },
  "spring": {
    "cn": "春",
    "en": "Spring",
    "jp": "TOWRITE"
  },
  "summer": {
    "cn": "夏",
    "en": "Summer",
    "jp": "TOWRITE"
  },
  "title": {
    "cn": "查找小熊猫",
    "en": "Red Panda Finder",
    "jp": "レッサーパンダのファインダー"
  },
  "top": {
    "cn": "顶部",
    "en": "Top",
    "jp": "上"
  },
  "tree": {
    "cn": "树",
    "en": "Tree",
    "jp": "木"
  },
  "twin": {
    "cn": "双胞胎",
    "en": "Twin",
    "jp": "双子"
  },
  "triplet": {
    "cn": "三胞胎",
    "en": "Triplet",
    "jp": "三つ子"
  },
  "winter": {
    "cn": "冬",
    "en": "Winter",
    "jp": "冬"
  },
  "zooLinks_body": {
    "cn": "",
    "en": "While many zoos are represented in this dataset, some of them are " +
          "hotspots for seeing Red Pandas.",
    "jp": ""
  },
  "zooLinks_button": {
    "cn": "动物园",
    "en": "Zoos",
    "jp": "動物園"
  },
  "zooLinks_header": {
    "cn": "小熊猫动物园",
    "en": "Major Red Panda Zoos",
    "jp": "レッサーパンダの動物園"
  }
}

Language.L.messages = {
  "and": {
    "cn": "和",
    "en": " & ",
    "jp": "と"
  },
  "credit": {
    "cn": [Language.L.emoji.gift + " ",
           "<INSERTUSER>",
           " 提供了 ",
           "<INSERTNUMBER>",
           " 张照片。"],
    "en": [Language.L.emoji.gift + " ",
           "<INSERTUSER>",
           " has contributed ",
           "<INSERTNUMBER>",
           " photos."],
    "jp": [Language.L.emoji.gift + " ",
           "<INSERTUSER>",
           "は",
           "<INSERTNUMBER>",
           "枚の写真を寄稿しました。"]
  },
  "comma": {
    "cn": "及",
    "en": ", ",
    "jp": "と"
  },
  "footer": {
    "cn": ["TOWRITE"],
    "en": ["All information courtesy of the ",
           "<INSERTLINK>",
           " and red panda fans worldwide. ",
          "Any media linked from this dataset remains property of its creator. ",
          "Layout and design © 2019 Justin Fairchild."],
    "jp": ["<INSERTLINK>", 
           "、世界中のレッサーパンダファンのすべての情報提供。",
           "このデータセットからリンクされたメディアはすべて、作成者の所有物です。",
           "設計©2019 Justin Fairchild"]
  },
  "happy_birthday": {
    "cn": ["TOWRITE"],
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
           "歳）"]
  },
  "landing_mothersday": {
    "cn": ["TOWRITE"],
    "en": ["Happy Mother's Day!"],
    "jp": ["母の日おめでとう"]
  },
  "no_result": {
    "cn": ["沒有發現熊貓"],
    "en": ["No Pandas Found"],
    "jp": ["パンダが見つかりません"]
  },
  "no_subject_tag_result": {
    "cn": ["TOWRITE"],
    "en": ["No Tagged Photos"],
    "jp": ["このパンダのタグ付けされた写真はありません"]
  },
  "overflow": {
    "cn": ["TOWRITE"],
    "en": [" Only ",
           "<INSERTLIMIT>",
           " shown."],
    "jp": ["<INSERTLIMIT>",
           "を表示中"]
  },
  "profile_babies": {
    "cn": ["TOWRITE"],
    "en": ["<INSERTNAME>",
           " has ",
           "<INSERTBABIES>",
           " children."],
    "jp": ["<INSERTNAME>",
           "の子供",
           "<INSERTBABIES>",
           "人"]
  },
  "profile_brothers": {
    "cn": ["TOWRITE"],
    "en": ["<INSERTNAME>",
           " has ",
           "<INSERTBROTHERS>",
           " brothers."],
    "jp": ["<INSERTNAME>",
           "には",
           "<INSERTBROTHERS>",
           "人の兄弟がいます"]
  },
  "profile_brothers_babies": {
    "cn": ["TOWRITE"],
    "en": ["<INSERTNAME>",
           " has ",
           "<INSERTSISTERS>",
           " brothers and ",
           "<INSERTBABIES>",
           " newborns."],
    "jp": ["<INSERTNAME>",
           "には",
           "<INSERTBROTHERS>",
           "人の兄弟と",
           "<INSERTBABIES>",
           "人の赤ちゃんの兄弟がいます"]
  },
  "profile_children": {
    "cn": ["TOWRITE"],
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
           "人の男の子"]
  },
  "profile_children_babies": {
    "cn": ["TOWRITE"],
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
           "人の子供"]
  },
  "profile_daughters": {
    "cn": ["TOWRITE"],
    "en": ["<INSERTNAME>",
           " has ",
           "<INSERTDAUGHTERS>",
           " daughters."],
    "jp": ["<INSERTNAME>",
           "には",
           "<INSERTDAUGHTERS>",
           "人の娘がいます"]
  },
  "profile_daughters_babies": {
    "cn": ["TOWRITE"],
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
           "人の子供がいます"]
  },
  "profile_family": {
    "cn": ["TOWRITE"],
    "en": ["<INSERTNAME>",
           "'s Immediate Family"],
    "jp": ["<INSERTNAME>",
           "の直近の家族"]
  },
  "profile_sisters": {
    "cn": ["TOWRITE"],
    "en": ["<INSERTNAME>",
           " has ",
           "<INSERTSISTERS>",
           " sisters."],
    "jp": ["<INSERTNAME>",
           "には",
           "<INSERTSISTERS>",
           "の姉妹がいます"]
  },
  "profile_sisters_babies": {
    "cn": ["TOWRITE"],
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
           "人の赤ちゃんの兄弟がいます"]
  },
  "profile_siblings": {
    "cn": ["TOWRITE"],
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
           "人の兄弟"]
  },
  "profile_siblings_babies": {
    "cn": ["TOWRITE"],
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
           "人の赤ちゃんの兄弟"]
  },
  "profile_sons": {
    "cn": ["TOWRITE"],
    "en": ["<INSERTNAME>",
           " has ",
           "<INSERTSONS>",
           " sons."],
    "jp": ["<INSERTNAME>",
           "の息子は",
           "<INSERTSONS>",
           "人です"]
  },
  "profile_sons_babies": {
    "cn": ["TOWRITE"],
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
           "人の子供がいます"]
  },
  "profile_where": {
    "cn": ["TOWRITE"],
    "en": ["Where has ",
           "<INSERTNAME>",
           " lived?"],
    "jp": ["<INSERTNAME>",
           "はどこに住んでいましたか？"]
  },
  "tag_subject": {
    "cn": ["TOWRITE"],
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
           "。"]
  }
}

// Search tag translations for searching photos by metadata.
// Limit to 100 photos returned by default, but they don't 
// have to be the same 100 returned each time.
// TODO: duplicate tag management (baby)
// TODO: romanji for japanese terms
Language.L.tags = {
  "air tasting": {
       "cn": ["TOWRITE"],
    "emoji": [Language.L.emoji.tongue + 
              Language.L.emoji.butterfly],
       "en": ["air tasting", 
              "air taste"],
       "jp": ["舌ヒラヒラ"]
  },
  "apple time": {
       "cn": ["TOWRITE"],
    "emoji": [Language.L.emoji.apple],
       "en": ["apple time", "apple"],
       "jp": ["りんごタイム", "りんご"]
  },
  "autumn": {
       "cn": ["TOWRITE"],
    "emoji": [Language.L.emoji.autumn],
       "en": ["autumn", "fall"],
       "jp": ["秋"]
  },
  "bamboo": {
       "cn": ["TOWRITE"],
    "emoji": [Language.L.emoji.bamboo],
       "en": ["bamboo"],
       "jp": ["笹", "竹"]
  },
  "bear worm": {
       "cn": ["TOWRITE"],
    "emoji": [Language.L.emoji.caterpillar],
       "en": ["bear worm"],
       "jp": ["のびのび"]
  },
  "bite": {
       "cn": ["TOWRITE"],
    "emoji": [Language.L.emoji.tooth],
       "en": ["bite"],
       "jp": ["一口"]
  },
  "blink": {
       "cn": ["TOWRITE"],
    "emoji": [Language.L.emoji.blink],
       "en": ["blink", "blinking"],
       "jp": ["まばたき"]
  },
  "bridge": {
       "cn": ["TOWRITE"],
    "emoji": [Language.L.emoji.bridge],
       "en": ["bridge"],
       "jp": ["吊り橋・渡し木", "架け橋"]
  },
  "brothers": {
       "cn": ["TOWRITE"],
    "emoji": [Language.L.emoji.brothers],
       "en": ["brothers", "bros"],
       "jp": ["男兄弟"]
  },
  "carry": {
       "cn": ["TOWRITE"],
    "emoji": [Language.L.emoji.carry],
       "en": ["carry", "holding"],
       "jp": ["笹運び", "枝運び", "運ぶ"]
  },
  "cherry blossoms": {
       "cn": ["TOWRITE"],
    "emoji": [Language.L.emoji.cherry_blossom],
       "en": ["cherry blossoms", "cherry blossom"],
       "jp": ["桜"]
  },
  "climb": {
       "cn": ["TOWRITE"],
    "emoji": [Language.L.emoji.climb],
       "en": ["climb", "climbing"],
       "jp": ["木登り", "登る"]
  },
  "couple": {
       "cn": ["TOWRITE"],
    "emoji": [Language.L.emoji.couple],
       "en": ["couple", "partners"],
       "jp": ["カップル", "夫婦", "ふうふ"]
  },
  "destruction": {
       "cn": ["TOWRITE"],
    "emoji": [Language.L.emoji.tornado],
       "en": ["chaos", "destruction", "mess"],
       "jp": ["破壊"]
  },
  "dig": {
       "cn": ["TOWRITE"],
    "emoji": [Language.L.emoji.dig],
       "en": ["dig", "digging", "digs"],
       "jp": ["穴掘り"]
  },
  "dish": {
       "cn": ["TOWRITE"],
    "emoji": [Language.L.emoji.dish],
       "en": ["dish", "plate"],
       "jp": ["ごはん"]
  },
  "door": {
       "cn": ["TOWRITE"],
    "emoji": [Language.L.emoji.door],
       "en": ["door"],
       "jp": ["扉", "戸"]
  },
  "ear": {
       "cn": ["TOWRITE"],
    "emoji": [Language.L.emoji.ear],
       "en": ["ear", "ears"],
       "jp": ["耳"]
  },
  "eye": {
       "cn": ["TOWRITE"],
    "emoji": [Language.L.emoji.eye],
       "en": ["eye", "eyes"],
       "jp": ["目"]
  },
  "flowers": {
       "cn": ["TOWRITE"],
    "emoji": [Language.L.emoji.flower],
       "en": ["flower", "flowers"],
       "jp": ["花"]
  },
  "grooming": {
       "cn": ["TOWRITE"],
    "emoji": [Language.L.emoji.shower],
       "en": ["groom", "grooming", "cleaning"],
       "jp": ["毛づくろい"]
  },
  "grumpy": {
       "cn": ["TOWRITE"],
    "emoji": [Language.L.emoji.grumpy],
       "en": ["grumpy", "grouchy"],
       "jp": ["ご機嫌ナナメ"]
  },
  "hammock": {
       "cn": ["TOWRITE"],
    "emoji": [Language.L.emoji.camping],
       "en": ["hammock"],
       "jp": ["ハンモック"]
  },
  "home": {
       "cn": ["TOWRITE"],
    "emoji": [Language.L.emoji.home],
       "en": ["home"],
       "jp": ["お家"]
  },
  "in love": {
       "cn": ["TOWRITE"],
    "emoji": [Language.L.emoji.hearts],
       "en": ["in love", "love"],
       "jp": ["恋"]
  },
  "itchy": {
       "cn": ["TOWRITE"],
    "emoji": [Language.L.emoji.itch],
       "en": ["itchy", "scratchy"],
       "jp": ["カイカイ", "かゆい"]
  },
  "jizo": {
       "cn": ["TOWRITE"],
    "emoji": [Language.L.emoji.jizo],
       "en": ["jizo", "jizo statue"],
       "jp": ["お地蔵さん"]
  },
  "keeper": {
       "cn": ["TOWRITE"],
    "emoji": [Language.L.emoji.weary],
       "en": ["keeper", "zookeeper"],
       "jp": ["飼育員"]
  },
  "kiss": {
       "cn": ["TOWRITE"],
    "emoji": [Language.L.emoji.kiss],
       "en": ["kissing", "kiss"],
       "jp": ["接吻", "せっぷん", "キス"]
  },
  "laying down": {
       "cn": ["TOWRITE"],
    "emoji": [Language.L.emoji.bed],
       "en": ["lay down", "laying down"],
       "jp": ["寝そべっている"]
  },
  "lips": {
       "cn": ["TOWRITE"],
    "emoji": [Language.L.emoji.lips],
       "en": ["lips"],
       "jp": ["くちびる"]
  },
  "long-tongue": {
       "cn": ["TOWRITE"],
    "emoji": [Language.L.emoji.tongue +
              Language.L.emoji.tongue],
       "en": ["long tongue", "long-tongue"],
       "jp": ["長い舌"]
  },
  "lunch time": {
       "cn": ["TOWRITE"],
    "emoji": [Language.L.emoji.bento],
       "en": ["lunch time", "lunch"],
       "jp": ["ランチの時間"]
  },
  "mofumofu": {
        "cn": ["TOWRITE"],
     "emoji": [Language.L.emoji.teddybear],
        "en": ["mofumofu"],
        "jp": ["モフモフ"]
  },
  "muzzle": {
        "cn": ["TOWRITE"],
     "emoji": [Language.L.emoji.muzzle],
        "en": ["muzzle", "snout"],
        "jp": ["マズル"]
  },
  "night": {
        "cn": ["TOWRITE"],
     "emoji": [Language.L.emoji.moon],
        "en": ["night"],
        "jp": ["夜"]
  },
  "nose": {
        "cn": ["TOWRITE"],
     "emoji": [Language.L.emoji.nose],
        "en": ["nose", "snout"],
        "jp": ["鼻"]
  },
  "old": {
        "cn": ["TOWRITE"],
     "emoji": [Language.L.emoji.grandpa],
        "en": ["old"],
        "jp": ["シニアパンダさん", "年老いた"]
  },
  "panda bowl": {
        "cn": ["TOWRITE"],
     "emoji": [Language.L.emoji.panda + 
               Language.L.emoji.bowl],
        "en": ["panda bowl", "bowl"],
        "jp": ["エサ鉢"]
  },
  "paws": {
        "cn": ["TOWRITE"],
     "emoji": [Language.L.emoji.paws],
        "en": ["paws", "feet"],
        "jp": ["足"]
  },
  "peek": {
        "cn": ["TOWRITE"],
     "emoji": [Language.L.emoji.monocle],
        "en": ["peek", "peeking"],
        "jp": ["チラ見"]
  },
  "playing": {
        "cn": ["TOWRITE"],
     "emoji": [Language.L.emoji.playing],
        "en": ["playing", "play"],
        "jp": ["拝み食い", "両手食い"]
  },
  "poop": {
        "cn": ["TOWRITE"],
     "emoji": [Language.L.emoji.poop],
        "en": ["poop"],
        "jp": [Language.L.emoji.poop]
  },
  "pooping": {
        "cn": ["TOWRITE"],
     "emoji": [Language.L.emoji.panda +
               Language.L.emoji.poop],
        "en": ["pooping"],
        "jp": ["💩している"]
  },
  "portrait": {
        "cn": ["TOWRITE"],
     "emoji": [Language.L.emoji.portrait],
        "en": ["portrait"],
        "jp": ["顔写真"] 
  },
  "praying": {
        "cn": ["TOWRITE"],
     "emoji": [Language.L.emoji.pray],
        "en": ["praying", "pray"],
        "jp": ["お祈りしている"]
  },
  "profile": {
        "cn": ["TOWRITE"],
     "emoji": [Language.L.emoji.profile],
        "en": ["profile"],
        "jp": ["プロフィール画像"]
  },
  "pull-up": {
        "cn": ["TOWRITE"],
     "emoji": [Language.L.emoji.weight],
        "en": ["pull-up", "pull-ups", "pullup"],
        "jp": ["鉄棒", "懸垂"]
  },
  "pumpkin": {
        "cn": ["TOWRITE"],
     "emoji": [Language.L.emoji.pumpkin],
        "en": ["pumpkin", "halloween"],
        "jp": ["かぼちゃ", "南瓜"]
  },
  "reiwa": {
        "cn": ["TOWRITE"],
     "emoji": [Language.L.emoji.reiwa],
        "en": ["reiwa"],
        "jp": ["令和"]
  },
  "scale": {
        "cn": ["TOWRITE"],
     "emoji": [Language.L.emoji.scale],
        "en": ["scale", "weigh-in", "weight"],
        "jp": ["体重計", "たいじゅうけい"]
  },
  "shake": {
        "cn": ["TOWRITE"],
     "emoji": [Language.L.emoji.cyclone],
        "en": ["shake", "shaking"],
        "jp": ["ドリパン", "ブルブル", "ゆらゆら"]
  },
  "shedding": {
        "cn": ["TOWRITE"],
     "emoji": [Language.L.emoji.worry],
        "en": ["shedding", "changing fur", "losing fur", "losing hair"],
        "jp": ["換毛", "泣いている"]
  },
  "shoots": {
        "cn": ["TOWRITE"],
     "emoji": [Language.L.emoji.bamboo],
        "en": ["shoots", "shoot"],
        "jp": ["竹の子", "たけのこ"]
  },
  "siblings": {
        "cn": ["TOWRITE"],
     "emoji": [Language.L.emoji.siblings],
        "en": ["siblings"],
        "jp": ["兄弟", "きょうだい"]
  },
  "sisters": {
        "cn": ["TOWRITE"],
     "emoji": [Language.L.emoji.sisters],
        "en": ["sisters"],
        "jp": ["姉妹"]
  },
  "sleeping": {
        "cn": ["TOWRITE"],
     "emoji": [Language.L.emoji.sleeping],
        "en": ["sleeping", "sleep", "asleep"],
        "jp": ["寝ている"]
  },
  "slobber": {
        "cn": ["TOWRITE"],
     "emoji": [Language.L.emoji.slobber],
        "en": ["slobber", "slobbering"],
        "jp": ["よだれをたらしている"]
  },
  "smile": {
        "cn": ["TOWRITE"],
     "emoji": [Language.L.emoji.smile],
        "en": ["smile", "smiling"],
        "jp": ["スマイル"]
  },
  "snow": {
        "cn": ["TOWRITE"],
     "emoji": [Language.L.emoji.snow],
        "en": ["snow"],
        "jp": ["雪"]
  },
  "spider": {
        "cn": ["TOWRITE"],
     "emoji": [Language.L.emoji.spider],
        "en": ["spider", "spider-bear", "spider bear"],
        "jp": ["スパイダー"]
  },
  "standing": {
        "cn": ["TOWRITE"],
     "emoji": [Language.L.emoji.no_emoji],
        "en": ["standing", "stand"],
        "jp": ["立っている"]
  },
  "stretching": {
        "cn": ["TOWRITE"],
     "emoji": [Language.L.emoji.no_emoji],
        "en": ["stretching", "stretch"],
        "jp": ["ストレッチしている"]
  },
  "surprise": {
        "cn": ["TOWRITE"],
     "emoji": [Language.L.emoji.fireworks],
        "en": ["surprise", "surprised"],
        "jp": ["びっくり"]
  },
  "tail": {
        "cn": ["TOWRITE"],
     "emoji": [Language.L.emoji.snake],
        "en": ["tail"],
        "jp": ["しっぽ"]
  },
  "techitechi": {
        "cn": ["TOWRITE"],
     "emoji": [Language.L.emoji.target],
        "en": ["techitechi"],
        "jp": ["テチテチ"]
  },
  "tongue": {
        "cn": ["TOWRITE"],
     "emoji": [Language.L.emoji.tongue],
        "en": ["tongue"],
        "jp": ["べろ"]
  },
  "toys": {
        "cn": ["TOWRITE"],
     "emoji": [Language.L.emoji.football],
        "en": ["toy", "toys"],
        "jp": ["遊具", "おもちゃ", "おもちゃ"]
  },
  "tree": {
        "cn": ["TOWRITE"],
     "emoji": [Language.L.emoji.tree],
        "en": ["tree", "trees"],
        "jp": ["木"]
  },
  "upside-down": {
        "cn": ["TOWRITE"],
     "emoji": [Language.L.emoji.upside_down],
        "en": ["upside-down", "upside down"],
        "jp": ["逆さま"]
  },
  "wink": {
        "cn": ["TOWRITE"],
     "emoji": [Language.L.emoji.wink],
        "en": ["wink", "winking"],
        "jp": ["ウィンク"]
  },
  "wet": {
        "cn": ["TOWRITE"],
     "emoji": [Language.L.emoji.raincloud],
        "en": ["wet"],
        "jp": ["濡れた"]
  },
  "white face": {
        "cn": ["TOWRITE"],
     "emoji": [Language.L.emoji.no_emoji],
        "en": ["white face", "light face"],
        "jp": ["色白さん", "しろめん", "白面", "白めん"]
  },
  "window": {
        "cn": ["TOWRITE"],
     "emoji": [Language.L.emoji.window],
        "en": ["window"],
        "jp": ["窓", "まど"]
  },
  "yawn": {
        "cn": ["TOWRITE"],
     "emoji": [Language.L.emoji.yawn],
        "en": ["yawn", "yawning"],
        "jp": ["あくび"]
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
    if (Language.fallback_blacklist.indexOf(key) != -1) {
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
  // If an English locale other than USA, default the "english" 
  // language flag to UK flag.
  var us = navigator.languages.indexOf("en-US");
  for (let lang of navigator.languages) {
    if (lang.indexOf("en-") == 0) {
      commonwealth = navigator.languages.indexOf(lang);
      if ((commonwealth < us) || (us == -1)) {
        Language.L.gui.flag["en"] = Language.L.flags["UK"];
        break;
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
    var ranges = Pandas.def.ranges['en'];
    var latin = ranges.some(function(range) {
      return range.test(word);
    });
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

// Calculate the current fallback language order for a given info block or entity.
// Key here is adding the current display language to the list, so that if a dataset
// doesn't include info for a language, we can overwrite that info anyways!
Language.currentOrder = function(current_list, current_language) {
  return current_list.concat(current_language).filter(function(value, index, self) { 
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
