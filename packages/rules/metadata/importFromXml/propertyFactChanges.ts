import type { DirectImportFactsSink } from "@nkdk/runtime/rule-kit"

type PropertyFact = Parameters<DirectImportFactsSink["acceptProperty"]>[0]
interface PropertyFactChange {
  readonly yamlPath: readonly (string | number)[]
  readonly kind: "delete" | "set"
  readonly value?: unknown
}

interface ChangeNode {
  readonly children: Map<string | number, ChangeNode>
  readonly parent?: ChangeNode
  change?: PropertyFactChange
  template?: PropertyFact
  applied?: true
}

/** Индексируются только изменяемые адреса; факты просматриваются один раз. */
export function applyPropertyFactChanges(
  facts: readonly PropertyFact[],
  changes: readonly PropertyFactChange[],
): readonly PropertyFact[] {
  if (changes.length === 0) return facts
  const root: ChangeNode = { children: new Map() }
  const targets: ChangeNode[] = []
  for (const change of changes) {
    let node = root
    for (const segment of change.yamlPath) {
      let child = node.children.get(segment)
      if (child === undefined) {
        child = { children: new Map(), parent: node }
        node.children.set(segment, child)
      }
      node = child
    }
    if (node.change === undefined) targets.push(node)
    node.change = change
  }
  const result: PropertyFact[] = []
  for (const fact of facts) {
    let node: ChangeNode | undefined = root
    node.template ??= fact
    for (const segment of fact.yamlPath) {
      node = node.children.get(segment)
      if (node === undefined) break
      node.template ??= fact
    }
    const change = node?.change
    if (change === undefined) result.push(fact)
    else {
      node!.applied = true
      if (change.kind === "set") result.push({ ...fact, value: change.value })
    }
  }
  for (const node of targets) {
    const change = node.change!
    if (change.kind !== "set" || node.applied === true) continue
    const template = node.parent?.template ?? (change.yamlPath.length === 0 ? root.template : undefined)
    if (template === undefined) continue
    result.push({
      itemType: template.itemType,
      ...(template.itemRule === undefined ? {} : { itemRule: template.itemRule }),
      propertyKey: String(change.yamlPath.at(-1)),
      yamlPath: [...change.yamlPath],
      sourceYamlPath: [...change.yamlPath],
      value: change.value,
    })
  }
  return result
}
