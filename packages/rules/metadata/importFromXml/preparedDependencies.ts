import { copyYAMLRuntimeMetadata, yamlPathToPointer } from "@nkdk/runtime"
import { recordAtPath } from "./dependentItems"
import {
  prepareDependentImportFacts,
  shouldRemoveImportedDependentProperty,
  type DependentImportFacts,
  type DependentItemParams,
  type ImportedDependentPropertyCandidate,
  type MetadataItemRule,
  type PreparedImportDependencies,
} from "@nkdk/runtime/rule-kit"

export interface ImportDependencyFacts {
  readonly rule: MetadataItemRule
  readonly owner: DependentItemParams["owner"]
  readonly properties: ReadonlyMap<string, DependentImportFacts>
}

export function collectImportDependencyFacts(params: {
  readonly rule: MetadataItemRule
  readonly owner: DependentItemParams["owner"]
  readonly yaml: unknown
  readonly candidates: readonly ImportedDependentPropertyCandidate[]
}): ImportDependencyFacts {
  const properties = new Map<string, DependentImportFacts>()
  for (const candidate of params.candidates) {
    const item = recordAtPath(params.yaml, candidate.itemYamlPath)
    if (item === undefined) continue
    const facts = prepareDependentImportFacts({
      itemType: candidate.itemType,
      itemName: candidate.itemName,
      itemYamlPath: candidate.itemYamlPath,
      item,
      rootYaml: params.yaml,
      rootRule: params.rule,
      owner: params.owner,
    })
    if (facts !== undefined) properties.set(propertyAddress(candidate), facts)
  }
  return { rule: params.rule, owner: params.owner, properties }
}

export function prepareImportDependencies(
  facts: ImportDependencyFacts,
  lookups: Pick<DependentItemParams, "definedTypeLookup" | "metadataTargetLookup"> = {},
): PreparedImportDependencies {
  return {
    shouldOmit(candidate, values) {
      const dependency = facts.properties.get(propertyAddress(candidate))
      if (dependency === undefined) return false
      const item = { ...dependency.item, ...values }
      copyYAMLRuntimeMetadata(values, item)
      return shouldRemoveImportedDependentProperty({
        ...lookups,
        itemType: candidate.itemType,
        itemName: candidate.itemName,
        itemYamlPath: candidate.itemYamlPath,
        item,
        rootYaml: dependency.root,
        rootRule: facts.rule,
        owner: facts.owner,
        candidate,
      })
    },
  }
}

function propertyAddress(candidate: ImportedDependentPropertyCandidate): string {
  return candidate.logicalAddress ?? `${yamlPathToPointer(candidate.itemYamlPath)}:${candidate.propertyKey}`
}
