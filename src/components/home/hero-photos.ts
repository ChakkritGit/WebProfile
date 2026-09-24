/**
 * The pictures in the hero's collection that are not drawn but found: public
 * domain and CC0 works — statues, strange and old art, the Renaissance and the
 * great paintings after it, Egyptian tomb walls, the sea, European watercolour
 * landscapes, Jupiter, a black hole, and plant cells.
 *
 * Sources: The Met's Open Access (CC0), NASA (not subject to copyright), and
 * Wikimedia Commons files marked public domain. Credits are shown with the
 * picture anyway: it is the decent thing, and NASA asks for it.
 *
 * Files live in /public/hero (1920px WebP) and /public/hero/thumb (600px tall,
 * used by the opening timelapse — at 300px the full-screen frames came out
 * visibly soft).
 */

export interface HeroPhoto {
  id: string
  title: string
  by: string
  date: string
  source: string
  url: string
  /** CSS object-position — where the subject is, for the crop. */
  focus?: string
  /** Busy by default (the orb frosts over it); false for the calm ones. */
  busy?: boolean
}

export const PHOTOS: HeroPhoto[] = [
  { id: 'perseus', title: 'Perseus with the Head of Medusa', by: 'Antonio Canova', date: '1804–6', source: 'The Met', url: 'https://www.metmuseum.org/art/collection/search/204758', focus: '50% 20%' },
  { id: 'ugolino', title: 'Ugolino and His Sons', by: 'Jean-Baptiste Carpeaux', date: '1865–67', source: 'The Met', url: 'https://www.metmuseum.org/art/collection/search/204812', focus: '50% 25%' },
  { id: 'kouros', title: 'Marble statue of a kouros (youth)', by: 'Greek, Attic', date: 'ca. 590–580 BCE', source: 'The Met', url: 'https://www.metmuseum.org/art/collection/search/253370', focus: '50% 18%' },
  { id: 'amazon', title: 'Marble statue of a wounded Amazon', by: 'Roman', date: '1st–2nd century CE', source: 'The Met', url: 'https://www.metmuseum.org/art/collection/search/253373', focus: '50% 20%' },
  { id: 'warrior', title: 'Marble statue of a wounded warrior', by: 'Roman', date: 'ca. 138–181 CE', source: 'The Met', url: 'https://www.metmuseum.org/art/collection/search/251929', focus: '50% 20%' },
  { id: 'island-of-the-dead', title: 'Island of the Dead', by: 'Arnold Böcklin', date: '1880', source: 'The Met', url: 'https://www.metmuseum.org/art/collection/search/435683', busy: false },
  { id: 'melencolia', title: 'Melencolia I', by: 'Albrecht Dürer', date: '1514', source: 'The Met', url: 'https://www.metmuseum.org/art/collection/search/336228' },
  { id: 'sleep-of-reason', title: 'The Sleep of Reason Produces Monsters, Los Caprichos pl. 43', by: 'Francisco de Goya', date: '1799', source: 'The Met', url: 'https://www.metmuseum.org/art/collection/search/338473' },
  { id: 'harvesters', title: 'The Harvesters', by: 'Pieter Bruegel the Elder', date: '1565', source: 'The Met', url: 'https://www.metmuseum.org/art/collection/search/435809' },
  { id: 'great-wave', title: 'Under the Wave off Kanagawa (The Great Wave)', by: 'Katsushika Hokusai', date: 'ca. 1830–32', source: 'The Met', url: 'https://www.metmuseum.org/art/collection/search/45434' },
  { id: 'hollar-wave', title: 'Warship in the trough of a wave', by: 'Wenceslaus Hollar', date: '1665', source: 'The Met', url: 'https://www.metmuseum.org/art/collection/search/361774' },
  { id: 'cotman-storm', title: 'Boats off the coast, storm approaching', by: 'John Sell Cotman', date: '1830', source: 'The Met', url: 'https://www.metmuseum.org/art/collection/search/746834' },
  { id: 'lindisfarne', title: 'Lindisfarne Castle, Holy Island, Northumberland', by: 'Thomas Girtin', date: '1796–97', source: 'The Met', url: 'https://www.metmuseum.org/art/collection/search/341793' },
  { id: 'norwich', title: 'River at Norwich', by: 'Thomas Girtin', date: 'early 19th century', source: 'The Met', url: 'https://www.metmuseum.org/art/collection/search/341795' },
  { id: 'rievaulx', title: 'The east end of Rievaulx Abbey, Yorkshire', by: 'John Sell Cotman', date: '1803', source: 'The Met', url: 'https://www.metmuseum.org/art/collection/search/373905' },
  { id: 'ruined-castle', title: 'Ruined Castle', by: 'John Sell Cotman', date: '1823–42', source: 'The Met', url: 'https://www.metmuseum.org/art/collection/search/341084' },
  { id: 'windsor', title: 'Windsor Great Park', by: 'Paul Sandby', date: '1790–99', source: 'The Met', url: 'https://www.metmuseum.org/art/collection/search/359037' },
  { id: 'lake-zug', title: 'The Lake of Zug', by: 'Joseph Mallord William Turner', date: '1843', source: 'The Met', url: 'https://www.metmuseum.org/art/collection/search/337499' },
  { id: 'venice', title: 'Venice, from the Porch of Madonna della Salute', by: 'Joseph Mallord William Turner', date: 'ca. 1835', source: 'The Met', url: 'https://www.metmuseum.org/art/collection/search/437853' },
  { id: 'saltash', title: 'Saltash with the Water Ferry, Cornwall', by: 'Joseph Mallord William Turner', date: '1811', source: 'The Met', url: 'https://www.metmuseum.org/art/collection/search/437852' },
  { id: 'greenwich', title: 'View of London from Greenwich', by: 'Joseph Mallord William Turner', date: '1825', source: 'The Met', url: 'https://www.metmuseum.org/art/collection/search/356768' },
  { id: 'wales', title: 'River Landscape in Wales', by: 'David Cox', date: 'ca. 1850', source: 'The Met', url: 'https://www.metmuseum.org/art/collection/search/341093' },
  { id: 'harlech', title: 'Harlech Castle across the Traeth Mawr', by: 'John Varley', date: '1800–42', source: 'The Met', url: 'https://www.metmuseum.org/art/collection/search/373907' },
  { id: 'warwick', title: 'Warwick Castle', by: 'Canaletto (Giovanni Antonio Canal)', date: '1748', source: 'The Met', url: 'https://www.metmuseum.org/art/collection/search/438106' },
  { id: 'prout-coast', title: 'Coastal Scene with Beached Boats in Foreground', by: 'Samuel Prout', date: 'early–mid 19th century', source: 'The Met', url: 'https://www.metmuseum.org/art/collection/search/364449' },
  { id: 'jupiter-bands', title: 'Jupiter\'s Bands of Clouds', by: 'NASA / JPL-Caltech / SwRI / MSSS', date: '', source: 'NASA', url: 'https://images.nasa.gov/details/PIA21393', busy: false },
  { id: 'jupiter-chaos', title: 'Jupiter\'s Colourful, Chaotic Clouds', by: 'NASA / JPL-Caltech / SwRI / MSSS', date: '', source: 'NASA', url: 'https://images.nasa.gov/details/PIA25729', busy: false },
  { id: 'black-hole', title: 'Black Hole Accretion Disk Visualization', by: 'NASA\'s Goddard Space Flight Center / Jeremy Schnittman', date: '2019', source: 'NASA', url: 'https://svs.gsfc.nasa.gov/13326', busy: false },
  { id: 'creation-of-adam', title: 'The Creation of Adam', by: 'Michelangelo', date: 'ca. 1508–12', source: 'Wikimedia Commons (public domain)', url: 'https://commons.wikimedia.org/wiki/File:Michelangelo_-_Creation_of_Adam_(cropped).jpg', focus: '45% 50%' },
  { id: 'school-of-athens', title: 'The School of Athens', by: 'Raphael', date: '1509–11', source: 'Wikimedia Commons (public domain)', url: 'https://commons.wikimedia.org/wiki/File:%22The_School_of_Athens%22_by_Raffaello_Sanzio_da_Urbino.jpg' },
  { id: 'birth-of-venus', title: 'The Birth of Venus', by: 'Sandro Botticelli', date: 'ca. 1484–86', source: 'Wikimedia Commons (public domain)', url: 'https://commons.wikimedia.org/wiki/File:Sandro_Botticelli_-_La_nascita_di_Venere_-_Google_Art_ProjectFXD.jpg' },
  { id: 'primavera', title: 'Primavera', by: 'Sandro Botticelli', date: 'ca. 1480', source: 'Wikimedia Commons (public domain)', url: 'https://commons.wikimedia.org/wiki/File:Sandro_Botticelli_-_La_Primavera_-_Google_Art_Project.jpg' },
  { id: 'last-supper', title: 'The Last Supper', by: 'Leonardo da Vinci', date: '1495–98', source: 'Wikimedia Commons (public domain)', url: 'https://commons.wikimedia.org/wiki/File:%C3%9Altima_Cena_-_Da_Vinci_5.jpg' },
  { id: 'last-judgement', title: 'The Last Judgement', by: 'Michelangelo', date: '1536–41', source: 'Wikimedia Commons (public domain)', url: 'https://commons.wikimedia.org/wiki/File:Last_Judgement_(Michelangelo).jpg', focus: '50% 30%' },
  { id: 'garden-delights', title: 'The Garden of Earthly Delights', by: 'Hieronymus Bosch', date: 'ca. 1490–1510', source: 'Wikimedia Commons (public domain)', url: 'https://commons.wikimedia.org/wiki/File:The_Garden_of_Earthly_Delights_by_Bosch_High_Resolution.jpg' },
  { id: 'tower-of-babel', title: 'The Tower of Babel', by: 'Pieter Bruegel the Elder', date: '1563', source: 'Wikimedia Commons (public domain)', url: 'https://commons.wikimedia.org/wiki/File:Pieter_Bruegel_the_Elder_-_The_Tower_of_Babel_(Vienna)_-_Google_Art_Project_-_edited.jpg' },
  { id: 'rebel-angels', title: 'The Fall of the Rebel Angels', by: 'Pieter Bruegel the Elder', date: '1562', source: 'Wikimedia Commons (public domain)', url: 'https://commons.wikimedia.org/wiki/File:Pieter_Bruegel_the_Elder_-_The_Fall_of_the_Rebel_Angels_-_Google_Art_Project.jpg' },
  { id: 'triumph-of-death', title: 'The Triumph of Death', by: 'Pieter Bruegel the Elder', date: 'ca. 1562', source: 'Wikimedia Commons (public domain)', url: 'https://commons.wikimedia.org/wiki/File:The_Triumph_of_Death_by_Pieter_Bruegel_the_Elder.jpg' },
  { id: 'ambassadors', title: 'The Ambassadors', by: 'Hans Holbein the Younger', date: '1533', source: 'Wikimedia Commons (public domain)', url: 'https://commons.wikimedia.org/wiki/File:Hans_Holbein_the_Younger_-_The_Ambassadors_-_Google_Art_Project.jpg', focus: '50% 40%' },
  { id: 'night-watch', title: 'The Night Watch', by: 'Rembrandt van Rijn', date: '1642', source: 'Wikimedia Commons (public domain)', url: 'https://commons.wikimedia.org/wiki/File:The_Nightwatch_by_Rembrandt_-_Rijksmuseum.jpg', focus: '45% 45%' },
  { id: 'death-of-socrates', title: 'The Death of Socrates', by: 'Jacques Louis David', date: '1787', source: 'Wikimedia Commons (CC0)', url: 'https://commons.wikimedia.org/wiki/File:The_Death_of_Socrates_MET_DT40.jpg' },
  { id: 'raft-medusa', title: 'The Raft of the Medusa', by: 'Théodore Géricault', date: '1818–19', source: 'Wikimedia Commons (public domain)', url: 'https://commons.wikimedia.org/wiki/File:JEAN_LOUIS_TH%C3%89ODORE_G%C3%89RICAULT_-_La_Balsa_de_la_Medusa_(Museo_del_Louvre,_1818-19).jpg' },
  { id: 'liberty', title: 'Liberty Leading the People', by: 'Eugène Delacroix', date: '1830', source: 'Wikimedia Commons (public domain)', url: 'https://commons.wikimedia.org/wiki/File:Eug%C3%A8ne_Delacroix_-_La_libert%C3%A9_guidant_le_peuple.jpg', focus: '55% 30%' },
  { id: 'wanderer', title: 'Wanderer above the Sea of Fog', by: 'Caspar David Friedrich', date: 'ca. 1818', source: 'Wikimedia Commons (public domain)', url: 'https://commons.wikimedia.org/wiki/File:Caspar_David_Friedrich_-_Wanderer_above_the_sea_of_fog.jpg', focus: '50% 35%' },
  { id: 'starry-night', title: 'The Starry Night', by: 'Vincent van Gogh', date: '1889', source: 'Wikimedia Commons (public domain)', url: 'https://commons.wikimedia.org/wiki/File:Vincent_van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg' },
  { id: 'the-kiss', title: 'The Kiss', by: 'Gustav Klimt', date: '1907–08', source: 'Wikimedia Commons (public domain)', url: 'https://commons.wikimedia.org/wiki/File:The_Kiss_-_Gustav_Klimt_-_Google_Cultural_Institute.jpg', focus: '50% 35%' },
  { id: 'nebamun', title: 'Nebamun hunting in the marshes, tomb of Nebamun', by: 'Egyptian, Thebes', date: 'ca. 1350 BCE', source: 'Wikimedia Commons (public domain)', url: 'https://commons.wikimedia.org/wiki/File:Tomb_of_Nebamun.jpg', focus: '50% 40%' },
  { id: 'nakht', title: 'North Side of the West Wall of Nakht\'s Offering Chapel', by: 'Norman de Garis Davies', date: '1908–1914; original ca. 1410–1370 BCE', source: 'The Met', url: 'https://www.metmuseum.org/art/collection/search/548578' },
  { id: 'desmidiea', title: 'Desmidiea, Kunstformen der Natur', by: 'Ernst Haeckel', date: '1904', source: 'Wikimedia Commons (public domain)', url: 'https://commons.wikimedia.org/wiki/File:Haeckel_Desmidiea.jpg', focus: '50% 40%' },
  { id: 'diatomea', title: 'Diatomea, Kunstformen der Natur', by: 'Ernst Haeckel', date: '1904', source: 'Wikimedia Commons (public domain)', url: 'https://commons.wikimedia.org/wiki/File:Haeckel_Diatomea.jpg', focus: '50% 40%' },
  { id: 'muscinae', title: 'Muscinae, Kunstformen der Natur', by: 'Ernst Haeckel', date: '1904', source: 'Wikimedia Commons (public domain)', url: 'https://commons.wikimedia.org/wiki/File:Haeckel_Muscinae.jpg', focus: '50% 50%' },
  { id: 'hooke-cork', title: 'Cork cells, Micrographia', by: 'Robert Hooke', date: '1665', source: 'Wikimedia Commons (public domain)', url: 'https://commons.wikimedia.org/wiki/File:Cork_Micrographia_Hooke.png', focus: '50% 45%' },
]
