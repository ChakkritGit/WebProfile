/**
 * The characters the home page's CTA scrambles through, and the stylesheet
 * that brings in the faces the rarer scripts need — cut by Google to exactly
 * these characters, so it is a few kilobytes rather than whole fonts. Shared by
 * the client component that draws them and the server page that links the
 * stylesheet.
 */
export const WORLD_GLYPHS = '𓀀𓁐𓂀𓃒𓃠𓄿𓅓𓆣𓇋𓈖𓉐𓊃𓋹𓌳𓍯𓎛𓏏𒀀𒀭𒁀𒂗𒃻𒄿𒅆𒆠𒇷𒈠𒉿𒊏𒋗ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟⴰⴱⴳⴷⴹⴻⴼⴽሀለሐመሠረԱԲԳԴԵԶΞΨΩΔΦΣΛΘЖЯЩЮФЪアカサタナハマヤラワ⠿⠾⠽⠻⠷⠯'

const FAMILIES = [
  'Noto Sans Egyptian Hieroglyphs',
  'Noto Sans Cuneiform',
  'Noto Sans Runic',
  'Noto Sans Tifinagh',
  'Noto Sans Ethiopic',
  'Noto Sans Armenian',
]

export const WORLD_GLYPHS_FONT = `https://fonts.googleapis.com/css2?${FAMILIES.map((f) => `family=${f.replace(/ /g, '+')}`).join('&')}&text=${encodeURIComponent(WORLD_GLYPHS)}&display=swap`
