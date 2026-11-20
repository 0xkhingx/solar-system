// One entry per body. Everything the explorer and the hub need to render a planet lives here.
//
// map            : local texture in maps/ (James Hastings-Trew's 1k planet maps; credit required, check his terms for
//                  commercial use). `fallbackMap` is tried if it fails, then a procedural stand-in from `proc`.
// region / sites : real latitude / longitude on a standard equirectangular map (prime meridian in the centre).
//                  For the gas giants the longitudes of storms drift, so nudge them to match the texture you drop in.
// landing        : 'surface' uses land/fore images when given, else an orbital close-up of the map at the site.
//                  'clouds' is a procedural cloud-deck descent tinted with the three colours given.

// Site photos live in photos/ (Earth: Wikimedia Commons, credits in each site; Mars: NASA photos, with generated foreground and card layers credited as illustration).

export const BODIES = [
  {
    id: 'mercury', name: 'Mercury', word: 'MERCURY', eyebrow: 'Closest to the Sun', tagline: 'A scorched, cratered world',
    map: 'maps/1k_mercury.jpg',
    proc: {bands: false, pal: ['#3a3634', '#6b6561', '#8f8883', '#b8b1aa'], scale: 3.2},
    palette: {deep: '#141211', bg: ['#6f6762', '#45403c', '#262321', '#100f0e'], accent: '#e9b25a',
      flare: ['rgba(255,245,225,.95)', 'rgba(255,210,150,.4)', 'rgba(255,190,120,.1)'], fog: ['#efe6da', '#d6c8b6', '#6f6258'], scrim: '20,18,16'},
    shader: {gamma: 2.1, tint: [1.02, .98, .94], relief: 2.2, hiCol: [.75, .45, .06], rim: [1, .85, .6], atmo: {color: [1, .9, .75], strength: .25, radius: 1.08}},
    restPitch: .16,
    region: {name: 'Caloris Basin', lat: 30.5, lon: -170.2, r: .5,
        photo: 'photos/mercury-caloris.jpg', credit: 'NASA / JHU APL / Carnegie (MESSENGER) · Public domain'},
    sites: [
      {name: 'Caloris Basin', lat: 30.5, lon: -170.2, note: 'A 1,550 km impact basin ringed by mountains'},
      {name: 'Rachmaninoff', lat: 27.6, lon: 57.6, note: 'A double-ring crater with a smooth, young floor',
        photo: 'photos/mercury-rachmaninoff.jpg', credit: 'NASA / JHU APL / Carnegie (MESSENGER) · Public domain'},
      {name: 'Kuiper Crater', lat: -11.4, lon: -31.4, note: 'One of the brightest spots on the planet',
        photo: 'photos/mercury-kuiper.jpg', credit: 'NASA / JHU APL / Carnegie (MESSENGER) · Public domain'},
      {name: 'Hokusai', lat: 57.8, lon: 16.8, note: 'Rays of ejecta stretch across the hemisphere',
        photo: 'photos/mercury-hokusai.jpg', credit: 'NASA / JHU APL / Carnegie (MESSENGER) · Public domain'}
    ],
    landing: {type: 'surface'},
    facts: [{label: 'Gravity', value: '0.38 g'}, {label: 'Day length', value: '176 Earth days'}, {label: 'Surface', value: '−173 to 427 °C'}]
  },
  {
    id: 'venus', name: 'Venus', word: 'VENUS', eyebrow: 'Beneath the clouds of', tagline: 'Radar sees through the acid haze',
    map: 'maps/1k_venus.jpg',
    proc: {bands: false, pal: ['#6a3d12', '#a86a2a', '#d9a35a', '#f1d39a'], scale: 2.4},
    palette: {deep: '#2a1a06', bg: ['#e3b45e', '#a97731', '#5f3f12', '#2a1a06'], accent: '#ff8a3d',
      flare: ['rgba(255,245,210,.95)', 'rgba(255,200,110,.42)', 'rgba(255,170,70,.1)'], fog: ['#fbe9c6', '#f2cf8f', '#a86a2a'], scrim: '50,28,6'},
    shader: {gamma: 2.0, tint: [1.25, .95, .58], relief: 1.6, hiCol: [.72, .18, .02], rim: [1, .75, .35], atmo: {color: [1, .85, .5], strength: 1.1, radius: 1.16}},
    restPitch: .16,
    region: {name: 'Ishtar Terra', lat: 70, lon: 27.5, r: .5},
    sites: [
      {name: 'Maxwell Montes', lat: 65.2, lon: 3.3, note: 'The highest mountain on Venus, 11 km up',
        photo: 'photos/venus-maxwell.jpg', credit: 'NASA / JPL (Magellan radar) · Public domain'},
      {name: 'Maat Mons', lat: .5, lon: -165.4, note: 'A volcano that may still be erupting',
        photo: 'photos/venus-maat.jpg', credit: 'NASA / JPL (Magellan radar) · Public domain · 3D perspective, height exaggerated'},
      {name: 'Alpha Regio', lat: -25.5, lon: 1.3, note: 'Crumpled highland terrain, the first feature ever mapped',
        photo: 'photos/venus-alpha.jpg', credit: 'NASA / JPL (Magellan radar) · Public domain · 3D perspective'},
      {name: 'Aphrodite Terra', lat: -5, lon: 105, note: 'A continent-sized highland along the equator',
        photo: 'photos/venus-aphrodite.jpg', credit: 'NASA / JPL (Magellan radar) · Public domain · Latona Corona and Dali Chasma, 3D perspective'}
    ],
    landing: {type: 'surface'},
    facts: [{label: 'Gravity', value: '0.90 g'}, {label: 'Day length', value: '243 Earth days'}, {label: 'Surface', value: '465 °C'}]
  },
  {
    id: 'earth', name: 'Earth', word: 'EARTH', eyebrow: 'Home. Seen from', tagline: 'The only ocean world we know',
    map: 'maps/1k_earth.jpg',
    clouds: 'maps/1k_earth_clouds.jpg', night: 'maps/1k_earth_night.jpg', spec: 'maps/1k_earth_spec.jpg', bump: 'maps/1k_earth_bump.jpg',
    liveSun: true,   // lit from where the Sun really is right now
    geo: 'data/countries.json',   // country borders (Natural Earth 110m): hover names the country and continent
    // Earth through time, oldest first; today is the implicit last stop. Maps: C. R. Scotese, PALEOMAP PaleoAtlas (CC BY 4.0).
    history: [
      {map: 'maps/paleo/750.jpg', when: '750 million years ago', period: 'Cryogenian', title: 'Rodinia breaks apart',
        text: 'The supercontinent Rodinia is splitting. Life is still microscopic, and the planet is heading into its deepest ice ages, the Snowball Earth glaciations.'},
      {map: 'maps/paleo/540.jpg', when: '540 million years ago', period: 'Cambrian', title: 'The Cambrian explosion',
        text: 'Most land lies in the southern hemisphere, where the giant continent Gondwana has formed. In the seas, nearly every major group of animals appears within a few tens of millions of years.'},
      {map: 'maps/paleo/400.jpg', when: '400 million years ago', period: 'Devonian', title: 'Life moves ashore',
        text: 'Plants are spreading over the land and the first forests are close. Fish rule the seas, and the first four-limbed animals will soon leave the water.'},
      {map: 'maps/paleo/300.jpg', when: '300 million years ago', period: 'Carboniferous', title: 'The coal forests',
        text: 'Vast swamp forests are laying down much of the world\u2019s coal. Ice covers the southern lands as the continents close in to build Pangaea.'},
      {map: 'maps/paleo/250.jpg', when: '250 million years ago', period: 'Permian to Triassic', title: 'Pangaea and the Great Dying',
        text: 'Almost all land is joined in one supercontinent, Pangaea. The largest mass extinction in Earth\u2019s history wipes out most species in the oceans.'},
      {map: 'maps/paleo/200.jpg', when: '200 million years ago', period: 'Triassic to Jurassic', title: 'Pangaea begins to split',
        text: 'Rifts are opening between North America and Africa, where the Atlantic will form. After another mass extinction, dinosaurs take over the land.'},
      {map: 'maps/paleo/150.jpg', when: '150 million years ago', period: 'Jurassic', title: 'The age of giants',
        text: 'The young Atlantic is a narrow sea. Giant sauropods walk the continents and the first birds take to the air.'},
      {map: 'maps/paleo/100.jpg', when: '100 million years ago', period: 'Cretaceous', title: 'A hothouse world',
        text: 'There is little or no ice at the poles, and seas far higher than today flood the continents. South America and Africa have just parted.'},
      {map: 'maps/paleo/066.jpg', when: '66 million years ago', period: 'End of the Cretaceous', title: 'The asteroid',
        text: 'An asteroid about 10 km across strikes what is now the Yucat\u00e1n in Mexico. The dinosaurs, apart from the birds, die out, while India drifts north toward Asia.'},
      {map: 'maps/paleo/035.jpg', when: '35 million years ago', period: 'Eocene', title: 'The world cools',
        text: 'Antarctica, now alone at the south pole, begins to freeze over. India is colliding with Asia and pushing up the Himalaya.'},
      {map: 'maps/paleo/001.jpg', when: '20,000 years ago', period: 'Last ice age', title: 'The last ice age',
        text: 'Ice sheets kilometres thick cover Canada and northern Europe. The sea is about 120 m lower, joining Siberia to Alaska and Britain to the mainland.'}
    ],
    proc: {bands: false, pal: ['#0b2a5c', '#17519a', '#3f8a4a', '#8c7a4a', '#e8e8e8'], scale: 2.0},
    palette: {deep: '#03091a', bg: ['#2d74b8', '#15406f', '#081d38', '#03091a'], accent: '#4dd0ff',
      flare: ['rgba(235,245,255,.95)', 'rgba(150,200,255,.42)', 'rgba(100,160,255,.1)'], fog: ['#e9f3ff', '#c6dcf4', '#4a79a8'], scrim: '4,14,32'},
    shader: {gamma: 2.0, tint: [1, 1, 1.02], relief: .7, hiCol: [.05, .75, .5], rim: [.5, .75, 1], atmo: {color: [.45, .7, 1], strength: 1.15, radius: 1.14}},
    restPitch: .16,
    region: {name: 'The Himalaya', lat: 30, lon: 85, r: .32},
    // photo: a real photograph of the place, used for the card and the landing.
    // place: shown above the site name on the landing when the site is outside the highlighted region.
    sites: [
      {name: 'Mount Everest', lat: 27.99, lon: 86.93, note: 'The roof of the world, 8,849 m',
        photo: 'photos/earth-everest.jpg', credit: 'Photo: Vyacheslav Argenberg · CC BY 4.0 · Wikimedia Commons'},
      {name: 'Sahara', place: 'North Africa', lat: 23, lon: 13, note: 'A desert the size of the United States',
        photo: 'photos/earth-sahara.jpg', credit: 'Photo: Luca Galuzzi · CC BY-SA 2.5 · Wikimedia Commons'},
      {name: 'Great Barrier Reef', place: 'Australia', lat: -18.3, lon: 147.7, note: 'The largest living structure on the planet',
        photo: 'photos/earth-reef.jpg', credit: 'Photo: Ank Kumar · CC BY-SA 4.0 · Wikimedia Commons'},
      {name: 'Grand Canyon', place: 'Arizona', lat: 36.1, lon: -112.1, note: 'Two billion years of rock laid open',
        photo: 'photos/earth-canyon.jpg', credit: 'Photo: Eric Kilby · CC BY-SA 2.0 · Wikimedia Commons'},
      {name: 'Amazon Rainforest', place: 'Brazil', lat: -3.3, lon: -60.6, note: 'The largest rainforest on Earth',
        photo: 'photos/earth-amazon.jpg', credit: 'Photo: lubasi · CC BY-SA 2.0 · Wikimedia Commons'},
      {name: 'Antarctica', place: 'Victoria Land', lat: -72.2, lon: 169.8, note: 'Mount Herschel above the frozen Ross Sea coast',
        photo: 'photos/earth-antarctica.jpg', credit: 'Photo: Andrew Mandemaker · CC BY-SA 2.5 · Wikimedia Commons'},
      {name: 'Vatnajökull', place: 'Iceland', lat: 64.02, lon: -16.37, note: "Iceland’s largest ice cap, calving into a lagoon",
        photo: 'photos/earth-vatnajokull.jpg', credit: 'Photo: Jakub Hałun · CC BY 4.0 · Wikimedia Commons'},
      {name: 'Mount Fuji', place: 'Japan', lat: 35.36, lon: 138.73, note: "Japan’s highest peak, 3,776 m",
        photo: 'photos/earth-fuji.jpg', credit: 'Photo: Σ64 · CC BY 3.0 · Wikimedia Commons'}
    ],
    landing: {type: 'surface'},
    facts: [{label: 'Gravity', value: '1.00 g'}, {label: 'Day length', value: '24 hours'}, {label: 'Surface', value: '15 °C average'}]
  },
  {
    id: 'mars', name: 'Mars', word: 'MARS', eyebrow: 'Set course for', tagline: 'Volcanoes, canyons and ancient rivers',
    map: 'maps/1k_mars.jpg',
    proc: {bands: false, pal: ['#5a2410', '#9a4420', '#c8723c', '#e6a878'], scale: 2.6},
    palette: {deep: '#2a0d04', bg: ['#d0591f', '#a23f12', '#6b2409', '#3b1405'], accent: '#e8283c',
      flare: ['rgba(255,236,205,.95)', 'rgba(255,176,96,.42)', 'rgba(255,140,60,.1)'], fog: ['#fbe6cd', '#f6d3ae', '#b36a37'], scrim: '44,14,3'},
    shader: {gamma: 2.6, tint: [1.18, .74, .56], relief: 1.9, hiCol: [.62, .012, .07], rim: [1, .5, .26], atmo: {color: [1, .64, .36], strength: 1, radius: 1.14}},
    restPitch: .16,
    region: {name: 'Tharsis', lat: 2, lon: -112, r: .62},
    sites: [
      {name: 'Olympus Mons', lat: 18.65, lon: -133.8, note: 'The tallest volcano in the solar system',
        photo: 'photos/mars-olympus.jpg', credit: 'NASA / JPL / USGS (Viking) · Public domain · Foreground rocks: illustration'},
      {name: 'Valles Marineris', lat: -13.9, lon: -59.2, note: 'A canyon as long as the United States is wide',
        photo: 'photos/mars-valles.jpg', credit: 'NASA / JPL / USGS (Viking) · Public domain · Foreground rocks: illustration'},
      {name: 'Gale Crater', lat: -5.4, lon: 137.8, note: 'Where Curiosity found an ancient lakebed',
        photo: 'photos/mars-gale.jpg', credit: 'NASA / JPL-Caltech (Curiosity) · Public domain · Foreground rocks: illustration'},
      {name: 'Jezero Delta', lat: 18.4, lon: 77.6, note: 'A river delta, now explored by Perseverance',
        photo: 'photos/mars-jezero.jpg', credit: 'NASA / JPL-Caltech (Perseverance) · Public domain · Foreground rocks: illustration'}
    ],
    cards: {sheet: 'photos/mars-cards.webp', w: 2336, h: 1744,
      boxes: [[0, 0, 1150, 810], [1186, 0, 1150, 810], [0, 900, 1150, 810], [1186, 900, 1150, 810]]},
    landing: {type: 'surface',
      land: 'photos/mars-land.webp', fore: 'photos/mars-fore.webp'},
    facts: [{label: 'Gravity', value: '0.38 g'}, {label: 'Day length', value: '24 h 37 min'}, {label: 'Surface', value: '−63 °C average'}]
  },
  {
    id: 'jupiter', name: 'Jupiter', word: 'JUPITER', eyebrow: 'Into the storms of', tagline: 'A world with no ground to stand on',
    map: 'maps/1k_jupiter.jpg',
    proc: {bands: true, pal: ['#8a5a36', '#c9986a', '#e8d3b0', '#a97a52', '#d9b48a']},
    palette: {deep: '#1d110a', bg: ['#cf9d6a', '#8e5f3b', '#4a2f1c', '#1d110a'], accent: '#ffb060',
      flare: ['rgba(255,240,215,.95)', 'rgba(255,200,140,.42)', 'rgba(255,170,100,.1)'], fog: ['#f7e6cf', '#e5c8a3', '#8a5a36'], scrim: '30,16,8'},
    shader: {gamma: 2.1, tint: [1.06, .96, .86], relief: 0, hiCol: [.8, .22, .04], rim: [1, .8, .55], atmo: {color: [1, .82, .6], strength: .55, radius: 1.1}},
    restPitch: .1,
    region: {name: 'Great Red Spot', lat: -22, lon: 20, r: .38},
    sites: [
      {name: 'Great Red Spot', lat: -22, lon: 20, note: 'A storm wider than Earth, raging for centuries'},
      {name: 'North Equatorial Belt', lat: 10, lon: 120, note: 'Brown bands of sinking, warmer air'},
      {name: 'Oval BA', lat: -33, lon: -100, note: 'The "Little Red Spot", born in 2000'},
      {name: 'South Polar Cyclones', lat: -82, lon: 0, note: 'A ring of cyclones around the pole, seen by Juno'}
    ],
    landing: {type: 'clouds', clouds: ['#7a4a2a', '#c99a6a', '#f3e2c4']},
    facts: [{label: 'Gravity', value: '2.53 g'}, {label: 'Day length', value: '9 h 56 min'}, {label: 'Cloud tops', value: '−110 °C'}]
  },
  {
    id: 'saturn', name: 'Saturn', word: 'SATURN', eyebrow: 'Between the rings of', tagline: 'Ice rings a hundred thousand kilometres wide',
    map: 'maps/1k_saturn.jpg',
    fallbackRing: [{color: 'maps/1k_saturn_ring_color.jpg', alpha: 'maps/1k_saturn_ring_alpha.gif'}],
    proc: {bands: true, pal: ['#a88a5c', '#d9c08f', '#efe1bf', '#c2a570', '#e3cf9e']},
    rings: {inner: 1.24, outer: 2.27, color: '#d8c4a0'},
    palette: {deep: '#201a0f', bg: ['#dcc292', '#9f8654', '#55472a', '#201a0f'], accent: '#ffd27a',
      flare: ['rgba(255,245,220,.95)', 'rgba(255,220,150,.42)', 'rgba(255,200,120,.1)'], fog: ['#f8efd8', '#e9d8ad', '#a88a5c'], scrim: '32,26,15'},
    shader: {gamma: 2.1, tint: [1.05, 1, .88], relief: 0, hiCol: [.78, .5, .08], rim: [1, .9, .65], atmo: {color: [1, .9, .7], strength: .5, radius: 1.1}},
    restPitch: .45,
    region: {name: 'Polar Hexagon', lat: 85, lon: 0, r: .3},
    sites: [
      {name: 'Polar Hexagon', lat: 88, lon: 0, note: 'A six-sided jet stream, each side wider than Earth'},
      {name: 'Great White Spot', lat: 35, lon: 100, note: 'A planet-circling storm that erupts every 30 years'},
      {name: 'Equatorial Jet', lat: 0, lon: -40, note: 'Winds of 1,800 km/h along the equator'},
      {name: 'South Polar Vortex', lat: -88, lon: 0, note: 'A hurricane-like eye at the pole'}
    ],
    landing: {type: 'clouds', clouds: ['#8a7246', '#d9c08f', '#f8efd8']},
    facts: [{label: 'Gravity', value: '1.07 g'}, {label: 'Day length', value: '10 h 34 min'}, {label: 'Cloud tops', value: '−140 °C'}]
  },
  {
    id: 'uranus', name: 'Uranus', word: 'URANUS', eyebrow: 'The sideways world,', tagline: 'It rolls around the Sun on its side',
    map: 'maps/1k_uranus.jpg',
    proc: {bands: true, pal: ['#7fc8d6', '#a9e2ec', '#c7eef4', '#93d4df', '#b8e8ef']},
    palette: {deep: '#0a1d22', bg: ['#93dbe6', '#45929f', '#1e4b55', '#0a1d22'], accent: '#aef6ff',
      flare: ['rgba(235,255,255,.95)', 'rgba(170,240,250,.42)', 'rgba(120,220,240,.1)'], fog: ['#eefbfd', '#c9eef4', '#45929f'], scrim: '8,28,34'},
    shader: {gamma: 2.0, tint: [.92, 1.02, 1.05], relief: 0, hiCol: [.05, .5, .6], rim: [.7, .95, 1], atmo: {color: [.6, .95, 1], strength: .8, radius: 1.12}},
    restPitch: .7,
    region: {name: 'Polar Cap', lat: 75, lon: 0, r: .42},
    sites: [
      {name: 'Polar Cap', lat: 80, lon: 0, note: 'A bright haze over the sunlit pole'},
      {name: 'Bright Band', lat: -45, lon: 90, note: 'A belt of high methane-ice clouds'},
      {name: 'Dark Spot', lat: -28, lon: -120, note: 'A rare storm, seen by Hubble in 2006'},
      {name: 'Equator', lat: 0, lon: 170, note: 'Faint bands, nearly invisible in visible light'}
    ],
    landing: {type: 'clouds', clouds: ['#2f7a88', '#8fd4de', '#eafcff']},
    facts: [{label: 'Gravity', value: '0.89 g'}, {label: 'Day length', value: '17 h 14 min'}, {label: 'Cloud tops', value: '−195 °C'}]
  },
  {
    id: 'neptune', name: 'Neptune', word: 'NEPTUNE', eyebrow: 'The windiest world,', tagline: 'Supersonic winds on the edge of the system',
    map: 'maps/1k_neptune.jpg',
    proc: {bands: true, pal: ['#1e3a9c', '#3a63d6', '#6f93ec', '#2d4fbf', '#5579e0']},
    palette: {deep: '#050b22', bg: ['#3f68d8', '#223f96', '#0f2052', '#050b22'], accent: '#7aa2ff',
      flare: ['rgba(230,240,255,.95)', 'rgba(150,180,255,.42)', 'rgba(100,140,255,.1)'], fog: ['#e4ecff', '#b9caf7', '#2f4fb3'], scrim: '5,12,40'},
    shader: {gamma: 2.0, tint: [.9, .98, 1.08], relief: 0, hiCol: [.08, .2, .85], rim: [.55, .7, 1], atmo: {color: [.4, .6, 1], strength: .9, radius: 1.12}},
    restPitch: .2,
    region: {name: 'Great Dark Spot', lat: -22, lon: 30, r: .36},
    sites: [
      {name: 'Great Dark Spot', lat: -22, lon: 30, note: 'A hole in the clouds the size of Earth, seen by Voyager 2'},
      {name: 'Scooter', lat: -42, lon: 100, note: 'A fast white cloud racing around the planet'},
      {name: 'Small Dark Spot', lat: -55, lon: -120, note: 'A southern storm with a bright core'},
      {name: 'South Polar Feature', lat: -70, lon: 0, note: 'Warm methane rising at the pole'}
    ],
    landing: {type: 'clouds', clouds: ['#162c7a', '#3f68d8', '#cfe0ff']},
    facts: [{label: 'Gravity', value: '1.14 g'}, {label: 'Day length', value: '16 h 6 min'}, {label: 'Cloud tops', value: '−200 °C'}]
  }
];

export const byId = id => BODIES.find(b => b.id === id);

// Educational panel on each planet's first step: a short description and four key figures.
export const ABOUT = {
  mercury: {text: 'The smallest planet and the closest to the Sun, Mercury is a bare, cratered world with almost no atmosphere. Its days are blistering and its nights are frigid, because there is no air to hold the heat.',
    stats: [['Diameter', '4,879 km'], ['From the Sun', '58 million km'], ['Moons', '0'], ['Year', '88 days']]},
  venus: {text: 'Venus is Earth’s twin in size but nothing like it to live on. A thick carbon-dioxide atmosphere traps heat so well that its surface is hotter than Mercury’s, under clouds of sulphuric acid.',
    stats: [['Diameter', '12,104 km'], ['From the Sun', '108 million km'], ['Moons', '0'], ['Year', '225 days']]},
  earth: {text: 'The only world known to hold liquid water on its surface, and life of any kind. Its plate tectonics, oceans and atmosphere constantly reshape it.',
    stats: [['Diameter', '12,742 km'], ['From the Sun', '150 million km'], ['Moons', '1'], ['Year', '365 days']]},
  mars: {text: 'A cold desert with the largest volcano and the deepest canyon in the solar system. Rivers once ran here, and rovers are reading the rocks they left behind.',
    stats: [['Diameter', '6,779 km'], ['From the Sun', '228 million km'], ['Moons', '2'], ['Year', '687 days']]},
  jupiter: {text: 'A gas giant more than twice as massive as all the other planets combined. Its bands are winds and its spots are storms, some older than any nation on Earth.',
    stats: [['Diameter', '139,820 km'], ['From the Sun', '778 million km'], ['Moons', '95'], ['Year', '11.9 years']]},
  saturn: {text: 'Famous for its rings, made of ice and rock from dust grains to house-sized boulders. Saturn is so light for its size that it would float in a big enough bathtub.',
    stats: [['Diameter', '116,460 km'], ['From the Sun', '1.43 billion km'], ['Moons', '146'], ['Year', '29.5 years']]},
  uranus: {text: 'An ice giant knocked on its side, so each pole gets 42 years of sunlight followed by 42 years of dark. Methane in its air gives it its pale blue-green colour.',
    stats: [['Diameter', '50,724 km'], ['From the Sun', '2.87 billion km'], ['Moons', '28'], ['Year', '84 years']]},
  neptune: {text: 'The farthest planet, a deep blue ice giant with the fastest winds measured anywhere, above 2,000 km/h. It was found by mathematics before anyone saw it in a telescope.',
    stats: [['Diameter', '49,244 km'], ['From the Sun', '4.5 billion km'], ['Moons', '16'], ['Year', '165 years']]}
};

// Mean heliocentric longitude at J2000 (degrees) and mean motion (degrees per day), for the orbital hub.
// `size` is the display radius relative to Earth; the hub is not to scale, but the order of sizes is kept.
export const ORBITS = {
  mercury: {L0: 252.25, n: 4.09234, size: .7, period: '88 days', au: .387},
  venus:   {L0: 181.98, n: 1.60213, size: .95, period: '225 days', au: .723},
  earth:   {L0: 100.46, n: .98565, size: 1, period: '1 year', au: 1},
  mars:    {L0: 355.45, n: .52403, size: .8, period: '1.9 years', au: 1.524},
  jupiter: {L0: 34.40,  n: .08309, size: 1.8, period: '11.9 years', au: 5.203},
  saturn:  {L0: 49.94,  n: .03346, size: 1.6, period: '29.5 years', au: 9.537},
  uranus:  {L0: 313.23, n: .01173, size: 1.25, period: '84 years', au: 19.19},
  neptune: {L0: 304.88, n: .00598, size: 1.2, period: '165 years', au: 30.07}
};

// Airborne motes per world: count, colour, and how much they streak sideways (wind).
export const DUST = {
  mercury: {count: 10, color: [230, 225, 215], streak: 1},
  venus:   {count: 44, color: [255, 222, 150], streak: 1.4},
  earth:   {count: 0},
  mars:    {count: 34, color: [255, 214, 170], streak: 1},
  jupiter: {count: 22, color: [255, 232, 200], streak: 3.4},
  saturn:  {count: 22, color: [255, 240, 210], streak: 3.8},
  uranus:  {count: 18, color: [220, 250, 255], streak: 3},
  neptune: {count: 18, color: [200, 220, 255], streak: 4.2}
};

// Mean radius of each body in km, for the true-size view and for sizing moons against their planet.
export const RADIUS_KM = {sun: 696000, mercury: 2440, venus: 6052, earth: 6371, mars: 3390, jupiter: 69911, saturn: 58232, uranus: 25362, neptune: 24622};

// Major moons, shown orbiting the planet on its first step. r is the moon's radius in km.
export const MOONS = {
  earth: [
    {name: 'The Moon', r: 1737, period: 27.3, found: 'Known since prehistory', map: 'maps/1k_moon.jpg',
      note: 'A quarter of Earth’s width, made from the debris of a giant impact',
      text: 'The only other world people have walked on. Its pull makes our tides, and its slow retreat is lengthening our days by a couple of milliseconds a century.'}],
  mars: [
    {name: 'Phobos', r: 11, period: .32, found: '1877, Asaph Hall', note: 'A captured asteroid, spiralling slowly inward',
      text: 'It circles Mars faster than the planet turns, so it rises in the west and sets in the east. In tens of millions of years it will break up into a ring.'},
    {name: 'Deimos', r: 6, period: 1.26, found: '1877, Asaph Hall', note: 'Smaller and farther out, with a smooth dusty surface',
      text: 'From its surface Mars fills a large part of the sky. Its craters are softened by a thick blanket of dust.'}],
  jupiter: [
    {name: 'Io', r: 1821, period: 1.77, found: '1610, Galileo', note: 'The most volcanic body in the solar system',
      text: 'Squeezed by Jupiter’s gravity until its interior melts. Hundreds of volcanoes throw sulphur hundreds of kilometres into space.'},
    {name: 'Europa', r: 1560, period: 3.55, found: '1610, Galileo', note: 'An ocean under the ice, a prime place to look for life',
      text: 'A cracked shell of ice over an ocean holding twice the water of all Earth’s seas. NASA’s Europa Clipper is on its way to find out what is in it.'},
    {name: 'Ganymede', r: 2634, period: 7.15, found: '1610, Galileo', note: 'Bigger than Mercury, with its own magnetic field',
      text: 'The largest moon in the solar system, larger than the planet Mercury. The only moon known to generate a magnetic field of its own.'},
    {name: 'Callisto', r: 2410, period: 16.7, found: '1610, Galileo', note: 'The most cratered surface known',
      text: 'Its surface has barely changed in four billion years, a record of every impact since. Beneath it there may be a salty ocean.'}],
  saturn: [
    {name: 'Titan', r: 2575, period: 15.9, found: '1655, Christiaan Huygens', note: 'Thick orange air and lakes of liquid methane',
      text: 'The only moon with a thick atmosphere. Methane rain falls into lakes and rivers, and NASA’s Dragonfly rotorcraft will fly across it in the 2030s.'},
    {name: 'Enceladus', r: 252, period: 1.37, found: '1789, William Herschel', note: 'Geysers of water from a buried ocean',
      text: 'Plumes of water vapour jet from cracks near its south pole and feed one of Saturn’s rings. A buried ocean, warm at its floor.'},
    {name: 'Rhea', r: 764, period: 4.52, found: '1672, Giovanni Cassini', note: 'An icy, heavily cratered world',
      text: 'Mostly water ice around a small rocky core, and heavily cratered. It may once have had rings of its own.'}],
  uranus: [
    {name: 'Titania', r: 789, period: 8.71, found: '1787, William Herschel', note: 'The largest moon of Uranus, cut by huge canyons',
      text: 'Canyons up to 1,600 km long split its icy surface, signs of a crust that cracked as the interior froze and expanded.'},
    {name: 'Oberon', r: 761, period: 13.5, found: '1787, William Herschel', note: 'Dark, cratered and ancient',
      text: 'The outermost of the large moons of Uranus. Dark and cratered, with a mountain about 6 km high seen on its limb.'},
    {name: 'Miranda', r: 236, period: 1.41, found: '1948, Gerard Kuiper', note: 'A patchwork surface with cliffs 20 km high',
      text: 'Looks assembled from mismatched pieces. Verona Rupes, a cliff about 20 km high, may be the tallest known.'}],
  neptune: [
    {name: 'Triton', r: 1353, period: 5.88, found: '1846, William Lassell', note: 'Orbits backwards and vents nitrogen geysers',
      text: 'A captured Kuiper belt object, orbiting the wrong way round. Geysers of nitrogen rise from a surface of frozen nitrogen at −235 °C.'}]
};
