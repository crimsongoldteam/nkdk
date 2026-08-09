import type { ConfigurationIndexCollector } from "../configurationIndex/collector/writer"
import {
  shouldRemoveImportedDependentProperty,
  shouldTagImportedDependentProperty,
  type DependentItemParams,
} from "../ruleRuntime/property/dependentItemRegistry"
import type { ImportedDependentPropertyCandidate } from "../ruleRuntime/property/importYamlTypes"
import type { MetadataItemRule } from "../ruleRuntime/property/types"
import { markYAMLScalarTag, xmlScalarTagValue } from "../../yaml/scalarTags"

export function normalizeImportedDependentItems(params: {
  readonly yaml: unknown
  readonly rule: MetadataItemRule
  readonly candidates: readonly ImportedDependentPropertyCandidate[]
  readonly collector: ConfigurationIndexCollector
  readonly owner: DependentItemParams["owner"]
}): number {
  let removed = 0
  for (const candidate of params.candidates) {
    const item = recordAtPath(params.yaml, candidate.itemYamlPath)
    if (item === undefined) continue
    const dependentParams = {
      itemType: candidate.itemType,
      ...(candidate.itemName === undefined ? {} : { itemName: candidate.itemName }),
      item,
      itemYamlPath: candidate.itemYamlPath,
      rootYaml: params.yaml,
      rootRule: params.rule,
      owner: params.owner,
      candidate,
    }
    const shouldRemove = shouldRemoveImportedDependentProperty(dependentParams)
    const yamlKey = candidate.yamlPath.at(-1)
    if (typeof yamlKey !== "string" || !Object.prototype.hasOwnProperty.call(item, yamlKey)) continue
    if (shouldRemove) {
      delete item[yamlKey]
      removed += 1
      if (candidate.logicalAddress !== undefined) {
        params.collector.preserveRawXmlState(
          candidate.logicalAddress,
          candidate.xmlValue,
          candidate.presentInXML,
        )
      }
      continue
    }
    if (shouldTagImportedDependentProperty(dependentParams)) {
      const value = item[yamlKey]
      if (typeof value === "string" || typeof value === "number") {
        item[yamlKey] = xmlScalarTagValue(String(value))
        markYAMLScalarTag(item, yamlKey, "xml")
      }
    }
  }
  return removed
}

function recordAtPath(root: unknown, path: readonly (string | number)[]): Record<string, unknown> | undefined {
  let value = root
  for (const segment of path) {
    if (value === null || typeof value !== "object") return undefined
    value = (value as Record<string | number, unknown>)[segment]
  }
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
}
