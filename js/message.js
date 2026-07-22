import * as Language from './language.js'
import { Emoji, Polyglots, Tags } from './lookup.js'
import P, * as Pandas from './pandas.js'
import * as Show from './show.js'

/** String representations of all messages we might render in functions */
export const Text = {
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
    "en": [Emoji.autumn,
           " Season of changing colors ",
           Emoji.autumn],
    "es": [Emoji.autumn,
           " Temporada de colores cambiantes ",
           Emoji.autumn],
    "ja": [Emoji.autumn,
           " 色が変わる季節 ",
           Emoji.autumn],
    "ko": [Emoji.autumn,
           "색이 변하는 계절 ",
           Emoji.autumn],
    "ne": [Emoji.autumn, 
           " रंग परिवर्तन को मौसम ",
           Emoji.autumn],
    "pt": [Emoji.autumn,
           " Estação de mudança de cores ",
           Emoji.autumn],
    "zh": [Emoji.autumn, 
           " 变色的季节 ",
           Emoji.autumn]
  },
  "baby_photos": {
    "en": [Emoji.baby,
           " Precious little angels ",
           Emoji.baby],
    "es": [Emoji.baby,
           " Angelitos preciosos ",
           Emoji.baby],
    "ja": [Emoji.baby,
           " 貴重な小さな天使 ",
           Emoji.baby],
    "ko": [Emoji.baby,
           "소중한 작은 천사들 ",
           Emoji.baby],
    "ne": [Emoji.baby,
           " बहुमूल्य साना स्वर्गदूतहरू ",
           Emoji.baby],
    "pt": [Emoji.baby,
           " Anjinhos preciosos ",
           Emoji.baby],
    "zh": [Emoji.baby,
           " 珍贵的小天使 ",
           Emoji.baby]
  },
  "birthday_overflow": {
    "en": [Emoji.fireworks,
           " ",
           "<INSERTCOUNT>",
           " birthdays today!"],
    "es": [Emoji.fireworks,
           " ¡",
           "<INSERTCOUNT>",
           " cumpleaños hoy!"],
    "ja": [Emoji.fireworks,
           " 今日は",
           "<INSERTCOUNT>",
           "歳の誕生日！"],
    "ko": [Emoji.fireworks,
           " 오늘 ",
           "<INSERTCOUNT>",
           " 생일!"],
    "ne": [Emoji.fireworks,
           " आज ",
           "<INSERTCOUNT>",
           " जन्मदिन!"],
    "pt": [Emoji.fireworks,
           " ",
           "<INSERTCOUNT>",
           " aniversários hoje!"],
    "zh": [Emoji.fireworks,
           " 今天",
           "<INSERTCOUNT>",
           "个生日！"]
  },
  "closed": {
    "en": [Emoji.closed + " ", 
           "Permanently closed on ",
           "<INSERTDATE>"],
    "es": [Emoji.closed + " ",
           "Cerrado permanentemente el ",
           "<INSERTDATE>"],
    "ja": [Emoji.closed + " ",
           "<INSERTDATE>",
           "に閉業"],
    "ko": [Emoji.closed + " ",
           "<INSERTDATE>",
           " 영구 폐쇄"],
    "ne": [Emoji.closed + " ",
           "स्थायी रूपमा ",
           "<INSERTDATE>",
           "बन्द भयो"],
    "pt": [Emoji.closed + " ", 
           "Permanentemente fechado em ",
           "<INSERTDATE>"],
    "zh": [Emoji.closed + " ",
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
    "en": [Emoji.gift + " ",
           "<INSERTUSER>",
           " has contributed ",
           "<INSERTNUMBER>",
           " photos."],
    "es": [Emoji.gift + " ",
           "<INSERTUSER>",
           " ha contribuido con ",
           "<INSERTNUMBER>",
           " fotos."],
    "ja": [Emoji.gift + " ",
           "<INSERTUSER>",
           "は",
           "<INSERTNUMBER>",
           "枚の写真を寄稿しました。"],
    "ko": [Emoji.gift + " ",
           "<INSERTUSER>",
           "이(가) ",
           "<INSERTNUMBER>",
           "장의 사진을 제공했습니다."],
    "ne": [Emoji.gift + " ",
           "<INSERTUSER>",
           " ले ",
           "<INSERTNUMBER>",
           " फोटो योगदान गरेको छ"],
    "pt": [Emoji.gift + " ",
           "<INSERTUSER>",
           " contribuiu com ",
           "<INSERTNUMBER>",
           " fotos."],
    "zh": [Emoji.gift + " ",
           "<INSERTUSER>",
           "提供了",
           "<INSERTNUMBER>",
           "张照片。"]
  },
  "credit_animal_filter_single": {
    "en": [Emoji.gift + " ",
           "<INSERTUSER>",
           " has contributed ",
           "<INSERTNUMBER>",
           " photos of ",
           "<INSERTNAME>",
           "."],
    "es": [Emoji.gift + " ",
           "<INSERTUSER>",
           " ha contribuido con ",
           "<INSERTNUMBER>",
           " fotos de ",
           "<INSERTNAME>",
           "."],
    "ja": [Emoji.gift + " ",
           "<INSERTUSER>",
           "が",
           "<INSERTNAME>",
           "の写真を",
           "<INSERTNUMBER>",
           "枚投稿しました。"],
    "ko": [Emoji.gift + " ",
           "<INSERTUSER>",
           "이(가) ",
           "<INSERTNAME>",
           "의 사진을",
           "<INSERTNUMBER>",
           "장 제공했습니다."],   
    "ne": [Emoji.gift + " ",
           "<INSERTUSER>",
           " ",
           "<INSERTNUMBER>",
           " ",
           "<INSERTNAME>",
           " फोटोहरु योगदान गरेको छ"],
    "pt": [Emoji.gift + " ",
           "<INSERTUSER>",
           " contribuiu com ",
           "<INSERTNUMBER>",
           " fotos de ",
           "<INSERTNAME>",
           "."],
    "zh": [Emoji.gift + " ",
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
    "en": [Emoji.globe_americas, " Find a zoo nearby!"],
    "es": [Emoji.globe_americas, " ¡Encuentra un zoológico cerca de ti!"],
    "ja": [Emoji.globe_asia, " 近くの動物園を見つける"],
    "ko": [Emoji.globe_asia, " 주변 동물원 찾기"],
    "ne": [Emoji.globe_asia, " नजिकै चिडियाखाना खोज्नुहोस्"],
    "pt": [Emoji.globe_americas, " Encontre um zoológico próximo!"],
    "zh": [Emoji.globe_asia, " 寻找附近的动物园"]
  },
  "footer": {
    "en": ["If you love red pandas, please support ",
           "<INSERTLINK_RPN>",
           " as well as your local zoos. Lineage data courtesy of the ",
           "<INSERTLINK_RPF>",
           " project, but linked media remains property of its creators.",
           " Design ©",
           "\xa0",
           "2026 ", 
           "<INSERTLINK_WASHIMUMU>",
           " & ",
           "<INSERTLINK_WUMPWOAST>",
           "."],
    "es": ["Si te encantan los pandas rojos, apoya a ",
           "<INSERTLINK_RPN>",
           " y a los zoológicos locales. Los datos sobre el linaje son cortesía del proyecto ",
           "<INSERTLINK_RPF>",
           " pero los medios vinculados siguen siendo propiedad de sus creadores.",
           " Diseño ©",
           "\xa0",
           "2026 ",
           "<INSERTLINK_WASHIMUMU>",
           " y ",
           "<INSERTLINK_WUMPWOAST>",
           "."],
    "ja": ["レッサーパンダが好きな人は、地元の動物園だけでなく",
           "<INSERTLINK_RPN>",
           "もサポートしてください。系統データは",
           "<INSERTLINK_RPF>",
           "プロジェクトの好意により提供されていますが、リンクされたメディアは引き続き作成者の所有物です。",
           "設計©2026",
           "<INSERTLINK_WASHIMUMU>",
           "と",
           "<INSERTLINK_WUMPWOAST>",
           ],
    "ko": ["레서판다를 사랑한다면, 꼭 응원과 후원을 부탁드려요! ",
           "<INSERTLINK_RPN>",
           " 여러분이 가까이에서 방문할 수 있는 지역 동물원도 응원해 주세요.",
           "<INSERTLINK_RPF>",
           " 데이터는 본 프로젝트의 협조로 제공되며, 연결된 미디어 자료의 저작권은 각 제작자에게 있습니다.",
           "레이아웃 및 디자인 ©",
           "\xa0",
           "2026 ",
           "<INSERTLINK_WASHIMUMU>",
           " & ",
           "<INSERTLINK_WUMPWOAST>",
           "."],
    "ne": ["यदि तपाईं निगल्य पोन्या मन पराउनुहुन्छ, कृपया ",
           "<INSERTLINK_RPN>",
           " साथै तपाईंको स्थानीय चिडियाखानालाई समर्थन गर्नुहोस्। ",
           "<INSERTLINK_RPF>",
           " प्रोजेक्टको वंश डाटा शिष्टाचार, तर मिडिया यसको सिर्जनाकर्ताहरूको सम्पत्ति रहन्छ।",
           " लेआउट र डिजाइन प्रतिलिपि अधिकार २०२६ ",
           "<INSERTLINK_WASHIMUMU>",
           " र ",
           "<INSERTLINK_WUMPWOAST>",
           "द्वारा।"],
    "pt": ["Se você ama pandas-vermelhos, por favor apoie a  ",
           "<INSERTLINK_RPN>",
           " bem como seus zoológicos locais. Dados de linhagem são uma cortesia do projeto ",
           "<INSERTLINK_RPF>",
           ", mas as mídias linkadas seguem sendo propriedade de seus criadores. ",
           "Design ©",
           "\xa0",
           "2026 ",
           "<INSERTLINK_WASHIMUMU>",
           " e ",
           "<INSERTLINK_WUMPWOAST>",
           "."],
    "zh": ["如果你喜爱小熊猫，请支持小熊猫网络（",
           "<INSERTLINK_RPN>",
           "）以及你当地的动物园。",
           "族谱数据归属于",
           "<INSERTLINK_RPF>",
           "但相关媒介内容（如图片等）版权归属于原作者。",
           "布局与设计©2026",
           "<INSERTLINK_WASHIMUMU>",
           "和",
           "<INSERTLINK_WUMPWOAST>"]
  },
  "found_animal": {
    "en": [Emoji.flower, " ",
           Emoji.see_and_say, 
           " ",
           "<INSERTNAME>",
           " has been found and is safe!"],
    "es": [Emoji.flower, " ",
           Emoji.see_and_say,
           " ¡",
           "<INSERTNAME>",
           " ha sido encontrado y está a salvo!"],
    "ja": [Emoji.flower, " ",
           Emoji.see_and_say, 
           " ",
           "<INSERTNAME>",
           " has been found and is safe!"],
    "ko": [Emoji.flower, " ",
           Emoji.see_and_say, 
           " ",
           "<INSERTNAME>",
           "이(가) 발견되었습니다!"],
    "ne": [Emoji.flower, " ",
           Emoji.see_and_say, 
           " ",
           "<INSERTNAME>",
           " has been found and is safe!"],
    "pt": [Emoji.flower, " ",
           Emoji.see_and_say, 
           " ",
           "<INSERTNAME>",
           " foi encontrado(a) e está a salvo!"],
    "zh": [Emoji.flower, " ",
           Emoji.see_and_say, 
           " ",
           "<INSERTNAME>",
           " has been found and is safe!"]
  },
  "goodbye": {
    "en": ["Good-bye, ",
           "<INSERTNAME>",
           ". ",
           Emoji.died,
           " (",
           "<INSERTBIRTH>",
           " — ",
           "<INSERTDEATH>",
           ")"],
    "es": ["Hasta siempre, ",
           "<INSERTNAME>",
           ". ",
           Emoji.died,
           " (",
           "<INSERTBIRTH>",
           " — ",
           "<INSERTDEATH>",
           ")"],
    "ja": ["ありがとう, ",
           "<INSERTNAME>",
           "。",
           Emoji.died, 
           "（",
           "<INSERTBIRTH>",
           " — ",
           "<INSERTDEATH>",
           "）"],
    "ko": ["안녕... 잘 가,",
           "<INSERTNAME>",
           ". ",
           Emoji.died,
           " (",
           "<INSERTBIRTH>",
           " — ",
           "<INSERTDEATH>",
           ")"],   
    "ne": ["विदाई, ",
           "<INSERTNAME>",
           " ",
           Emoji.died,
           " (",
           "<INSERTBIRTH>",
           " — ",
           "<INSERTDEATH>",
           ")"],
    "pt": ["Adeus, ",
           "<INSERTNAME>",
           ". ",
           Emoji.died,
           " (",
           "<INSERTBIRTH>",
           " — ",
           "<INSERTDEATH>",
           ")"],
    "zh": ["后会有期, ",
           "<INSERTNAME>",
           "。",
           Emoji.died,
           "（",
           "<INSERTBIRTH>",
           " — ",
           "<INSERTDEATH>",
           "）"]
  },
  "happy_birthday": {
    "en": [Emoji.birthday,
           " Happy Birthday, ",
           "<INSERTNAME>",
           "! (",
           "<INSERTNUMBER>",
           ")"],
    "es": [Emoji.birthday,
           " ¡Feliz cumpleaños, ",
           "<INSERTNAME>",
           "! (",
           "<INSERTNUMBER>",
           ")"],
    "ja": [Emoji.birthday,
           " ",
           "<INSERTNAME>",
           "、誕生日おめでとう！（",
           "<INSERTNUMBER>",
           "歳）"],
    "ko": [Emoji.birthday,
           "<INSERTNAME>",
           "의 생일을 축하합니다! (",
           "<INSERTNUMBER>",
           "세)"],
    "ne": [Emoji.birthday,
           " ",
           "जन्मदिनको शुभकामना, ",
           "<INSERTNAME>",
           "! (",
           "<INSERTNUMBER>",
           ")"],
    "pt": [Emoji.birthday,
           " Feliz aniversário, ",
           "<INSERTNAME>",
           "! (",
           "<INSERTNUMBER>",
           ")"],
    "zh": [Emoji.birthday,
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
    "en": [Emoji.alert, " ",
           Emoji.see_and_say, 
           " If you see ",
           "<INSERTNAME>",
           ", contact ",
           "<ZOONAME>",
           ": ",
           "<ZOOCONTACT>"],
    "es": [Emoji.alert, " ",
           Emoji.see_and_say,
           " Si ves a ",
           "<INSERTNAME>",
           " contacta a ",
           "<ZOONAME>",
           ": ",
           "<ZOOCONTACT>"],
    "ja": [Emoji.alert, " ",
           Emoji.see_and_say, 
           " If you see ",
           "<INSERTNAME>",
           ", contact ",
           "<ZOONAME>",
           ": ",
           "<ZOOCONTACT>"],
    "ko": [Emoji.alert, " ",
           Emoji.see_and_say, 
           " If you see ",
           "<INSERTNAME>",
           ", contact ",
           "<ZOONAME>",
           ": ",
           "<ZOOCONTACT>"],
    "ne": [Emoji.alert, " ",
           Emoji.see_and_say, 
           " If you see ",
           "<INSERTNAME>",
           ", contact ",
           "<ZOONAME>",
           ": ",
           "<ZOOCONTACT>"],
    "pt": [Emoji.alert, " ",
           Emoji.see_and_say, 
           " Se vir ",
           "<INSERTNAME>",
           ", contacte ",
           "<ZOONAME>",
           ": ",
           "<ZOOCONTACT>"],
    "zh": [Emoji.alert, " ",
           Emoji.see_and_say, 
           " If you see ",
           "<INSERTNAME>",
           ", contact ",
           "<ZOONAME>",
           ": ",
           "<ZOOCONTACT>"]
  },
  "lunch_time": {
    "en": [Emoji.paws, " ",
           "What's for lunch?", " ",
           Emoji.greens],
    "es": [Emoji.paws, " ",
           "¿Qué hay de comer?", " ",
           Emoji.greens],
    "ja": [Emoji.paws, " ",
           "昼食は何ですか？", " ",
           Emoji.greens],
    "ko": [Emoji.paws, " ",
           "오늘 점심 메뉴는 무엇인가요?", " ",
           Emoji.greens],
    "ne": [Emoji.paws, " ",
           "खाजाको लागि के हो?", " ",
           Emoji.greens],
    "pt": [Emoji.paws, " ",
           "O que tem para o almoço?", " ",
           Emoji.greens],
    "zh": [Emoji.paws, " ",
           "午饭吃什么？", " ",
           Emoji.greens]
  },
  "missing_you": {
    "en": ["We miss you, ",
           "<INSERTNAME>",
           ". ",
           Emoji.died,
           " (",
           "<INSERTBIRTH>",
           " — ",
           "<INSERTDEATH>",
           ")"],
    "es": ["Te extrañamos, ",
           "<INSERTNAME>",
           ". ",
           Emoji.died,
           " (",
           "<INSERTBIRTH>",
           " — ",
           "<INSERTDEATH>",
           ")"],
    "ja": ["あなたがいなくてとても寂しい, ",
           "<INSERTNAME>",
           "。",
           Emoji.died, 
           "（",
           "<INSERTBIRTH>",
           " — ",
           "<INSERTDEATH>",
           "）"],
    "ko": ["보고 싶어,",
           "<INSERTNAME>",
           ". ",
           Emoji.died,
           " (",
           "<INSERTBIRTH>",
           " — ",
           "<INSERTDEATH>",
           ")"],
    "ne": ["हामी तिमीलाई सम्झिन्छौं",
           "<INSERTNAME>",
           " ",
           Emoji.died,
           " (",
           "<INSERTBIRTH>",
           " — ",
           "<INSERTDEATH>",
           ")"],
    "pt": ["Saudades de você, ",
           "<INSERTNAME>",
           ". ",
           Emoji.died,
           " (",
           "<INSERTBIRTH>",
           " — ",
           "<INSERTDEATH>",
           ")"],
    "zh": ["我们想你, ",
           "<INSERTNAME>",
           "。",
           Emoji.died,
           "（",
           "<INSERTBIRTH>",
           " — ",
           "<INSERTDEATH>",
           "）"]
  },
  "nearby_zoos": {
    "en": [Emoji.website,
           " ",
           Emoji.home,
           " Finding nearby zoos. ",
           "If geolocation fails, try ",
           "searching for your city."],
    "es": [Emoji.website,
           " ",
           Emoji.home,
           " Encontrar zoológicos cercanos. ", 
           "Si la geolocalización falla, intente ",
           " buscar su ciudad."],
    "ja": [Emoji.website,
           " ",
           Emoji.home,
           " 近くの動物園を見上げます。",
           "ジオロケーションが失敗した場合は、",
           "都市を検索してみてください。"],
    "ko": [Emoji.website,
           " ",
           Emoji.home,
           " 가까운 동물원을 찾고 있어요. ",
           "위치 정보가 실패하면,",
           "도시 이름으로 검색해보세요."],   
    "ne": [Emoji.website, 
           " ",
           Emoji.home,
           " नजिकका चिडियाखानाहरू भेट्टाउँदै।",
           " यदि भौगोलिक स्थान असफल भयो भने,",
           " आफ्नो शहरको लागि खोजी प्रयास गर्नुहोस्।"],
    "pt": [Emoji.website,
           " ",
           Emoji.home,
           " Procurando zoológicos próximos. ",
           "Se a geolocalização falhar, ",
           "tente pesquisar sua cidade."],
    "zh": [Emoji.website,
           " ",
           Emoji.home,
           " 查找附近的动物园。",
           "如果地理位置失败，",
           "请尝试搜索您的城市。"]
  },
  "new_photos": {
    "contributors": {
      "en": [Emoji.giftwrap,
             " ",
             "<INSERTCOUNT>",
             " new contributors"],
      "es": [Emoji.giftwrap,
            " ",
            "<INSERTCOUNT>",
            " nuevos contribuyentes"],
      "ja": [Emoji.giftwrap,
             "<INSERTCOUNT>",
             "人の新しい貢献者"],
      "ko": [Emoji.giftwrap,
             "<INSERTCOUNT>",
             "새 기여자"],
      "ne": [Emoji.giftwrap,
             " ",
             "<INSERTCOUNT>",
             " योगदानकर्ताहरू नयाँ"],
      "pt": [Emoji.giftwrap,
             " ",
             "<INSERTCOUNT>",
             " novos contribuintes"],
      "zh": [Emoji.giftwrap,
             "<INSERTCOUNT>",
             "新贡献者"]
    },
    "pandas": {
      "en": [Emoji.profile,
             " ",
             "<INSERTCOUNT>",
             " new red pandas"],
      "es": [Emoji.profile,
             " ",
             "<INSERTCOUNT>",
             " nuevos pandas rojos"],
      "ja": [Emoji.profile,
             " ",
             "<INSERTCOUNT>",
             "つの新しいレッサーパンダ"],
      "ko": [Emoji.profile,
             " ",
             "<INSERTCOUNT>",
             " 새로운 레서판다가 찾아왔어요!"],
      "ne": [Emoji.profile,
             " ",
             "<INSERTCOUNT>",
             " निगल्य पोन्या नयाँ"],
      "pt": [Emoji.profile,
             " ",
             "<INSERTCOUNT>",
             " novos pandas-vermelhos"],
      "zh": [Emoji.profile,
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
      "en": [Emoji.zoo,
             " ",
             "<INSERTCOUNT>",
             " new zoos"],
      "es": [Emoji.zoo,
             " ",
             "<INSERTCOUNT>",
             " nuevos zoológicos"],
      "ja": [Emoji.zoo,
             "<INSERTCOUNT>",
             "つの新しい動物園"],
      "ko": [Emoji.zoo,
             " ",
             "<INSERTCOUNT>",
             "새로운 동물원"],
      "ne": [Emoji.zoo,
             " ",
             "<INSERTCOUNT>",
             " नयाँ चिडियाखाना"],
      "pt": [Emoji.zoo,
             " ",
             "<INSERTCOUNT>",
             " novos zoológicos"],
      "zh": [Emoji.zoo,
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
    "en": [Emoji.hearts, " ",
           "<INSERTNAMES>",
           ": We will never forget you. ",
           " ", Emoji.paws],
    "es": [Emoji.hearts, " ",
           "<INSERTNAMES>",
           ": Nosotros nunca te olvidaremos. ",
           " ", Emoji.paws],
    "ja": [Emoji.hearts, " ",
           "<INSERTNAMES>",
           "〜私たちは君を決して忘れません。",
           Emoji.paws],
    "ko": [Emoji.hearts, " ",
           "<INSERTNAMES>",
           ": 우리는 너를 절대 잊지 않을 거야.",
           Emoji.paws],
    "ne": [Emoji.hearts, " ",
           "<INSERTNAMES>",
           ": हामी तिमीलाई कहिल्यै बिर्सिने छैनौं। ",
           Emoji.paws],
    "pt": [Emoji.hearts, " ",
           "<INSERTNAMES>",
           ": Nunca esqueceremos de você. ",
           " ", Emoji.paws],
    "zh": [Emoji.hearts, " ",
           "<INSERTNAMES>",
           ": 我们永远不会忘记你。",
           Emoji.paws]
  },
  "shovel_pandas": {
    "en": [Emoji.dig, " ",
           "Searching for buried treasure!", " ",
           Emoji.treasure],
    "es": [Emoji.dig, " ",
           "¡Buscando tesoros enterrados!", " ",
           Emoji.treasure],
    "ja": [Emoji.dig, " ",
           "埋蔵金を探す", " ",
           Emoji.treasure],
    "ko": [Emoji.dig, " ",
           "숨겨진 보물을 찾고 있어요!", " ",
           Emoji.treasure],
    "ne": [Emoji.dig, " ",
           "गाडिएको खजाना खोजी गर्दै", " ",
           Emoji.treasure],
    "pt": [Emoji.dig, " ",
           "Procurando o tesouro enterrado!", " ",
           Emoji.treasure],
    "zh": [Emoji.dig, " ",
           "寻找埋藏的宝藏", " ",
           Emoji.treasure]
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
    "en": [Emoji.pumpkin, " ",
           "Trick or Treat", " ",
           Emoji.pumpkin],
    "es": [Emoji.pumpkin, " ",
           "¡Truco o trato!", " ",
           Emoji.pumpkin],
    "ja": [Emoji.pumpkin, " ",
           "不気味なカボチャ", " ",
           Emoji.pumpkin],
    "ko": [Emoji.pumpkin, " ",
           "사탕 안 주면 장난칠 거야!", " ",
           Emoji.pumpkin],
    "ne": [Emoji.pumpkin, " ",
           "डरलाग्दो कद्दु", " ",
           Emoji.pumpkin],
    "pt": [Emoji.pumpkin, " ",
           "Gostosuras ou travessuras", " ",
           Emoji.pumpkin],
    "zh": [Emoji.pumpkin, " ",
           "怪异的南瓜", " ",
           Emoji.pumpkin]
  },
  "zoo_details_babies": {
    "en": [Emoji.baby,
           " ",
           "<INSERTBABIES>",
           " cubs born since ",
           "<INSERTYEAR>"],
    "es": [Emoji.baby,
           " ",
           "<INSERTBABIES>",
           " cachorros nacidos desde ",
           "<INSERTYEAR>"],
    "ja": [Emoji.baby,
           " ",
           "<INSERTYEAR>",
           "年から生まれた",
           "<INSERTBABIES>",
           "人の赤ちゃん"],
    "ko": [Emoji.baby,
           " ",
           "<INSERTYEAR>",
           "년에 태어난 아기는 ",
           "<INSERTBABIES>",
           "마리예요."],
    "ne": [Emoji.baby,
           " ",
           "<INSERTBABIES>",
           " पछि बच्चा जन्मे ",
           "<INSERTYEAR>"],
    "pt": [Emoji.baby,
           " ",
           "<INSERTBABIES>",
           " filhotes nascidos desde ",
           "<INSERTYEAR>"],
    "zh": [Emoji.baby,
           " ",
           "自",
           "<INSERTYEAR>",
           "年以来出生的",
           "<INSERTBABIES>",
           "名婴儿"]
  },
  "zoo_details_departures": {
    "en": [Emoji.truck,
           " ",
           "<INSERTNUM>", 
           " recent departures"],
    "es": [Emoji.truck,
           " ",
           "<INSERTNUM>",
           " partidas recientes."],
    "ja": [Emoji.truck,
           " ",
           "最近の",
           "<INSERTNUM>",
           "回の出発"],
    "ko": [Emoji.truck,
           " ",
           "최근에 이동한 ",
           "<INSERTNUM>",
           "마리의 레서판다"],
    "ne": [Emoji.truck,
           " ",
           "<INSERTNUM>",
           " भर्खरको प्रस्थान"],
    "pt": [Emoji.truck,
           " ",
           "<INSERTNUM>", 
           " partidas recentes"],
    "zh": [Emoji.truck,
           " ",
           "<INSERTNUM>",
           "最近出发"]
  },
  "zoo_details_pandas_live_here": {
    "en": [Emoji.panda,
           " ",
           "<INSERTNUM>",
           " red pandas live here"],
    "es": [Emoji.panda,
           " Hay ",
           "<INSERTNUM>",
           " panda rojos en este zoológico"],
    "ja": [Emoji.panda,
           " ",
           "ここに",
           "<INSERTNUM>",
           "匹のレッサーパンダが住んでいます"],
    "ko": [Emoji.panda,
           " ",
           "이곳에는 ",
           "<INSERTNUM>",
           "마리의 레서판다가 살고 있어요."],
    "ne": [Emoji.panda,
           " ",
           "<INSERTNUM>",
           " पांडा यहाँ बस्छन्"],
    "pt": [Emoji.panda,
           " ",
           "<INSERTNUM>",
           " pandas-vermelhos moram aqui"],
    "zh": [Emoji.panda,
           " ",
           "<INSERTNUM>",
           "只大熊猫住在这里"]
  },
  "zoo_details_no_pandas_live_here": {
    "en": [Emoji.panda,
           " ",
           "No red pandas currently here"],
    "es": [Emoji.panda,
           " ",
           "Por ahora aquí no hay pandas rojos."],
    "ja": [Emoji.panda,
           " ",
           "パンダが見つかりません"],
    "ko": [Emoji.panda,
           " ",
           "이곳에는 레서판다가 없어요."],
    "ne": [Emoji.panda,
           " ",
           "कुनै निगल्य पोन्या फेला परेन"],
    "pt": [Emoji.panda,
           " ",
           "Nenhum panda-vermelho atualmente aqui"],
    "zh": [Emoji.panda,
           " ",
           "没有找到这只小熊猫"]
  },
  "zoo_details_records": {
    "en": [Emoji.recordbook,
           " ",
           "<INSERTNUM>",
           " recorded in the database since ",
           "<INSERTYEAR>"],
    "es": [Emoji.recordbook,
           " ",
           "<INSERTNUM>",
           " registrados aquí desde ",
           "<INSERTYEAR>"],
    "ja": [Emoji.recordbook,
           " ",
           "<INSERTYEAR>",
           "年からデータベースに記録された",
           "<INSERTNUM>"],
    "ko": [Emoji.recordbook,
           " ",
           "<INSERTYEAR>",
           "년부터 데이터베이스에 저장된 ",
           "<INSERTNUM>",
           "개의 기록이 있어요."],      
    "ne": [Emoji.recordbook,
           " ",
           "<INSERTNUM>",
           " रेचोर्ड्स इन द दताबसे सिन्के ",
           "<INSERTYEAR>"],
    "pt": [Emoji.recordbook,
           " ",
           "<INSERTNUM>",
           " registrados na base de dados desde ",
           "<INSERTYEAR>"],
    "zh": [Emoji.recordbook,
           " ",
           "自",
           "<INSERTYEAR>",
           "年以来",
           "<INSERTNUM>",
           "个记录在数据库中"]
  },
  "zoo_header_new_arrivals": {
    "en": [Emoji.fireworks,
           " ",
           "New Arrivals"],
    "es": [Emoji.fireworks,
           " ",
           "Los recién llegados"],
    "ja": [Emoji.fireworks,
           " ",
           "新着"],
    "ko": [Emoji.fireworks,
           " ",
           "새로운 친구들"],
    "ne": [Emoji.fireworks,
           " ",
           "नयाँ आगमन"],
    "pt": [Emoji.fireworks,
           " ",
           "Novas chegadas"],
    "zh": [Emoji.fireworks,
           " ",
           "新来的"]
  },
  "zoo_header_other_pandas": {
    "en": [Emoji.panda,
           " ",
           "Other Pandas at ",
           "<INSERTZOO>"],
    "es": [Emoji.panda,
           " ",
           "Otros pandas en ",
           "<INSERTZOO>"],
    "ja": [Emoji.panda,
           " ",
           "<INSERTZOO>",
           "の他のパンダ"],
    "ko": [Emoji.panda,
           " ",
           "<INSERTZOO>",
           "의 다른 레서판다들"],   
    "ne": [Emoji.panda,
           " ",
           "<INSERTZOO>",
           " अन्य पोन्या"],
    "pt": [Emoji.panda,
           " ",
           "Outros pandas em ",
           "<INSERTZOO>"],
    "zh": [Emoji.panda,
           " ",
           "<INSERTZOO>",
           "里的其他小熊猫"]
  },
  "zoo_header_recently_departed": {
    "en": [Emoji.truck,
           " ",
           "Recently Departed"],
    "es": [Emoji.truck,
           " ",
           "Hace poco se fueron"],
    "ja": [Emoji.truck,
           " ",
           "最近出発しました"],
    "ko": [Emoji.truck,
           " ",
           "최근에 떠난 친구들"],
    "ne": [Emoji.truck,
           " ",
           "भर्खर प्रस्थान"],
    "pt": [Emoji.truck,
           " ",
           "Partiram recentemente"],
    "zh": [Emoji.truck,
           " ",
           "最近离开"]
  }
}

/**
 * Functions used to generate translated heading snippets in various page modes
 */

export function arrivals(zoo, born, language) {
  // Zoo search: display arriving animals along with ones just born.
  // If any animals were born, this message gets a baby icon suffix
  const link = document.createElement('a')
  link.href = "javascript:"
  const linkId = `arrivals/zoo/${zoo["_id"]}`
  link.id = linkId;
  link.addEventListener("click", function() {
    document.getElementById(linkId).scrollIntoView(true)
  });
  const p = document.createElement('p')
  for (const i in Text.zoo_header_new_arrivals[language]) {
    const field = Text.zoo_header_new_arrivals[language][i]
    const msg = document.createTextNode(field)
    p.appendChild(msg)
  }
  if (born.length > 0) {
    const suffix = document.createTextNode(" " + Emoji.baby)
    p.appendChild(suffix)
  }
  link.appendChild(p)
  return shrinkBoxMessage("arrivalsHeader", link)
}

export function arrived_from_zoo(zoo, date, language) {
  // Text to go into the Show.zooLink function
  let text = ""
  for (const i in Text.arrived_from_zoo[language]) {
    const field = Text.arrived_from_zoo[language][i]
    if (field == "<INSERTDATE>") {
      field = date
      text = text + field
    } else if (field == "<INSERTZOO>") {
      field = zoo
      text = text + field
    } else {
      text = text + field
    }
  }
  return text
}

export function autumn(language) {
  const link = document.createElement('a')
  link.href = "#query/autumn"
  const p = document.createElement('p')
  for (const i in Text.autumn[language]) {
    const field = Text.autumn[language][i]
    const msg = document.createTextNode(field)
    p.appendChild(msg)
  }
  link.appendChild(p)
  return shrinkBoxMessage("tagSummary", link)
}

export function baby_photos(language) {
  const link = document.createElement('a')
  link.href = "#query/baby";
  const p = document.createElement('p')
  for (const i in Text.baby_photos[language]) {
    const field = Text.baby_photos[language][i]
    const msg = document.createTextNode(field)
    p.appendChild(msg)
  }
  link.appendChild(p)
  return shrinkBoxMessage("tagSummary", link)
}

export function birthday(name, animalId, years, language) {
  const link = document.createElement('a')
  link.href = `#panda/${animalId}`
  const p = document.createElement('p')
  for (const i in Text.happy_birthday[language]) {
    let field = Text.happy_birthday[language][i]
    if (field == "<INSERTNAME>") {
      field = name
      const msg = document.createTextNode(field)
      p.appendChild(msg)
    } else if (field == "<INSERTNUMBER>") {
      field = years
      const msg = document.createTextNode(field)
      p.appendChild(msg)
    } else {
      const msg = document.createTextNode(field)
      p.appendChild(msg)
    }
  }
  link.appendChild(p)
  return shrinkBoxMessage("birthdaySummary", link)
}

export function birthday_overflow(count, language) {
  const p = document.createElement('p')
  p.className = "summaryEmphasis"
  for (const i in Text.birthday_overflow[language]) {
    let field = Text.birthday_overflow[language][i]
    if (field == "<INSERTCOUNT>") {
      field = count
      const msg = document.createTextNode(field)
      p.appendChild(msg)
    } else {
      const msg = document.createTextNode(field)
      p.appendChild(msg)
    }
  }
  return shrinkBoxMessage("birthdaySummary", p)
}

export function closed(date, language) {
  const p = document.createElement('p');
  for (const i in Text.closed[language]) {
    let field = Text.closed[language][i]
    if (field == "<INSERTDATE>") {
      field = date
      const msg = document.createTextNode(field);
      p.appendChild(msg)
    } else {
      const msg = document.createTextNode(field);
      p.appendChild(msg)
    }
  }
  return p
}

export function credit(credit, count, language) {
  // Draw a header for crediting someone's photos contribution 
  // with the correct language
  const p = document.createElement('p')
  for (const i in Text.credit[language]) {
    let field = Text.credit[language][i]
    if (field == "<INSERTUSER>") {
      field = credit
      const msg = document.createElement('i')
      msg.innerText = field
      p.appendChild(msg)
    } else if (field == "<INSERTNUMBER>") {
      field = count
      const msg = document.createElement('b')
      msg.innerText = field
      p.appendChild(msg)
    } else if ((field == Emoji.gift + " ") && (count >= 1000)) {
      field = Emoji.megagift + " "
      const msg = document.createTextNode(field)
      p.appendChild(msg)
    } else {
      var msg = document.createTextNode(field)
      p.appendChild(msg)
    }
  }
  return shrinkBoxMessage("creditSummary", p)
}

export function creditSingleFilter(credit, filter, count, language) {
  // Draw a header for crediting someone's photos contribution 
  // with the correct language
  filter = Language.capitalNames(filter)
  const p = document.createElement('p')
  for (const i in Text.credit_animal_filter_single[language]) {
    let field = Text.credit_animal_filter_single[language][i]
    if (field == "<INSERTUSER>") {
      field = credit
      const msg = document.createElement('i')
      msg.innerText = field
      p.appendChild(msg)
    } else if (field == "<INSERTNUMBER>") {
      field = count
      const msg = document.createElement('b')
      msg.innerText = field
      p.appendChild(msg)
    } else if (field == "<INSERTNAME>") {
      field = filter
      const msg = document.createElement('b')
      msg.innerText = field
      p.appendChild(msg)
    } else {
      const msg = document.createTextNode(field)
      p.appendChild(msg)
    }
  }
  return shrinkBoxMessage("creditSummary", p)
}

export function departed_to_zoo(zoo, date, language) {
  // Text to go into the Show.zooLink function
  let text = "";
  for (const i in Text.departed_to_zoo[language]) {
    let field = Text.departed_to_zoo[language][i]
    if (field == "<INSERTDATE>") {
      field = date
      text = text + field
    } else if (field == "<INSERTZOO>") {
      field = zoo
      text = text + field
    } else {
      text = text + field
    }
  }
  return text
}

export function departures(zoo, deaths, leaving, language) {
  // Zoo search: display departing animals along with ones that died.
  // If any animals passed away, this message gets a rainbow icon suffix
  const link = document.createElement('a');
  link.href = "javascript:";
  const linkId = `departures/zoo/${zoo["_id"]}`
  link.id = linkId
  link.addEventListener("click", function() {
    document.getElementById(linkId).scrollIntoView(true)
  })
  const p = document.createElement('p')
  for (const i in Text.zoo_header_recently_departed[language]) {
    const field = Text.zoo_header_recently_departed[language][i]
    const msg = document.createTextNode(field)
    p.appendChild(msg)
  }
  if ((deaths.length > 0) && (leaving.length == deaths.length)) {
    const suffix = document.createTextNode(" " + Emoji.died)
    p.appendChild(suffix)
  }
  link.appendChild(p)
  return shrinkBoxMessage("departuresHeader", link)
}

export function findNearbyZoo(language) {
  const link = document.createElement('a')
  link.href = "#query/nearby"
  const p = document.createElement('p')
  p.className = "summaryEmphasis"
  for (const i in Text.find_a_nearby_zoo[language]) {
    const field = Text.find_a_nearby_zoo[language][i]
    const msg = document.createTextNode(field)
    p.appendChild(msg)
  }
  link.appendChild(p)
  return shrinkBoxMessage("frontPageSummary", link)
}

export function foundAnimal(name, animalId, language) {
  const link = document.createElement('a')
  link.href = `#panda/${animalId}`
  const p = document.createElement('p')
  for (const i in Text.found_animal[language]) {
    let field = Text.found_animal[language][i]
    if (field == "<INSERTNAME>") {
      field = name
      const msg = document.createTextNode(field)
      p.appendChild(msg)
    } else {
      const msg = document.createTextNode(field)
      p.appendChild(msg)
    }
  }
  link.appendChild(p)
  return shrinkBoxMessage("memorialSummary", link)
}

export function geolocationStart(language) {
  const p = document.createElement('p')
  for (const i in Text.nearby_zoos[language]) {
    const field = Text.nearby_zoos[language][i]
    const msg = document.createTextNode(field);
    p.appendChild(msg);
  }
  return shrinkBoxMessage("frontPageSummary", p)
}

export function lostAnimal(name, animalId, zooName, zooContact, language) {
  const link = document.createElement('a')
  link.href = `#profile/${animalId}`
  const p = document.createElement('p')
  for (const i in Text.lost_animal[language]) {
    let field = Text.lost_animal[language][i]
    if (field == "<INSERTNAME>") {
      field = name
      const msg = document.createTextNode(field)
      p.appendChild(msg)
    } else if (field == "<ZOONAME>") {
      field = zooName
      const msg = document.createTextNode(field)
      p.appendChild(msg)
    } else if (field == "<ZOOCONTACT>") {
      field = zooContact
      const b = document.createElement('b')
      const msg = document.createTextNode(field)
      b.appendChild(msg)
      p.appendChild(b)
    } else {
      const msg = document.createTextNode(field)
      p.appendChild(msg)
    }
  }
  link.appendChild(p)
  return shrinkBoxMessage("memorialSummary", link)
}

export function lunch_time(language) {
  const link = document.createElement('a')
  link.href = "#query/lunch time"
  const p = document.createElement('p')
  for (const i in Text.lunch_time[language]) {
    const field = Text.lunch_time[language][i]
    const msg = document.createTextNode(field)
    p.appendChild(msg)
  }
  link.appendChild(p)
  return shrinkBoxMessage("tagSummary", link)
}

export function memorial(name, animalId, birth, death, language) {
  const link = document.createElement('a')
  link.href = `#panda/${animalId}`
  const p = document.createElement('p')
  for (const i in Text.goodbye[language]) {
    let field = Text.goodbye[language][i]
    if (field == "<INSERTNAME>") {
      field = name
      const msg = document.createTextNode(field)
      p.appendChild(msg)
    } else if (field == "<INSERTBIRTH>") {
      field = birth
      var msg = document.createTextNode(field)
      p.appendChild(msg)
    } else if (field == "<INSERTDEATH>") {
      field = death
      const msg = document.createTextNode(field)
      p.appendChild(msg)
    } else {
      const msg = document.createTextNode(field)
      p.appendChild(msg)
    }
  }
  link.appendChild(p);
  return shrinkBoxMessage("memorialSummary", link)
}

 export function memorialGroup(nameString, idString, language) {
  const link = document.createElement('a')
  link.href = `#group/${idString}`
  const p = document.createElement('p')
  for (const i in Text.remembering_you_together[language]) {
    let field = Text.remembering_you_together[language][i]
    if (field == "<INSERTNAMES>") {
      field = nameString
      const msg = document.createTextNode(field)
      p.appendChild(msg)
    } else {
      const msg = document.createTextNode(field)
      p.appendChild(msg)
    }
  }
  link.appendChild(p)
  return shrinkBoxMessage("memorialSummary", link)
}

export function missing_you(name, animalId, birth, death, language) {
  const link = document.createElement('a')
  link.href = `#panda/${animalId}`
  const p = document.createElement('p')
  for (const i in Text.missing_you[language]) {
    let field = Text.missing_you[language][i]
    if (field == "<INSERTNAME>") {
      field = name
      const msg = document.createTextNode(field)
      p.appendChild(msg)
    } else if (field == "<INSERTBIRTH>") {
      field = birth
      const msg = document.createTextNode(field)
      p.appendChild(msg)
    } else if (field == "<INSERTDEATH>") {
      field = death
      const msg = document.createTextNode(field)
      p.appendChild(msg)
    } else {
      const msg = document.createTextNode(field)
      p.appendChild(msg)
    }
  }
  link.appendChild(p)
  return shrinkBoxMessage("memorialSummary", link)
}

export function new_photos(language) {
  // Grab update counts
  const counts = {
    "contributors": P.db._totals.updates.authors,
    "entities":  P.db._totals.updates.entities,
    "photos": P.db._totals.updates.photos,
    "suffix": 1,   // HACK
    "pandas": P.db._totals.updates.pandas,
    "zoos": P.db._totals.updates.zoos
  }
  if (counts["zoos"] == 0 && 
      counts["entities"] == 0 && 
      counts["photos"] == 0 &&
      counts["pandas"] == 0) {
    return document.createElement('br')   // No message to display
  }
  // Zoo counts are too much information
  const section_order = []
  if (counts["pandas"] > 0 && counts["photos"] > 0) {
    section_order = ["pandas", "photos", "suffix"]
  } else if (counts["pandas"] > 0 ) {
    section_order = ["pandas", "contributors", "suffix"]
  } else if (counts["contributors"] > 0) {
    section_order = ["contributors", "photos", "suffix"]
  } else {
    section_order = ["photos", "suffix"]
  }
  const lookup = Text.new_photos
  const pieces = []
  for (const part of section_order) {
    const count = counts[part];
    if (count == 0) {
      continue
    }
    let output = ""
    const message = lookup[part][language]
    for (const i in message) {
      const field = message[i]
      if (field == "<INSERTCOUNT>") {
        output = output + count
      } else {
        output = output + field
      }
    }
    pieces.push(output)
  }
  pieces = Language.unpluralize(pieces)
  // Build a string out of phrases with commas + &
  const p = Language.commaPhrase(pieces)
  p.className = "updatePhotosMessage"
  return shrinkBoxMessage("frontPageSummary", p)
}

export function profile_children(name, childrenCount, daughters, sons, language) {
  const p = document.createElement('p');
  let babies = 0
  if (childrenCount != daughters + sons) {
    babies = childrenCount - daughters - sons;
  }
  // Choose the type of message
  let message = undefined;
  if (daughters > 0 && sons > 0 && babies > 0) {
    message = Text.profile_children_babies;
  } else if (daughters > 0 && sons > 0) {
    message = Text.profile_children;
  } else if (daughters > 0 && babies > 0) {
    message = Text.profile_daughters_babies;
  } else if (sons > 0 && babies > 0) {
    message = Text.profile_sons_babies;
  } else if (daughters > 0) {
    message = Text.profile_daughters;
  } else if (sons > 0) {
    message = Text.profile_sons;
  } else if (babies > 0) {
    message = Text.profile_babies_children;
  } else {
    message = Text.profile_children;
  }
  let output_text = ""
  // Do string replacement
  for (const i in message[language]) {
    const field = message[language][i];
    if (field == "<INSERTNAME>") {
      output_text = output_text.concat(name);
    } else if (field == "<INSERTTOTAL>") {
      output_text = output_text.concat(childrenCount);
    } else if (field == "<INSERTDAUGHTERS>") {
      output_text = output_text.concat(daughters);
    } else if (field == "<INSERTSONS>") {
      output_text = output_text.concat(sons);
    } else if (field == "<INSERTBABIES>") {
      output_text = output_text.concat(babies);
    } else {
      output_text = output_text.concat(field);
    }
  }
  output_text = Language.unpluralize([output_text])[0]
  p.appendChild(document.createTextNode(output_text))
  return shrinkBoxMessage("profileSummary", p)
}

export function profile_family(name, language) {
  const p = document.createElement('p');
  for (const i in Text.profile_family[language]) {
    const field = Text.profile_family[language][i]
    if (field == "<INSERTNAME>") {
      const msg = document.createTextNode(name)
      p.appendChild(msg)
    } else {
      const msg = document.createTextNode(field)
      p.appendChild(msg)
    }
  }
  // Fix s's if it appears
  const innerText = p.innerText;
  p.innerText = innerText.replace("s's", "s'")
  return shrinkBoxMessage("profileSummary", p)
}

export function profile_siblings(name, siblingCount, sisters, brothers, language) {
  const p = document.createElement('p')
  let babies = 0
  if (siblingCount != sisters + brothers) {
    babies = siblingCount - sisters - brothers
  }
  // Choose the type of message
  let message = undefined
  if (sisters > 0 && brothers > 0 && babies > 0) {
    message = Text.profile_siblings_babies
  } else if (sisters > 0 && brothers > 0) {
    message = Text.profile_siblings
  } else if (sisters > 0 && babies > 0) {
    message = Text.profile_sisters_babies
  } else if (brothers > 0 && babies > 0) {
    message = Text.profile_brothers_babies
  } else if (sisters > 0) {
    message = Text.profile_sisters
  } else if (brothers > 0) {
    message = Text.profile_brothers
  } else if (babies > 0) {
    message = Text.profile_babies_siblings
  } else {
    message = Text.profile_siblings
  }
  let output_text = ""
  for (const i in message[language]) {
    const field = message[language][i]
    if (field == "<INSERTNAME>") {
      output_text = output_text.concat(name)
    } else if (field == "<INSERTTOTAL>") {
      output_text = output_text.concat(siblingCount)
    } else if (field == "<INSERTSISTERS>") {
      output_text = output_text.concat(sisters)
    } else if (field == "<INSERTBROTHERS>") {
      output_text = output_text.concat(brothers)
    } else if (field == "<INSERTBABIES>") {
      output_text = output_text.concat(babies)
    } else {
      output_text = output_text.concat(field)
    }
  }
  output_text = Language.unpluralize([output_text])[0]
  p.appendChild(document.createTextNode(output_text))
  return shrinkBoxMessage("profileSummary", p)
}

export function profile_where(name, language) {
  const p = document.createElement('p')
  for (const i in Text.profile_where[language]) {
    const field = Text.profile_where[language][i]
    if (field == "<INSERTNAME>") {
      const msg = document.createTextNode(name)
      p.appendChild(msg)
    } else {
      const msg = document.createTextNode(field)
      p.appendChild(msg)
    }
  }
  return shrinkBoxMessage("profileSummary", p)
}

export function residents(zoo, language) {
  // Zoo search: display a header for the resident animals
  // that didn't recently leave or arrive
  const link = document.createElement('a')
  link.href = "javascript:"
  const linkId = `residents/zoo/${zoo["_id"]}`
  link.id = linkId
  link.addEventListener("click", function() {
    document.getElementById(linkId).scrollIntoView(true)
  })
  const info = Show.acquireZooInfo(zoo, language)
  const p = document.createElement('p')
  for (const i in Text.zoo_header_other_pandas[language]) {
    const field = Text.zoo_header_other_pandas[language][i]
    if (field == "<INSERTZOO>") {
      const msg = document.createTextNode(info.name)
      p.appendChild(msg)
    } else {
      const msg = document.createTextNode(field)
      p.appendChild(msg)
    }
  }
  link.appendChild(p)
  return shrinkBoxMessage("residentsHeader", p)
}

export function shovel_pandas(language) {
  const link = document.createElement('a')
  link.href = "#query/dig"
  const p = document.createElement('p')
  for (const i in Text.shovel_pandas[language]) {
    const field = Text.shovel_pandas[language][i]
    const msg = document.createTextNode(field)
    p.appendChild(msg)
  }
  link.appendChild(p)
  return shrinkBoxMessage("tagSummary", link)
}

export function tag_combo(num, emojis, language) {
  const p = document.createElement('p');
  // Emojis come first!
  for (const emoji of emojis) {
    p.appendChild(document.createTextNode(emoji + " "))
  }
  let output_text = ""
  for (const i in Text.tag_combo[language]) {
    let field = Text.tag_combo[language][i]
    if (field == "<INSERTNUM>") {
      output_text = output_text.concat(num)
    } else {
      if (num == 1) {
        field = Language.unpluralize([field])
      }
      output_text = output_text.concat(field)
    }
  }
  output_text = Language.unpluralize([output_text])[0]
  p.appendChild(document.createTextNode(output_text))
  return shrinkBoxMessage("tagSummary", p)
}

/** 
 * If there was an id as part of a tagExpression, rewrite this message using
 * the panda's localized name instead.
 */
export function tag_subject(num, name, emoji, tag, language) {
  if (Pandas.checkId(name) == true)
    name = Pandas.searchPandaId(name)[0][`${language}.name`]
  if (name != undefined)
    name = Language.capitalNames(name)
  // For translating a tag between languages, we need the first value in
  // the array of tags considered equivalent.
  // Need to look up "baby" info as well from the polyglot list of things
  // that can be either keywords or tags.
  let near_tag = undefined
  if (tag in Tags)
    near_tag = Tags[tag][language][0]
  else
    near_tag = Language.polyglots[tag][language][0]
  const p = document.createElement('p')
  for (const i in Text.tag_subject[language]) {
    let field = Text.tag_subject[language][i]
    if (field == "<INSERTNUM>") {
      const msg = document.createTextNode(num)
      p.appendChild(msg)
    } else if (field == "<INSERTNAME>") {
      const msg = document.createElement('i')
      const text = document.createTextNode(name)
      if (name != undefined) {
        msg.appendChild(text)
        p.appendChild(msg)
      }
    } else if (field == "<INSERTEMOJI>") {
      const msg = document.createTextNode(emoji)
      p.appendChild(msg)
    } else if (field == "<INSERTTAG>") {
      const msg = document.createElement('b')
      const text = document.createTextNode(near_tag)
      msg.appendChild(text)
      p.appendChild(msg)
    } else {
      if (num == 1) {
        field = Language.unpluralize([field])
      }
      const msg = document.createTextNode(field)
      if ((language == "ja") && (i == 1) && (name == undefined)) {
        msg = document.createTextNode("枚")
      }
      p.appendChild(msg)
    }
  }
  return shrinkBoxMessage("tagSummary", p)
}

export function trick_or_treat(language) {
  const link = document.createElement('a')
  link.href = "#query/pumpkin"
  const p = document.createElement('p')
  for (const i in Text.trick_or_treat[language]) {
    const field = Text.trick_or_treat[language][i]
    const msg = document.createTextNode(field)
    p.appendChild(msg)
  }
  link.appendChild(p)
  return shrinkBoxMessage("halloweenSummary", link)
}

/** Messages that spit out a visible div box in the broader UX */
function shrinkBoxMessage(messageClass, shrinkerChild) {
  const shrinker = document.createElement('div')
  shrinker.className = "shrinker"
  shrinker.appendChild(shrinkerChild)
  const message = document.createElement('div')
  message.className = messageClass
  message.appendChild(shrinker)
  return message
}
