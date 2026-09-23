/**
 * The topic map on the home page: every tag a node, in one of two layers, and
 * an edge wherever two tags were used on the same piece.
 *
 * The layers are what the tag is mostly *about*: the inner core is the writing,
 * the outer shell is the building. A tag used on both goes to whichever side
 * uses it more, articles winning a tie — the core is the reason the site exists.
 */

export type TopicLayer = 'inner' | 'outer'

export interface TopicNode {
  tag: string
  layer: TopicLayer
  /** Pieces carrying it, both kinds together. */
  count: number
}

export interface TopicMap {
  nodes: TopicNode[]
  /** `[a, b, weight]` — indexes into `nodes`, `a < b`, weight = pieces shared. */
  edges: [number, number, number][]
}

interface Tagged {
  tags: string[]
  stack?: string[]
}

/** Nodes beyond this stop being readable as labels; the least-used drop out. */
const MAX_NODES = 36

export function buildTopicMap(posts: Tagged[], projects: Tagged[], max = MAX_NODES): TopicMap {
  const fromPosts = new Map<string, number>()
  const fromProjects = new Map<string, number>()
  const bump = (map: Map<string, number>, tag: string) => map.set(tag, (map.get(tag) ?? 0) + 1)

  const pieces = [
    ...posts.map((p) => unique(p.tags)),
    ...projects.map((p) => unique([...p.tags, ...(p.stack ?? [])])),
  ]
  posts.forEach((p) => unique(p.tags).forEach((tag) => bump(fromPosts, tag)))
  projects.forEach((p) =>
    unique([...p.tags, ...(p.stack ?? [])]).forEach((tag) => bump(fromProjects, tag)),
  )

  const all = new Set([...fromPosts.keys(), ...fromProjects.keys()])
  const nodes: TopicNode[] = [...all]
    .map((tag) => {
      const a = fromPosts.get(tag) ?? 0
      const b = fromProjects.get(tag) ?? 0
      return { tag, layer: a >= b ? ('inner' as const) : ('outer' as const), count: a + b }
    })
    .sort((x, y) => y.count - x.count || x.tag.localeCompare(y.tag))
    .slice(0, max)

  const at = new Map(nodes.map((node, i) => [node.tag, i]))
  const weights = new Map<string, number>()
  for (const tags of pieces) {
    const present = tags.map((tag) => at.get(tag)).filter((i): i is number => i !== undefined)
    for (let i = 0; i < present.length; i++) {
      for (let j = i + 1; j < present.length; j++) {
        const [a, b] = present[i] < present[j] ? [present[i], present[j]] : [present[j], present[i]]
        const key = `${a}:${b}`
        weights.set(key, (weights.get(key) ?? 0) + 1)
      }
    }
  }

  const edges = [...weights].map(([key, weight]) => {
    const [a, b] = key.split(':').map(Number)
    return [a, b, weight] as [number, number, number]
  })

  return { nodes, edges }
}

function unique(tags: string[]): string[] {
  return [...new Set(tags)]
}
