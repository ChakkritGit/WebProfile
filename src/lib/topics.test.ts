// Run: npx tsx --test src/lib/topics.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildTopicMap } from './topics'

test('layers follow where a tag is used most, articles winning ties', () => {
  const { nodes } = buildTopicMap(
    [{ tags: ['React', 'Thai'] }, { tags: ['React'] }],
    [{ tags: ['React'], stack: ['Kotlin'] }, { tags: ['Kotlin', 'Thai'] }],
  )
  const layer = Object.fromEntries(nodes.map((n) => [n.tag, n.layer]))
  assert.equal(layer.React, 'inner') // 2 posts vs 1 project
  assert.equal(layer.Kotlin, 'outer') // projects only
  assert.equal(layer.Thai, 'inner') // 1 vs 1 — a tie
  assert.equal(nodes[0].tag, 'React') // most used first
})

test('an edge joins tags that share a piece, weighted by how many', () => {
  const { nodes, edges } = buildTopicMap(
    [{ tags: ['A', 'B'] }, { tags: ['B', 'A', 'A'] }],
    [{ tags: ['B'], stack: ['C'] }],
  )
  const name = (i: number) => nodes[i].tag
  const pairs = edges.map(([a, b, w]) => `${[name(a), name(b)].sort().join('-')}:${w}`).sort()
  assert.deepEqual(pairs, ['A-B:2', 'B-C:1'])
  for (const [a, b] of edges) assert.ok(a < b)
})

test('the cap keeps the most-used tags and drops edges to the rest', () => {
  const { nodes, edges } = buildTopicMap([{ tags: ['A', 'B'] }, { tags: ['A'] }], [], 1)
  assert.deepEqual(nodes.map((n) => n.tag), ['A'])
  assert.deepEqual(edges, [])
})
