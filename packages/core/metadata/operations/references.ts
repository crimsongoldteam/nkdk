import type { MetadataTargetOwner } from "~/metadata/commonObjects/metadataTargets"
import type { StructuralReferenceCandidate } from "~/metadata/orchestration/property/fn"
import type { ElementRule, ElementType } from "~/metadata/orchestration/formElement/types"
import { getElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { getTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
import type { ParsedYaml } from "~/yaml/parseMetadataYaml"
import type { OperationSnapshotItem } from "./projectSnapshot"
import type { MetadataOperationBlockedReference, MetadataOperationReferenceChange } from "./types"

export interface StructuralReferenceInput extends StructuralReferenceCandidate {
  filePath: string
}

export type StructuralReferenceCollectionResult =
  | { ok: true; references: StructuralReferenceInput[] }
  | { ok: false; code: "rule_contract_violation"; message: string }

export function collectStructuralReferenceChanges(params: {
  projectDir: string
  items: StructuralReferenceInput[]
  fromPrefix: string
  toPrefix: string
}): MetadataOperationReferenceChange[] {
  return params.items.flatMap((item) => {
    const to = rewriteCanonicalPrefix(item.canonical, params.fromPrefix, params.toPrefix)
    if (to === undefined) return []
    return [{ filePath: item.filePath, yamlPath: item.yamlPath, from: item.canonical, to }]
  })
}

export function collectBlockedReferences(params: {
  items: StructuralReferenceInput[]
  deletedPrefix: string
  isInsideDeletedTree: (filePath: string) => boolean
}): MetadataOperationBlockedReference[] {
  return params.items.flatMap((item) => {
    if (params.isInsideDeletedTree(item.filePath)) return []
    if (!canonicalMatchesPrefix(item.canonical, params.deletedPrefix)) return []
    return [{ filePath: item.filePath, yamlPath: item.yamlPath, value: item.canonical }]
  })
}

export function rewriteCanonicalPrefix(value: string, fromPrefix: string, toPrefix: string): string | undefined {
  if (value === fromPrefix) return toPrefix
  if (value.startsWith(`${fromPrefix}.`)) return `${toPrefix}${value.slice(fromPrefix.length)}`
  return undefined
}

export function collectStructuralReferencesForItem(params: {
  item: OperationSnapshotItem
  parsed: ParsedYaml
  owner?: MetadataTargetOwner
}): StructuralReferenceCollectionResult {
  return collectStructuralReferencesInObject({
    filePath: params.item.filePath,
    parsed: params.parsed,
    rule: params.item.rule,
    value: params.item.model,
    yamlPath: [],
    owner: params.owner,
  })
}

function collectStructuralReferencesInObject(params: {
  filePath: string
  parsed: ParsedYaml
  rule: MetadataItemRule
  value: unknown
  yamlPath: Array<string | number>
  owner?: MetadataTargetOwner
}): StructuralReferenceCollectionResult {
  const record = asRecord(params.value)
  if (!record) return { ok: true, references: [] }

  const references: StructuralReferenceInput[] = []
  for (const [propertyName, propRule] of Object.entries(params.rule.properties)) {
    if (typeof propRule.yaml !== "string") continue

    const value = record[propertyName]
    if (value === undefined) continue

    const handler = getTypeRule(propRule.type, "structuralReferences")
    if (handler) {
      const candidates = handler({
        filePath: params.filePath,
        parsed: params.parsed,
        yamlPath: [...params.yamlPath, propRule.yaml],
        propRule,
        propertyName,
        value,
        setValue: (nextValue) => {
          record[propertyName] = nextValue
        },
        owner: params.owner,
      })
      for (const candidate of candidates) {
        const runtimeCandidate = candidate as StructuralReferenceCandidate & { setCanonical?: unknown }
        if (typeof runtimeCandidate.setCanonical !== "function") {
          return {
            ok: false,
            code: "rule_contract_violation",
            message: `Правило ${propRule.type} распознало ссылку без setter в ${params.filePath}`,
          }
        }
        references.push({ ...candidate, filePath: params.filePath })
      }
    }

    const elementReferences = collectFormElementReferences({
      ...params,
      value,
      yamlPath: [...params.yamlPath, propRule.yaml],
    })
    if (elementReferences !== undefined) {
      if (!elementReferences.ok) return elementReferences
      references.push(...elementReferences.references)
    }

    const itemRule = nestedItemRule(propRule)
    if (!itemRule) continue

    const nested = collectNestedStructuralReferences({
      ...params,
      value,
      itemRule,
      yamlPath: [...params.yamlPath, propRule.yaml],
    })
    if (!nested.ok) return nested
    references.push(...nested.references)
  }

  return { ok: true, references }
}

function collectFormElementReferences(params: {
  filePath: string
  parsed: ParsedYaml
  value: unknown
  yamlPath: Array<string | number>
  owner?: MetadataTargetOwner
}): StructuralReferenceCollectionResult | undefined {
  const single = getElementRecord(params.value)
  if (single !== undefined) {
    return collectStructuralReferencesInObject({
      ...params,
      rule: getElementRule(single.itemType),
      value: single,
    })
  }

  if (Array.isArray(params.value)) {
    const references: StructuralReferenceInput[] = []
    let hasElement = false
    for (let index = 0; index < params.value.length; index += 1) {
      const element = getElementRecord(params.value[index])
      if (element === undefined) continue

      hasElement = true
      const result = collectStructuralReferencesInObject({
        ...params,
        rule: getElementRule(element.itemType),
        value: element,
        yamlPath: [...params.yamlPath, typeof element.name === "string" ? element.name : index],
      })
      if (!result.ok) return result
      references.push(...result.references)
    }
    return hasElement ? { ok: true, references } : undefined
  }

  return undefined
}

function collectNestedStructuralReferences(params: {
  filePath: string
  parsed: ParsedYaml
  itemRule: MetadataItemRule
  value: unknown
  yamlPath: Array<string | number>
  owner?: MetadataTargetOwner
}): StructuralReferenceCollectionResult {
  if (Array.isArray(params.value)) {
    const references: StructuralReferenceInput[] = []
    for (let index = 0; index < params.value.length; index += 1) {
      const result = collectStructuralReferencesInObject({
        ...params,
        value: params.value[index],
        rule: params.itemRule,
        yamlPath: [...params.yamlPath, nestedItemPathSegment(params.value[index], index)],
      })
      if (!result.ok) return result
      references.push(...result.references)
    }
    return { ok: true, references }
  }

  const record = asRecord(params.value)
  if (!record) return { ok: true, references: [] }

  const references: StructuralReferenceInput[] = []
  for (const [key, item] of Object.entries(record)) {
    const result = collectStructuralReferencesInObject({
      ...params,
      value: item,
      rule: params.itemRule,
      yamlPath: [...params.yamlPath, key],
    })
    if (!result.ok) return result
    references.push(...result.references)
  }
  return { ok: true, references }
}

function nestedItemRule(propRule: MetadataItemRule["properties"][string]): MetadataItemRule | undefined {
  const collectionItemRule = getTypeRule(propRule.type, "collectionItemRule")
  if (collectionItemRule?.itemRule) return collectionItemRule.itemRule

  if ("itemRule" in propRule && propRule.itemRule !== undefined) {
    return propRule.itemRule as MetadataItemRule
  }

  return undefined
}

function nestedItemPathSegment(item: unknown, index: number): string | number {
  const record = asRecord(item)
  return typeof record?.name === "string" ? record.name : index
}

function canonicalMatchesPrefix(value: string, prefix: string): boolean {
  return value === prefix || value.startsWith(`${prefix}.`)
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : undefined
}

interface ElementRecord extends Record<string, unknown> {
  itemType: ElementType
}

function getElementRecord(value: unknown): ElementRecord | undefined {
  const record = asRecord(value)
  if (record === undefined || typeof record.itemType !== "string") return undefined

  return getElementRuleIfKnown(record.itemType) === undefined ? undefined : (record as ElementRecord)
}

function getElementRuleIfKnown(itemType: string): ElementRule | undefined {
  try {
    return getElementRule(itemType as ElementType)
  } catch {
    return undefined
  }
}
