// BBSILOG menu and prices supplied by the owner on November 1, 2026.
const products=[
  {
    "name": "Mixsilog",
    "price": 120,
    "img": "mix",
    "cat": "Silog meals",
    "tag": "BEST SELLER",
    "desc": "A little bit of everything. A whole lot of sarap.",
    "bestSeller": true,
    "galleryCrop": [
      35,
      1135,
      650,
      470
    ],
    "gallerySize": [
      1242,
      1856
    ]
  },
  {
    "name": "Lechon Silog",
    "price": 120,
    "img": "lechon",
    "cat": "Silog meals",
    "tag": "CRISPY FAVORITE",
    "desc": "Crispy pork, garlic rice, and a sunny-side-up egg.",
    "badgeLabel": "People's Choice",
    "galleryCrop": [
      25,
      880,
      1180,
      590
    ],
    "gallerySize": [
      1242,
      1837
    ]
  },
  {
    "name": "Spicy Chicken Silog",
    "price": 110,
    "img": "spicy",
    "cat": "Silog meals",
    "tag": "FEEL THE HEAT",
    "desc": "Crispy, spicy chicken with garlic rice and egg.",
    "galleryCrop": [
      20,
      800,
      1200,
      675
    ],
    "gallerySize": [
      1242,
      1844
    ]
  },
  {
    "name": "S1 - Solo Spaghetti",
    "price": 75,
    "img": "spaghetti",
    "cat": "Spaghetti",
    "tag": "MEATY & CHEESY",
    "desc": "The sweet, meaty comfort food you love.",
    "galleryCrop": [
      80,
      1050,
      1080,
      395
    ],
    "gallerySize": [
      1242,
      1849
    ]
  },
  {
    "name": "B1 - 1 pc Burger Steak",
    "price": 70,
    "img": "menu-images/burger-steak-one",
    "cat": "Burger steak",
    "tag": "",
    "desc": "One burger patty with mushroom gravy and plain rice.",
    "illustrative": true
  },
  {
    "name": "B2 - 2 pcs Burger Steak",
    "price": 90,
    "img": "burger",
    "cat": "Burger steak",
    "tag": "HOMEMADE PATTIES",
    "desc": "Beef patties, mushroom gravy, and plain rice.",
    "galleryCrop": [
      60,
      790,
      1110,
      370
    ],
    "gallerySize": [
      1242,
      1850
    ]
  },
  {
    "name": "1 pc Burger Steak Pack",
    "price": 75,
    "img": "packs",
    "cat": "Food packs",
    "tag": "MINIMUM 20 PACKS",
    "desc": "Event food pack with plain rice.",
    "minimumQuantity": 20
  },
  {
    "name": "Boneless Daing Silog",
    "price": 140,
    "img": "daing",
    "cat": "Silog meals",
    "tag": "BEST SELLER",
    "desc": "Boneless daing with rice.",
    "bestSeller": true,
    "galleryCrop": [
      20,
      820,
      735,
      510
    ],
    "gallerySize": [
      1242,
      1641
    ]
  },
  {
    "name": "Special Chicken Silog",
    "price": 140,
    "img": "chicken",
    "cat": "Silog meals",
    "tag": "SPECIAL",
    "desc": "Chicken leg quarter, garlic rice, and egg.",
    "galleryCrop": [
      25,
      860,
      1190,
      690
    ],
    "gallerySize": [
      1242,
      1844
    ]
  },
  {
    "name": "Chicken Adobo Silog",
    "price": 110,
    "img": "adobo",
    "cat": "Silog meals",
    "tag": "TOASTED GARLIC",
    "desc": "Chicken adobo with rice and egg.",
    "galleryCrop": [
      25,
      970,
      1190,
      540
    ],
    "gallerySize": [
      1242,
      1640
    ]
  },
  {
    "name": "Crispy Chichabu Platter",
    "price": 140,
    "img": "chichabu",
    "cat": "Platters",
    "tag": "FOR SHARING",
    "desc": "Crispy Chichabu with dipping vinegar.",
    "badgeLabel": "New Food",
    "galleryCrop": [
      25,
      640,
      1190,
      550
    ],
    "gallerySize": [
      1242,
      1537
    ]
  },
  {
    "name": "Menudo & 3 pc Pork Shanghai Pack",
    "price": 130,
    "img": "packs",
    "cat": "Food packs",
    "tag": "MINIMUM 20 PACKS",
    "desc": "Menudo, 3 pieces pork shanghai, and plain rice.",
    "minimumQuantity": 20
  },
  {
    "name": "Tapa & Chopsuey Pack",
    "price": 150,
    "img": "packs",
    "cat": "Food packs",
    "tag": "MINIMUM 20 PACKS",
    "desc": "Tapa and chopsuey with plain rice.",
    "minimumQuantity": 20
  },
  {
    "name": "Chicken & Spaghetti Pack",
    "price": 140,
    "img": "packs",
    "cat": "Food packs",
    "tag": "MINIMUM 20 PACKS",
    "desc": "Chicken and spaghetti with plain rice.",
    "minimumQuantity": 20
  },
  {
    "name": "2 pc Burger Steak Pack",
    "price": 95,
    "img": "packs",
    "cat": "Food packs",
    "tag": "MINIMUM 20 PACKS",
    "desc": "2 pieces burger steak with plain rice.",
    "minimumQuantity": 20
  },
  {
    "name": "3 pc Pork Shanghai & Burger Steak Pack",
    "price": 100,
    "img": "packs",
    "cat": "Food packs",
    "tag": "MINIMUM 20 PACKS",
    "desc": "3 pieces pork shanghai and burger steak with plain rice.",
    "minimumQuantity": 20
  },
  {
    "name": "Breaded Pork & Chopsuey Pack",
    "price": 120,
    "img": "packs",
    "cat": "Food packs",
    "tag": "MINIMUM 20 PACKS",
    "desc": "Breaded pork and chopsuey with plain rice.",
    "minimumQuantity": 20
  },
  {
    "name": "Sizzling Plates — Unli Gravy",
    "price": null,
    "img": "sizzling",
    "cat": "Sizzling plates",
    "tag": "ASK FOR PRICE",
    "desc": "Message us for available sizzling plates and prices."
  },
  {
    "name": "Customize Your Food Pack",
    "price": null,
    "img": "packs",
    "cat": "Food packs",
    "tag": "MINIMUM 20 PACKS",
    "desc": "Choose your combination: menudo, kaldereta, pork sisig, pork shanghai, pork steak, chicken or pork adobo, burger steak, chicken, breaded pork, tapa, BBQ liempo, marinated pork, spaghetti, chopsuey, beef pares, tocino, spam, corned beef, chicken ala king, buttered chicken, lechon kawali, chicharon bulaklak, hotdog, quarter chicken, or Hungarian. Quote via Messenger.",
    "minimumQuantity": 20
  },
  {
    "name": "Sizzling Pork Sisig",
    "price": 120,
    "img": "sisig-meal",
    "cat": "Sizzling plates",
    "tag": "SIZZLING SISIG",
    "desc": "Pork sisig with rice.",
    "crop": [
      155,
      510,
      810,
      380
    ],
    "size": [
      1080,
      1080
    ]
  },
  {
    "name": "Sisig Platter",
    "price": 150,
    "img": "sisig-platter-food",
    "cat": "Platters",
    "bestSeller": true,
    "tag": "BEST SELLER",
    "desc": "Pork sisig platter for sharing."
  },
  {
    "name": "Marinated Porksilog",
    "price": 110,
    "img": "marinated-pork",
    "cat": "Silog meals",
    "bestSeller": true,
    "tag": "BEST SELLER",
    "desc": "Marinated pork with rice and egg.",
    "crop": [
      280,
      790,
      740,
      420
    ],
    "size": [
      1086,
      1448
    ],
    "galleryCrop": [
      50,
      850,
      630,
      430
    ],
    "gallerySize": [
      1086,
      1448
    ]
  },
  {
    "name": "Breaded Porksilog",
    "price": 110,
    "img": "breaded-pork",
    "cat": "Silog meals",
    "bestSeller": true,
    "tag": "BEST SELLER",
    "desc": "Breaded pork with rice and egg.",
    "crop": [
      410,
      750,
      610,
      530
    ],
    "size": [
      1086,
      1448
    ],
    "galleryCrop": [
      425,
      750,
      610,
      510
    ],
    "gallerySize": [
      1086,
      1448
    ]
  },
  {
    "name": "Tapa Silog",
    "price": 120,
    "img": "tapa",
    "cat": "Silog meals",
    "bestSeller": true,
    "tag": "BEST SELLER",
    "desc": "Tapa with rice and egg.",
    "crop": [
      640,
      650,
      445,
      620
    ],
    "size": [
      1086,
      1448
    ],
    "galleryCrop": [
      650,
      670,
      435,
      590
    ],
    "gallerySize": [
      1086,
      1448
    ]
  },
  {
    "name": "BBQ Liempo Silog",
    "price": 120,
    "img": "bbq-liempo",
    "cat": "Silog meals",
    "bestSeller": true,
    "tag": "BEST SELLER",
    "desc": "BBQ liempo with rice and egg.",
    "crop": [
      570,
      550,
      515,
      760
    ],
    "size": [
      1086,
      1448
    ],
    "galleryCrop": [
      575,
      600,
      505,
      660
    ],
    "gallerySize": [
      1086,
      1448
    ]
  },
  {
    "name": "Bacsilog",
    "price": 110,
    "img": "bacsilog",
    "cat": "Silog meals",
    "bestSeller": true,
    "tag": "BEST SELLER",
    "desc": "Bacon, rice, egg, and creamy sauce.",
    "crop": [
      410,
      680,
      610,
      600
    ],
    "size": [
      1024,
      1536
    ],
    "galleryCrop": [
      410,
      700,
      610,
      560
    ],
    "gallerySize": [
      1024,
      1536
    ]
  },
  {
    "name": "Spam Silog",
    "price": 100,
    "img": "spam",
    "cat": "Silog meals",
    "bestSeller": true,
    "tag": "BEST SELLER",
    "desc": "Spam with rice and egg.",
    "crop": [
      60,
      790,
      950,
      425
    ],
    "size": [
      1024,
      1536
    ],
    "galleryCrop": [
      45,
      810,
      960,
      385
    ],
    "gallerySize": [
      1024,
      1536
    ]
  },
  {
    "name": "B3 - Supreme Burger Steak",
    "price": 130,
    "img": "supreme-burger",
    "cat": "Burger steak",
    "bestSeller": true,
    "tag": "BEST SELLER",
    "desc": "Burger steak with mushroom gravy, rice, egg, and fries.",
    "crop": [
      45,
      970,
      960,
      475
    ],
    "size": [
      1024,
      1536
    ],
    "galleryCrop": [
      50,
      985,
      950,
      455
    ],
    "gallerySize": [
      1024,
      1536
    ]
  },
  {
    "name": "Sizzling Ala Max Chicken",
    "price": 160,
    "img": "sizzling",
    "cat": "Sizzling plates",
    "allowRequest": true,
    "tag": "UNLI GRAVY",
    "desc": "Chicken with java rice, vegetables, and gravy.",
    "crop": [
      650,
      500,
      570,
      290
    ],
    "size": [
      1242,
      1649
    ]
  },
  {
    "name": "Sizzling Porkchop",
    "price": 140,
    "img": "sizzling",
    "cat": "Sizzling plates",
    "allowRequest": true,
    "tag": "UNLI GRAVY",
    "desc": "Porkchop with java rice, vegetables, and gravy.",
    "crop": [
      55,
      535,
      575,
      260
    ],
    "size": [
      1242,
      1649
    ]
  },
  {
    "name": "Sizzling Liempo",
    "price": 140,
    "img": "sizzling",
    "cat": "Sizzling plates",
    "allowRequest": true,
    "tag": "UNLI GRAVY",
    "desc": "Liempo with java rice and gravy.",
    "crop": [
      30,
      1080,
      600,
      240
    ],
    "size": [
      1242,
      1649
    ]
  },
  {
    "name": "Mango Graham Smoothie — 16 oz",
    "price": 75,
    "img": "mango-smoothie",
    "cat": "Smoothies",
    "allowRequest": true,
    "bestSeller": false,
    "tag": "MANGO GRAHAM",
    "desc": "Creamy mango smoothie with graham.",
    "badgeLabel": "People's Favorite",
    "baseName": "Mango Graham Smoothie",
    "sizeLabel": "16 oz"
  },
  {
    "name": "Mango Graham Smoothie — 22 oz",
    "price": 95,
    "img": "mango-smoothie",
    "cat": "Smoothies",
    "allowRequest": true,
    "bestSeller": false,
    "tag": "MANGO GRAHAM",
    "desc": "Creamy mango smoothie with graham.",
    "badgeLabel": "People's Favorite",
    "baseName": "Mango Graham Smoothie",
    "sizeLabel": "22 oz"
  },
  {
    "name": "Choco Fudge Smoothie — 16 oz",
    "price": 55,
    "img": "choco-smoothie",
    "cat": "Smoothies",
    "allowRequest": true,
    "bestSeller": false,
    "tag": "CHOCO FUDGE",
    "desc": "Chocolate smoothie with fudge drizzle.",
    "baseName": "Choco Fudge Smoothie",
    "sizeLabel": "16 oz"
  },
  {
    "name": "Choco Fudge Smoothie — 22 oz",
    "price": 75,
    "img": "choco-smoothie",
    "cat": "Smoothies",
    "allowRequest": true,
    "bestSeller": false,
    "tag": "CHOCO FUDGE",
    "desc": "Chocolate smoothie with fudge drizzle.",
    "baseName": "Choco Fudge Smoothie",
    "sizeLabel": "22 oz"
  },
  {
    "name": "Creamy Avocado Smoothie — 16 oz",
    "price": 75,
    "img": "avocado",
    "cat": "Smoothies",
    "allowRequest": true,
    "bestSeller": true,
    "tag": "CREAMY AVOCADO",
    "desc": "Creamy avocado smoothie.",
    "crop": [
      540,
      170,
      500,
      1250
    ],
    "size": [
      1086,
      1448
    ],
    "baseName": "Creamy Avocado Smoothie",
    "sizeLabel": "16 oz"
  },
  {
    "name": "Creamy Avocado Smoothie — 22 oz",
    "price": 95,
    "img": "avocado",
    "cat": "Smoothies",
    "allowRequest": true,
    "bestSeller": true,
    "tag": "CREAMY AVOCADO",
    "desc": "Creamy avocado smoothie.",
    "crop": [
      540,
      170,
      500,
      1250
    ],
    "size": [
      1086,
      1448
    ],
    "baseName": "Creamy Avocado Smoothie",
    "sizeLabel": "22 oz"
  },
  {
    "name": "Creamy Melon Smoothie — 16 oz",
    "price": 75,
    "img": "melon",
    "cat": "Smoothies",
    "allowRequest": true,
    "bestSeller": true,
    "tag": "CREAMY MELON",
    "desc": "Creamy melon smoothie.",
    "crop": [
      570,
      320,
      510,
      1090
    ],
    "size": [
      1086,
      1448
    ],
    "baseName": "Creamy Melon Smoothie",
    "sizeLabel": "16 oz"
  },
  {
    "name": "Creamy Melon Smoothie — 22 oz",
    "price": 95,
    "img": "melon",
    "cat": "Smoothies",
    "allowRequest": true,
    "bestSeller": true,
    "tag": "CREAMY MELON",
    "desc": "Creamy melon smoothie.",
    "crop": [
      570,
      320,
      510,
      1090
    ],
    "size": [
      1086,
      1448
    ],
    "baseName": "Creamy Melon Smoothie",
    "sizeLabel": "22 oz"
  },
  {
    "name": "Plain Rice",
    "price": 20,
    "cat": "Extras",
    "desc": "One extra serving of plain rice.",
    "img": "menu-images/extra-plain-rice",
    "illustrative": true
  },
  {
    "name": "Extra Egg",
    "price": 20,
    "cat": "Extras",
    "desc": "One extra egg.",
    "img": "menu-images/extra-egg",
    "illustrative": true
  },
  {
    "name": "Hotsilog",
    "price": 75,
    "img": "menu-images/hotsilog",
    "cat": "₱75 Meals",
    "tag": "",
    "desc": "Served with garlic rice and egg.",
    "illustrative": true
  },
  {
    "name": "Longsilog",
    "price": 75,
    "img": "menu-images/longsilog",
    "cat": "₱75 Meals",
    "tag": "",
    "desc": "Served with garlic rice and egg.",
    "illustrative": true
  },
  {
    "name": "Malingsilog",
    "price": 75,
    "img": "menu-images/malingsilog",
    "cat": "₱75 Meals",
    "tag": "",
    "desc": "Served with garlic rice and egg.",
    "illustrative": true
  },
  {
    "name": "Beef Pares",
    "price": 130,
    "img": "menu-images/beef-pares",
    "cat": "BB Specials",
    "tag": "",
    "desc": "Beef pares served with rice.",
    "illustrative": true
  },
  {
    "name": "Lechon Pares",
    "price": 130,
    "img": "menu-images/lechon-pares",
    "cat": "BB Specials",
    "tag": "",
    "desc": "Lechon pares served with rice.",
    "illustrative": true
  },
  {
    "name": "Pares Overload - Beef with Chichabu",
    "price": 150,
    "img": "menu-images/pares-overload",
    "cat": "BB Specials",
    "tag": "",
    "desc": "Beef pares with crispy Chichabu and rice.",
    "illustrative": true
  },
  {
    "name": "Pares Overload - Lechon with Chichabu",
    "price": 150,
    "img": "menu-images/lechon-pares-overload",
    "cat": "BB Specials",
    "tag": "",
    "desc": "Lechon pares with crispy Chichabu and rice.",
    "illustrative": true
  },
  {
    "name": "Garlic Rice",
    "price": 25,
    "img": "menu-images/extra-garlic-rice",
    "cat": "Extras",
    "tag": "",
    "desc": "One serving of garlic rice.",
    "illustrative": true
  },
  {
    "name": "Java Rice",
    "price": 25,
    "img": "menu-images/extra-java-rice",
    "cat": "Extras",
    "tag": "",
    "desc": "One serving of java rice.",
    "illustrative": true
  },
  {
    "name": "Silog",
    "price": 55,
    "img": "menu-images/extra-silog",
    "cat": "Extras",
    "tag": "",
    "desc": "Rice and egg.",
    "illustrative": true
  },
  {
    "name": "Hotdog",
    "price": 35,
    "img": "menu-images/extra-hotdog",
    "cat": "Extras",
    "tag": "",
    "desc": "An extra hotdog.",
    "illustrative": true
  },
  {
    "name": "Gravy",
    "price": 20,
    "img": "menu-images/extra-gravy",
    "cat": "Extras",
    "tag": "",
    "desc": "An extra serving of gravy.",
    "illustrative": true
  },
  {
    "name": "Spam - 2 pcs",
    "price": 75,
    "img": "menu-images/extra-spam-two",
    "cat": "Extras",
    "tag": "",
    "desc": "Two pieces of Spam.",
    "illustrative": true
  },
  {
    "name": "S2 - Chicken Spaghetti",
    "price": 145,
    "img": "menu-images/chicken-spaghetti",
    "cat": "Spaghetti",
    "tag": "",
    "desc": "Spaghetti with chicken.",
    "illustrative": true
  },
  {
    "name": "S3 - Spaghetti with Burger Steak",
    "price": 145,
    "img": "menu-images/burger-spaghetti-rice",
    "cat": "Spaghetti",
    "tag": "",
    "desc": "Spaghetti with burger steak, mushroom gravy, and plain rice.",
    "illustrative": true
  },
  {
    "name": "Sizzling Hotdog Platter",
    "price": 130,
    "img": "menu-images/hotdog-platter",
    "cat": "Platters",
    "tag": "",
    "desc": "Sizzling hotdogs for sharing.",
    "illustrative": true
  },
  {
    "name": "Lechon Kawali Platter",
    "price": 160,
    "img": "menu-images/lechon-kawali-platter",
    "cat": "Platters",
    "tag": "",
    "desc": "Lechon kawali for sharing.",
    "illustrative": true
  },
  {
    "name": "Buttered Chicken",
    "price": 180,
    "img": "menu-images/buttered-chicken",
    "cat": "Platters",
    "tag": "",
    "desc": "Buttered chicken for sharing.",
    "illustrative": true
  },
  {
    "name": "Oreo Smoothie — 16 oz",
    "img": "menu-images/oreo-smoothie",
    "cat": "Smoothies",
    "tag": "",
    "desc": "Oreo Smoothie.",
    "illustrative": true,
    "baseName": "Oreo Smoothie",
    "sizeLabel": "16 oz",
    "price": 75
  },
  {
    "name": "Oreo Smoothie — 22 oz",
    "img": "menu-images/oreo-smoothie",
    "cat": "Smoothies",
    "tag": "",
    "desc": "Oreo Smoothie.",
    "illustrative": true,
    "baseName": "Oreo Smoothie",
    "sizeLabel": "22 oz",
    "price": 95
  },
  {
    "name": "Cheese Smoothie — 16 oz",
    "img": "menu-images/cheese-smoothie",
    "cat": "Smoothies",
    "tag": "",
    "desc": "Cheese Smoothie.",
    "illustrative": true,
    "baseName": "Cheese Smoothie",
    "sizeLabel": "16 oz",
    "price": 75
  },
  {
    "name": "Cheese Smoothie — 22 oz",
    "img": "menu-images/cheese-smoothie",
    "cat": "Smoothies",
    "tag": "",
    "desc": "Cheese Smoothie.",
    "illustrative": true,
    "baseName": "Cheese Smoothie",
    "sizeLabel": "22 oz",
    "price": 95
  },
  {
    "name": "Mocha Smoothie — 16 oz",
    "img": "menu-images/mocha-smoothie",
    "cat": "Smoothies",
    "tag": "",
    "desc": "Mocha Smoothie.",
    "illustrative": true,
    "baseName": "Mocha Smoothie",
    "sizeLabel": "16 oz",
    "price": 75
  },
  {
    "name": "Mocha Smoothie — 22 oz",
    "img": "menu-images/mocha-smoothie",
    "cat": "Smoothies",
    "tag": "",
    "desc": "Mocha Smoothie.",
    "illustrative": true,
    "baseName": "Mocha Smoothie",
    "sizeLabel": "22 oz",
    "price": 95
  },
  {
    "name": "Cheesecake Smoothie — 16 oz",
    "img": "menu-images/cheesecake-smoothie",
    "cat": "Smoothies",
    "tag": "",
    "desc": "Cheesecake Smoothie.",
    "illustrative": true,
    "baseName": "Cheesecake Smoothie",
    "sizeLabel": "16 oz",
    "price": 75
  },
  {
    "name": "Cheesecake Smoothie — 22 oz",
    "img": "menu-images/cheesecake-smoothie",
    "cat": "Smoothies",
    "tag": "",
    "desc": "Cheesecake Smoothie.",
    "illustrative": true,
    "baseName": "Cheesecake Smoothie",
    "sizeLabel": "22 oz",
    "price": 95
  },
  {
    "name": "Mango Caramel Smoothie — 16 oz",
    "img": "menu-images/mango-caramel-smoothie",
    "cat": "Smoothies",
    "tag": "",
    "desc": "Mango Caramel Smoothie.",
    "illustrative": true,
    "baseName": "Mango Caramel Smoothie",
    "sizeLabel": "16 oz",
    "price": 75
  },
  {
    "name": "Mango Caramel Smoothie — 22 oz",
    "img": "menu-images/mango-caramel-smoothie",
    "cat": "Smoothies",
    "tag": "",
    "desc": "Mango Caramel Smoothie.",
    "illustrative": true,
    "baseName": "Mango Caramel Smoothie",
    "sizeLabel": "22 oz",
    "price": 95
  },
  {
    "name": "Mango Cheese Smoothie — 16 oz",
    "img": "menu-images/mango-cheese-smoothie",
    "cat": "Smoothies",
    "tag": "",
    "desc": "Mango Cheese Smoothie.",
    "illustrative": true,
    "baseName": "Mango Cheese Smoothie",
    "sizeLabel": "16 oz",
    "price": 75
  },
  {
    "name": "Mango Cheese Smoothie — 22 oz",
    "img": "menu-images/mango-cheese-smoothie",
    "cat": "Smoothies",
    "tag": "",
    "desc": "Mango Cheese Smoothie.",
    "illustrative": true,
    "baseName": "Mango Cheese Smoothie",
    "sizeLabel": "22 oz",
    "price": 95
  },
  {
    "name": "Mango Oreo Smoothie — 16 oz",
    "img": "menu-images/mango-oreo-smoothie",
    "cat": "Smoothies",
    "tag": "",
    "desc": "Mango Oreo Smoothie.",
    "illustrative": true,
    "baseName": "Mango Oreo Smoothie",
    "sizeLabel": "16 oz",
    "price": 75
  },
  {
    "name": "Mango Oreo Smoothie — 22 oz",
    "img": "menu-images/mango-oreo-smoothie",
    "cat": "Smoothies",
    "tag": "",
    "desc": "Mango Oreo Smoothie.",
    "illustrative": true,
    "baseName": "Mango Oreo Smoothie",
    "sizeLabel": "22 oz",
    "price": 95
  },
  {
    "name": "Mango Smoothie — 16 oz",
    "img": "menu-images/mango-plain-smoothie",
    "cat": "Smoothies",
    "tag": "",
    "desc": "Mango Smoothie.",
    "illustrative": true,
    "baseName": "Mango Smoothie",
    "sizeLabel": "16 oz",
    "price": 75
  },
  {
    "name": "Mango Smoothie — 22 oz",
    "img": "menu-images/mango-plain-smoothie",
    "cat": "Smoothies",
    "tag": "",
    "desc": "Mango Smoothie.",
    "illustrative": true,
    "baseName": "Mango Smoothie",
    "sizeLabel": "22 oz",
    "price": 95
  },
  {
    "name": "Avocado Mango Smoothie",
    "price": 100,
    "img": "menu-images/avocado-mango-smoothie",
    "cat": "Smoothies",
    "tag": "",
    "desc": "Avocado Mango Smoothie.",
    "illustrative": true
  },
  {
    "name": "Avocado Graham",
    "price": 100,
    "img": "menu-images/avocado-graham-smoothie",
    "cat": "Smoothies",
    "tag": "",
    "desc": "Avocado Graham.",
    "illustrative": true
  },
  {
    "name": "Mango Keso Cheesecake",
    "price": 100,
    "img": "menu-images/mango-keso-cheesecake-smoothie",
    "cat": "Smoothies",
    "tag": "",
    "desc": "Mango Keso Cheesecake.",
    "illustrative": true,
    "bestSeller": true
  },
  {
    "name": "Corned Beef Silog (Premium Corned Beef)",
    "price": 110,
    "img": "menu-images/corned-beef-silog",
    "cat": "Silog meals",
    "tag": "",
    "desc": "Premium corned beef with garlic rice and egg.",
    "illustrative": true
  },
  {
    "name": "Tocilog",
    "price": 100,
    "img": "menu-images/tocilog",
    "cat": "Silog meals",
    "tag": "",
    "desc": "Pork tocino with garlic rice and egg.",
    "illustrative": true
  },
  {
    "name": "Chicken Silog",
    "price": 100,
    "img": "menu-images/chicken-silog",
    "cat": "Silog meals",
    "tag": "",
    "desc": "Chicken with garlic rice and egg.",
    "illustrative": true
  },
  {
    "name": "Hungarian Silog",
    "price": 100,
    "img": "menu-images/hungarian-silog",
    "cat": "Silog meals",
    "tag": "",
    "desc": "Hungarian sausage with garlic rice and egg.",
    "illustrative": true
  },
  {
    "name": "Chichabu Silog",
    "price": 100,
    "img": "menu-images/chichabu-silog",
    "cat": "Silog meals",
    "tag": "",
    "desc": "Crispy Chichabu with garlic rice and egg.",
    "illustrative": true
  },
  {
    "name": "Tinapa Silog",
    "price": 100,
    "img": "menu-images/tinapa-silog",
    "cat": "Silog meals",
    "tag": "",
    "desc": "Smoked fish with garlic rice and egg.",
    "illustrative": true
  },
  {
    "name": "Sizzling Lechon",
    "price": 140,
    "img": "menu-images/sizzling-lechon",
    "cat": "Sizzling plates",
    "tag": "",
    "desc": "Sizzling lechon with java rice, vegetables, and gravy.",
    "illustrative": true
  },
  {
    "name": "Sizzling Double Decker",
    "price": 120,
    "img": "menu-images/sizzling-double-decker-cheese",
    "cat": "Sizzling plates",
    "tag": "",
    "desc": "Two burger patties with cheese between them, gravy, and java rice.",
    "illustrative": true
  },
  {
    "name": "Sizzling Hungarian",
    "price": 130,
    "img": "menu-images/sizzling-hungarian",
    "cat": "Sizzling plates",
    "tag": "",
    "desc": "Hungarian sausage with java rice, vegetables, and gravy.",
    "illustrative": true
  },
  {
    "name": "Sizzling Chicken",
    "price": 130,
    "img": "menu-images/sizzling-chicken",
    "cat": "Sizzling plates",
    "tag": "",
    "desc": "Chicken with java rice, vegetables, and gravy.",
    "illustrative": true
  },
  {
    "name": "Sizzling Marinated Pork",
    "price": 140,
    "img": "menu-images/sizzling-marinated-pork",
    "cat": "Sizzling plates",
    "tag": "",
    "desc": "Marinated pork with java rice, vegetables, and gravy.",
    "illustrative": true
  },
  {
    "name": "Garlic Pepper Beef",
    "price": 160,
    "img": "menu-images/garlic-pepper-beef",
    "cat": "BB Specials",
    "tag": "LIMITED EDITION",
    "desc": "Tender beef in garlic pepper gravy with rice.",
    "limitedEdition": true
  },
  {
    "name": "Chicken Ala King",
    "price": 100,
    "img": "menu-images/chicken-ala-king",
    "cat": "BB Specials",
    "tag": "LIMITED EDITION",
    "desc": "Creamy chicken ala king with rice.",
    "limitedEdition": true
  }
];
const categories=[
  [
    "Silog meals",
    "mix"
  ],
  [
    "₱75 Meals",
    "menu-images/hotsilog"
  ],
  [
    "BB Specials",
    "menu-images/beef-pares"
  ],
  [
    "Burger steak",
    "burger"
  ],
  [
    "Spaghetti",
    "spaghetti"
  ],
  [
    "Food packs",
    "packs"
  ],
  [
    "Sizzling plates",
    "sizzling"
  ],
  [
    "Platters",
    "sisig-platter-food"
  ],
  [
    "Smoothies",
    "mango-smoothie"
  ]
];

function menuProductName(product){return product.baseName||product.name;}
function menuVariants(product){return product.baseName?products.filter(p=>p.baseName===product.baseName):[product];}
function menuDisplayProducts(items){const seen=new Set();return items.filter(p=>{const name=menuProductName(p);if(seen.has(name))return false;seen.add(name);return true;});}
function menuPriceLabel(product){if(product.cat==='Food packs')return product.price===null?'Inquire for a quote':'₱'+product.price+' per pack';return menuVariants(product).map(p=>(p.sizeLabel?p.sizeLabel+' — ':'')+(p.price===null?'Price to confirm':'₱'+p.price)).join(' / ');}
