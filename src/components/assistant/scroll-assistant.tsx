'use client'

import { useState } from 'react'
import { ScrollGuide } from './scroll-guide'
import { HologramChat, type Actor } from './hologram-chat'

/** Mr. Worldwide as a paper scroll: the same chat, unrolled as paper, and no three.js. */
export default function ScrollAssistant() {
  const [actor, setActor] = useState<Actor | null>(null)
  const [open, setOpen] = useState(false)
  return (
    <>
      <ScrollGuide onReady={setActor} onOpen={() => setOpen(true)} />
      <HologramChat variant="paper" open={open} onClose={() => setOpen(false)} engine={actor} />
    </>
  )
}
