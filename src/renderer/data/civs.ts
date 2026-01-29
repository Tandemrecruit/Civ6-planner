// Civ 6 civilizations and leaders
// This is a simplified list - can expand with full details later

export interface CivData {
  id: string;
  name: string;
  leaders: LeaderData[];
  uniqueAbility: string;
}

export interface LeaderData {
  id: string;
  name: string;
  ability: string;
}

export const CIVS: CivData[] = [
  {
    id: "america",
    name: "America",
    leaders: [
      { id: "teddy", name: "Teddy Roosevelt", ability: "Roosevelt Corollary" },
      { id: "teddy_rough", name: "Teddy Roosevelt (Rough Rider)", ability: "Rough Rider" },
      { id: "lincoln", name: "Abraham Lincoln", ability: "Emancipation" },
    ],
    uniqueAbility: "Founding Fathers",
  },
  {
    id: "arabia",
    name: "Arabia",
    leaders: [{ id: "saladin", name: "Saladin", ability: "Righteousness of the Faith" }],
    uniqueAbility: "The Last Prophet",
  },
  {
    id: "australia",
    name: "Australia",
    leaders: [{ id: "john_curtin", name: "John Curtin", ability: "Citadel of Civilization" }],
    uniqueAbility: "Land Down Under",
  },
  {
    id: "aztec",
    name: "Aztec",
    leaders: [{ id: "montezuma", name: "Montezuma", ability: "Gifts for the Tlatoani" }],
    uniqueAbility: "Legend of the Five Suns",
  },
  {
    id: "babylon",
    name: "Babylon",
    leaders: [{ id: "hammurabi", name: "Hammurabi", ability: "Ninu Ilu Sirum" }],
    uniqueAbility: "Enuma Anu Enlil",
  },
  {
    id: "brazil",
    name: "Brazil",
    leaders: [{ id: "pedro", name: "Pedro II", ability: "Magnanimous" }],
    uniqueAbility: "Amazon",
  },
  {
    id: "byzantium",
    name: "Byzantium",
    leaders: [{ id: "basil", name: "Basil II", ability: "Porphyrogennetos" }],
    uniqueAbility: "Taxis",
  },
  {
    id: "canada",
    name: "Canada",
    leaders: [{ id: "laurier", name: "Wilfrid Laurier", ability: "The Last Best West" }],
    uniqueAbility: "Four Faces of Peace",
  },
  {
    id: "china",
    name: "China",
    leaders: [
      { id: "qin", name: "Qin Shi Huang", ability: "The First Emperor" },
      { id: "kublai_china", name: "Kublai Khan (China)", ability: "Gerege" },
      { id: "yongle", name: "Yongle", ability: "Lijia" },
      { id: "wu_zetian", name: "Wu Zetian", ability: "Mandate of Heaven" },
    ],
    uniqueAbility: "Dynastic Cycle",
  },
  {
    id: "cree",
    name: "Cree",
    leaders: [{ id: "poundmaker", name: "Poundmaker", ability: "Favorable Terms" }],
    uniqueAbility: "Nihithaw",
  },
  {
    id: "egypt",
    name: "Egypt",
    leaders: [
      { id: "cleopatra", name: "Cleopatra", ability: "Mediterranean's Bride" },
      { id: "ramses", name: "Ramses II", ability: "Abu Simbel" },
    ],
    uniqueAbility: "Iteru",
  },
  {
    id: "england",
    name: "England",
    leaders: [
      { id: "victoria", name: "Victoria (Age of Empire)", ability: "Pax Britannica" },
      { id: "victoria_steam", name: "Victoria (Age of Steam)", ability: "Workshop of the World" },
      { id: "eleanor_england", name: "Eleanor of Aquitaine", ability: "Court of Love" },
    ],
    uniqueAbility: "British Museum",
  },
  {
    id: "ethiopia",
    name: "Ethiopia",
    leaders: [{ id: "menelik", name: "Menelik II", ability: "Council of Ministers" }],
    uniqueAbility: "Aksumite Legacy",
  },
  {
    id: "france",
    name: "France",
    leaders: [
      { id: "catherine_black", name: "Catherine de Medici (Black Queen)", ability: "Catherine's Flying Squadron" },
      { id: "catherine_magnificence", name: "Catherine de Medici (Magnificence)", ability: "Magnificence of Court" },
      { id: "eleanor_france", name: "Eleanor of Aquitaine", ability: "Court of Love" },
    ],
    uniqueAbility: "Grand Tour",
  },
  {
    id: "gaul",
    name: "Gaul",
    leaders: [{ id: "ambiorix", name: "Ambiorix", ability: "King of the Eburones" }],
    uniqueAbility: "Hallstatt Culture",
  },
  {
    id: "georgia",
    name: "Georgia",
    leaders: [{ id: "tamar", name: "Tamar", ability: "Glory of the World, Kingdom, and Faith" }],
    uniqueAbility: "Strength in Unity",
  },
  {
    id: "germany",
    name: "Germany",
    leaders: [
      { id: "frederick", name: "Frederick Barbarossa", ability: "Holy Roman Emperor" },
      { id: "ludwig", name: "Ludwig II", ability: "Swan King" },
    ],
    uniqueAbility: "Free Imperial Cities",
  },
  {
    id: "gran_colombia",
    name: "Gran Colombia",
    leaders: [{ id: "bolivar", name: "Simon Bolivar", ability: "Campana Admirable" }],
    uniqueAbility: "Ejercito Patriota",
  },
  {
    id: "greece",
    name: "Greece",
    leaders: [
      { id: "pericles", name: "Pericles", ability: "Surrounded by Glory" },
      { id: "gorgo", name: "Gorgo", ability: "Thermopylae" },
    ],
    uniqueAbility: "Plato's Republic",
  },
  {
    id: "hungary",
    name: "Hungary",
    leaders: [{ id: "matthias", name: "Matthias Corvinus", ability: "Raven King" }],
    uniqueAbility: "Pearl of the Danube",
  },
  {
    id: "inca",
    name: "Inca",
    leaders: [{ id: "pachacuti", name: "Pachacuti", ability: "Qhapaq Nan" }],
    uniqueAbility: "Mit'a",
  },
  {
    id: "india",
    name: "India",
    leaders: [
      { id: "gandhi", name: "Gandhi", ability: "Satyagraha" },
      { id: "chandragupta", name: "Chandragupta", ability: "Arthashastra" },
    ],
    uniqueAbility: "Dharma",
  },
  {
    id: "indonesia",
    name: "Indonesia",
    leaders: [{ id: "gitarja", name: "Gitarja", ability: "Exalted Goddess of the Three Worlds" }],
    uniqueAbility: "Great Nusantara",
  },
  {
    id: "japan",
    name: "Japan",
    leaders: [
      { id: "hojo", name: "Hojo Tokimune", ability: "Divine Wind" },
      { id: "tokugawa", name: "Tokugawa", ability: "Edo Period" },
    ],
    uniqueAbility: "Meiji Restoration",
  },
  {
    id: "khmer",
    name: "Khmer",
    leaders: [{ id: "jayavarman", name: "Jayavarman VII", ability: "Monasteries of the King" }],
    uniqueAbility: "Grand Barays",
  },
  {
    id: "kongo",
    name: "Kongo",
    leaders: [
      { id: "mvemba", name: "Mvemba a Nzinga", ability: "Religious Convert" },
      { id: "nzinga_mbande", name: "Nzinga Mbande", ability: "Fierce" },
    ],
    uniqueAbility: "Nkisi",
  },
  {
    id: "korea",
    name: "Korea",
    leaders: [
      { id: "seondeok", name: "Seondeok", ability: "Hwarang" },
      { id: "sejong", name: "Sejong", ability: "Hangul" },
    ],
    uniqueAbility: "Three Kingdoms",
  },
  {
    id: "macedon",
    name: "Macedon",
    leaders: [{ id: "alexander", name: "Alexander", ability: "To the World's End" }],
    uniqueAbility: "Hellenistic Fusion",
  },
  {
    id: "mali",
    name: "Mali",
    leaders: [
      { id: "mansa_musa", name: "Mansa Musa", ability: "Sahel Merchants" },
      { id: "sundiata", name: "Sundiata Keita", ability: "Lion's Mane" },
    ],
    uniqueAbility: "Songs of the Jeli",
  },
  {
    id: "maori",
    name: "Maori",
    leaders: [{ id: "kupe", name: "Kupe", ability: "Kupe's Voyage" }],
    uniqueAbility: "Mana",
  },
  {
    id: "mapuche",
    name: "Mapuche",
    leaders: [{ id: "lautaro", name: "Lautaro", ability: "Swift Hawk" }],
    uniqueAbility: "Toqui",
  },
  {
    id: "maya",
    name: "Maya",
    leaders: [{ id: "lady_six_sky", name: "Lady Six Sky", ability: "Ix Mutal Ajaw" }],
    uniqueAbility: "Mayab",
  },
  {
    id: "mongolia",
    name: "Mongolia",
    leaders: [
      { id: "genghis", name: "Genghis Khan", ability: "Mongol Horde" },
      { id: "kublai_mongolia", name: "Kublai Khan (Mongolia)", ability: "Gerege" },
    ],
    uniqueAbility: "Ortoo",
  },
  {
    id: "netherlands",
    name: "Netherlands",
    leaders: [{ id: "wilhelmina", name: "Wilhelmina", ability: "Radio Oranje" }],
    uniqueAbility: "Grote Rivieren",
  },
  {
    id: "norway",
    name: "Norway",
    leaders: [{ id: "harald", name: "Harald Hardrada", ability: "Thunderbolt of the North" }],
    uniqueAbility: "Knarr",
  },
  {
    id: "nubia",
    name: "Nubia",
    leaders: [{ id: "amanitore", name: "Amanitore", ability: "Kandake of Meroe" }],
    uniqueAbility: "Ta-Seti",
  },
  {
    id: "ottoman",
    name: "Ottoman",
    leaders: [{ id: "suleiman", name: "Suleiman", ability: "Grand Vizier" }],
    uniqueAbility: "Great Turkish Bombard",
  },
  {
    id: "persia",
    name: "Persia",
    leaders: [
      { id: "cyrus", name: "Cyrus", ability: "Fall of Babylon" },
      { id: "nader", name: "Nader Shah", ability: "Sword of Persia" },
    ],
    uniqueAbility: "Satrapies",
  },
  {
    id: "phoenicia",
    name: "Phoenicia",
    leaders: [{ id: "dido", name: "Dido", ability: "Founder of Carthage" }],
    uniqueAbility: "Mediterranean Colonies",
  },
  {
    id: "poland",
    name: "Poland",
    leaders: [{ id: "jadwiga", name: "Jadwiga", ability: "Lithuanian Union" }],
    uniqueAbility: "Golden Liberty",
  },
  {
    id: "portugal",
    name: "Portugal",
    leaders: [{ id: "joao", name: "Joao III", ability: "Porta do Cerco" }],
    uniqueAbility: "Casa da India",
  },
  {
    id: "rome",
    name: "Rome",
    leaders: [
      { id: "trajan", name: "Trajan", ability: "Trajan's Column" },
      { id: "julius", name: "Julius Caesar", ability: "Veni Vidi Vici" },
    ],
    uniqueAbility: "All Roads Lead to Rome",
  },
  {
    id: "russia",
    name: "Russia",
    leaders: [{ id: "peter", name: "Peter", ability: "The Grand Embassy" }],
    uniqueAbility: "Mother Russia",
  },
  {
    id: "scotland",
    name: "Scotland",
    leaders: [{ id: "robert", name: "Robert the Bruce", ability: "Bannockburn" }],
    uniqueAbility: "Scottish Enlightenment",
  },
  {
    id: "scythia",
    name: "Scythia",
    leaders: [{ id: "tomyris", name: "Tomyris", ability: "Killer of Cyrus" }],
    uniqueAbility: "People of the Steppe",
  },
  {
    id: "spain",
    name: "Spain",
    leaders: [{ id: "philip", name: "Philip II", ability: "El Escorial" }],
    uniqueAbility: "Treasure Fleet",
  },
  {
    id: "sumeria",
    name: "Sumeria",
    leaders: [{ id: "gilgamesh", name: "Gilgamesh", ability: "Adventures of Enkidu" }],
    uniqueAbility: "Epic Quest",
  },
  {
    id: "sweden",
    name: "Sweden",
    leaders: [{ id: "kristina", name: "Kristina", ability: "Minerva of the North" }],
    uniqueAbility: "Nobel Prize",
  },
  {
    id: "vietnam",
    name: "Vietnam",
    leaders: [{ id: "ba_trieu", name: "Ba Trieu", ability: "Drive Out the Aggressors" }],
    uniqueAbility: "Nine Dragon River Delta",
  },
  {
    id: "zulu",
    name: "Zulu",
    leaders: [{ id: "shaka", name: "Shaka", ability: "Amabutho" }],
    uniqueAbility: "Isibongo",
  },
];

// Sort civs alphabetically
CIVS.sort((a, b) => a.name.localeCompare(b.name));
