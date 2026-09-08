import { yamlPathToPointer } from "@nkdk/runtime"
import { dependentImportDependencies, dependentRootPropertyKey, type CompiledPropertyRuleExecution, type DirectImportFactsSink,
  type ImportedDependentPropertyCandidate, type MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { selectImportPropertyPaths } from "./selectedPropertyFacts"
import { createSelectedPropertyValue } from "./selectedPropertyValue"

/** Только проверяемые значения и зависимости, объявленные обработчиком элемента. */
export function selectDependentValidationFacts(params: {
  readonly rule: MetadataItemRule
  readonly owner: { readonly dir: string; readonly name: string }
  readonly candidates: readonly ImportedDependentPropertyCandidate[]
  readonly facts: readonly Parameters<DirectImportFactsSink["acceptProperty"]>[0][]
  readonly execution?: CompiledPropertyRuleExecution
}): unknown {
  const paths = new Map<string, readonly (string | number)[]>()
  const add = (path: readonly (string | number)[]) => paths.set(yamlPathToPointer(path)!, path)
  const items = new Set<string>()
  for (const candidate of params.candidates) {
    add(candidate.yamlPath)
    const key = `${candidate.itemType}\u0000${yamlPathToPointer(candidate.itemYamlPath)}`
    if (items.has(key)) continue
    items.add(key)
    const context = { itemType: candidate.itemType, itemName: candidate.itemName,
      itemYamlPath: candidate.itemYamlPath, rootRule: params.rule, owner: params.owner }
    const dependencies = params.execution === undefined
      ? dependentImportDependencies(context) : params.execution.dependentImportDependencies(context)
    for (const name of dependencies?.item ?? []) add([...candidate.itemYamlPath, name])
    for (const name of dependencies?.root ?? []) add([dependentRootPropertyKey(name)])
  }
  const selected = selectImportPropertyPaths(params.facts, paths)
  const result = createSelectedPropertyValue()
  for (const [key, entry] of selected) result.accept(paths.get(key)!, entry.value, entry.scalarTag)
  return result.finish()
}
