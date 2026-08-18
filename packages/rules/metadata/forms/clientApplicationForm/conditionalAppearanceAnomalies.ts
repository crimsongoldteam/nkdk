import { markYAMLScalarTag, xmlAnomalyTagValue } from "@nkdk/runtime"
import { checkDataPathTraceAvailability } from "@nkdk/runtime/rule-kit"
import type { OwnerMetadataCache } from "../../validation/dataPath/ownerCache"
import { resolveDataPathCore } from "../../validation/dataPath/coreResolver"
import {
  collectConditionalAppearanceOccurrences,
  type ConditionalAppearanceOccurrences,
  type ConditionalOperandOccurrence,
  type ConditionalTargetOccurrence,
} from "./conditionalAppearanceTraversal"
import type { FormDataPathContext } from "./formDataPathContext"

export function finalizeImportedConditionalAppearanceAnomalies(params: {
  yaml: unknown
  originals: ConditionalAppearanceOccurrences
  dataPathContext: FormDataPathContext
  ownerCache: OwnerMetadataCache
}): void {
  const current = collectConditionalAppearanceOccurrences(params.yaml)
  const originalOperands = byPath(params.originals.operands)
  const originalTargets = byPath(params.originals.targets)

  for (const occurrence of current.operands) {
    if (occurrence.tagged || occurrence.value === "." || !isFieldValue(occurrence.value)) continue
    const original = originalOperands.get(pathKey(occurrence.yamlPath))
    if (original === undefined || typeof original.value !== "string") continue
    if (conditionalFieldIsResolved(occurrence, params.dataPathContext, params.ownerCache)) continue

    tagOccurrence(occurrence, "xml/value", original.value.replace(/^\./, ""))
  }

  for (const occurrence of current.targets) {
    if (occurrence.tagged) continue
    const resolved = occurrence.tableContext === undefined
      ? params.dataPathContext.elementsByName.has(occurrence.value)
      : conditionalFieldIsResolved(occurrence, params.dataPathContext, params.ownerCache)
    if (resolved) continue
    const original = originalTargets.get(pathKey(occurrence.yamlPath))
    if (original === undefined) continue
    tagOccurrence(occurrence, "xml/reference", original.value)
  }
}

function conditionalFieldIsResolved(
  occurrence: ConditionalOperandOccurrence | ConditionalTargetOccurrence,
  dataPathContext: FormDataPathContext,
  ownerCache: OwnerMetadataCache,
): boolean {
  const relative = String(occurrence.value).replace(/^\./, "")
  const value = occurrence.tableContext === undefined
    ? relative
    : `${occurrence.tableContext.dataPath}.${relative}`
  const result = resolveDataPathCore({
    value,
    nameMode: "yaml",
    index: dataPathContext.index,
    ownerCache,
  })
  return result.status !== "error" &&
    result.target !== undefined &&
    checkDataPathTraceAvailability("formConditionalFilter", result.target.trace ?? [])
}

function tagOccurrence(
  occurrence: ConditionalOperandOccurrence | ConditionalTargetOccurrence,
  tag: "xml/value" | "xml/reference",
  payload: string,
): void {
  const value = xmlAnomalyTagValue(tag, payload)
  if (Array.isArray(occurrence.parent) && typeof occurrence.key === "number") {
    occurrence.parent[occurrence.key] = value
  } else if (!Array.isArray(occurrence.parent) && typeof occurrence.key === "string") {
    occurrence.parent[occurrence.key] = value
  } else {
    throw new Error("Некорректный адрес значения условного оформления")
  }
  markYAMLScalarTag(occurrence.parent, occurrence.key, tag)
}

function byPath<T extends { readonly yamlPath: readonly (string | number)[] }>(items: readonly T[]): Map<string, T> {
  return new Map(items.map((item) => [pathKey(item.yamlPath), item]))
}

function pathKey(path: readonly (string | number)[]): string {
  return JSON.stringify(path)
}

function isFieldValue(value: unknown): value is string {
  return typeof value === "string" && value.startsWith(".")
}
