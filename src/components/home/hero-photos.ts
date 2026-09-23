/**
 * The pictures in the hero's collection that are not drawn but found: public
 * domain and CC0 works — statues, strange and old art, the sea, European
 * watercolour landscapes, Jupiter, a black hole, and plant cells.
 *
 * Sources: The Met's Open Access (CC0), NASA (not subject to copyright), and
 * Wikimedia Commons files marked public domain. Credits are shown with the
 * picture anyway: it is the decent thing, and NASA asks for it.
 *
 * Files live in /public/hero (1920px WebP) and /public/hero/thumb (480px,
 * used by the opening timelapse).
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
  { id: 'desmidiea', title: 'Desmidiea, Kunstformen der Natur', by: 'Ernst Haeckel', date: '1904', source: 'Wikimedia Commons (public domain)', url: 'https://commons.wikimedia.org/wiki/File:Haeckel_Desmidiea.jpg', focus: '50% 40%' },
  { id: 'diatomea', title: 'Diatomea, Kunstformen der Natur', by: 'Ernst Haeckel', date: '1904', source: 'Wikimedia Commons (public domain)', url: 'https://commons.wikimedia.org/wiki/File:Haeckel_Diatomea.jpg', focus: '50% 40%' },
  { id: 'muscinae', title: 'Muscinae, Kunstformen der Natur', by: 'Ernst Haeckel', date: '1904', source: 'Wikimedia Commons (public domain)', url: 'https://commons.wikimedia.org/wiki/File:Haeckel_Muscinae.jpg', focus: '50% 50%' },
  { id: 'hooke-cork', title: 'Cork cells, Micrographia', by: 'Robert Hooke', date: '1665', source: 'Wikimedia Commons (public domain)', url: 'https://commons.wikimedia.org/wiki/File:Cork_Micrographia_Hooke.png', focus: '50% 45%' },
]
