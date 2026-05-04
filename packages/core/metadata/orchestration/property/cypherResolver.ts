import type { ConnectionOptions } from "@nakidka/graph"
import { withGraph } from "@nakidka/graph"
import { CypherCache } from "./cypherCache"
import { isCypherPredicate, type CypherPredicate } from "./cypherPredicate"
import type { MetadataItemRule } from "./types"

export const collectCypherPredicates = (
  rule: MetadataItemRule,
  scope: string,
): Array<{ predicate: CypherPredicate; scope: string }> => {
  const result: Array<{ predicate: CypherPredicate; scope: string }> = []

  for (const propRule of Object.values(rule.properties)) {
    if (isCypherPredicate(propRule.toXML)) {
      result.push({ predicate: propRule.toXML, scope })
    }
  }

  return result
}

export const resolveCypherPredicates = async (
  predicates: Array<{ predicate: CypherPredicate; scope: string }>,
  cache: CypherCache,
  opts?: ConnectionOptions,
): Promise<void> => {
  const unique = new Map<string, CypherPredicate>()
  for (const { predicate } of predicates) {
    if (!unique.has(predicate.query)) unique.set(predicate.query, predicate)
  }

  if (unique.size === 0) return

  await withGraph(async (graph) => {
    for (const [key, predicate] of unique) {
      const entry = predicates.find((p) => p.predicate.query === predicate.query)
      const scope = entry?.scope ?? ""
      const rows = await graph.query<Record<string, unknown>>(predicate.query, { scope })
      cache.set(key, rows)
    }
  }, opts)
}
