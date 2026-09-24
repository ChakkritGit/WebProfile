/**
 * The characters the scrambles churn through, and the Google stylesheet that
 * cuts the rarer scripts' faces to exactly these characters — a few kilobytes
 * rather than whole fonts. The cut files are saved into src/assets/fonts/world by
 * scripts/fetch-world-glyph-fonts.mts; change WORLD_GLYPHS, run it again.
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
