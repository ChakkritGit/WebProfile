/**
 * The ornaments, all of them, drawing nothing.
 *
 * Every one of these was pure decoration: a blob behind a heading, a scribble
 * round the name, sparkles beside a photograph, a squiggle over a card, a wave
 * above the footer, a starfield across the hero. A document with no stylesheet
 * has none of that, and several of them were built out of inline positioning —
 * the one thing a missing stylesheet cannot take away, so it is taken away here.
 *
 * The functions stay, with their signatures, so nothing that calls them has to
 * change. The difference between this branch and the real site is meant to be a
 * stylesheet, not a rewrite. Each still declares the props it used to take, so
 * a call site that passes a colour or a delay still type-checks.
 */

/* eslint-disable @typescript-eslint/no-unused-vars -- the props are the contract;
   nothing draws them any more. */

export function Blob(_props: { className?: string; color?: string; delay?: number }) {
  return null
}

export function Squiggle(_props: { className?: string; color?: string }) {
  return null
}

export function StarBurst(_props: { className?: string; color?: string }) {
  return null
}

export function CircleScribble(_props: { className?: string; color?: string }) {
  return null
}

export function WaveDivider(_props: { className?: string; flip?: boolean }) {
  return null
}

export function StarGrid(_props: { className?: string }) {
  return null
}
