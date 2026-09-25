/**
 * "ton": the black hole easter egg on the home hero (collage-backdrop.tsx).
 * Mr. Worldwide's chat fires this event instead of asking the model; the hero
 * cancels it to say "playing". Off the home page, `/#ton` opens it on arrival.
 */
export const TON_EVENT = 'ton'
export const TON_HASH = '#ton'

/** The word typed into a text field — also t-o-n typed on a Thai keyboard. */
export const isTon = (text: string) => ['ton', 'ะนื'].includes(text.trim().toLowerCase())
