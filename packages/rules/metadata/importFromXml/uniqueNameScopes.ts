import type { ValidationIssue } from "@nkdk/runtime"
import type { LocalMetadataEvent, MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { collectUniqueNameConflicts, uniqueNameConflictMessage } from "../validation/uniqueNameConflicts"

export function collectImportUniqueNameIssues(
  rule: MetadataItemRule,
  events: readonly LocalMetadataEvent[],
): ValidationIssue[] {
  if (rule.uniqueNameScopes === undefined) return []
  const names = new Map<string, string[]>()
  for (const event of events) {
    if (event.kind !== "item" || event.name === undefined || event.yamlPath.length !== 2) continue
    const collection = event.yamlPath[0]
    if (typeof collection !== "string") continue
    const entries = names.get(collection) ?? []
    entries.push(event.name)
    names.set(collection, entries)
  }
  return collectUniqueNameConflicts({
    scopes: rule.uniqueNameScopes,
    collectionPath: key => {
      const yaml = rule.properties[key]?.yaml
      return typeof yaml === "string" ? [yaml] : undefined
    },
    names: path => names.get(path[0]!) ?? [],
  }).map(conflict => ({
    code: "diagnostic.structure",
    kind: "semantic",
    target: { kind: "path", path: [...conflict.collectionPath, conflict.name] },
    params: { message: uniqueNameConflictMessage(conflict) },
  }))
}
