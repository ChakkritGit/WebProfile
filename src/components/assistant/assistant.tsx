'use client'

import { useState } from 'react'
import Stage from './stage'
import { HologramChat } from './hologram-chat'
import type { Engine } from './engine/engine'

export default function Assistant() {
  const [engine, setEngine] = useState<Engine | null>(null)
  const [open, setOpen] = useState(false)
  return (
    <>
      <Stage onReady={setEngine} onOpen={() => setOpen(true)} busy={open} />
      <HologramChat open={open} onClose={() => setOpen(false)} engine={engine} />
    </>
  )
}
