import type { MetadataTargetOwner } from "~/metadata/commonObjects/metadataTargets"
import type { StructuralReferenceCandidate } from "~/metadata/orchestration/property/fn"
import { getTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
import type { ParsedYaml } from "~/yaml/parseMetadataYaml"
import type { OperationSnapshotItem } from "./projectSnapshot"
import type { MetadataOperationBlockedReference, MetadataOperationReferenceChange } from "./types"

export interface StructuralReferenceInput extends StructuralReferenceCandidate {
  filePath: string
}

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
}): StructuralReferenceInput[] {
  return collectStructuralReferencesInObject({
    filePath: params.item.filePath,
    parsed: params.parsed,
    rule: params.item.resource.owner.spec.rule,
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
}): StructuralReferenceInput[] {
  const record = asRecord(params.value)
  if (!record) return []

  const references: StructuralReferenceInput[] = []
  for (const [propertyName, propRule] of Object.entries(params.rule.properties)) {
    if (typeof propRule.yaml !== "string") continue

    const value = record[propertyName]
    if (value === undefined) continue

    const handler = getTypeRule(propRule.type, "structuralReferences")
    if (handler) {
      references.push(
        ...handler({
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
        }).map((candidate) => ({ ...candidate, filePath: params.filePath })),
      )
    }

    const itemRule = nestedItemRule(propRule)
    if (!itemRule) continue

    references.push(
      ...collectNestedStructuralReferences({
        ...params,
        value,
        itemRule,
        yamlPath: [...params.yamlPath, propRule.yaml],
      }),
    )
  }

  return references
}

function collectNestedStructuralReferences(params: {
  filePath: string
  parsed: ParsedYaml
  itemRule: MetadataItemRule
  value: unknown
  yamlPath: Array<string | number>
  owner?: MetadataTargetOwner
}): StructuralReferenceInput[] {
  if (Array.isArray(params.value)) {
    return params.value.flatMap((item, index) =>
      collectStructuralReferencesInObject({
        ...params,
        value: item,
        rule: params.itemRule,
        yamlPath: [...params.yamlPath, nestedItemPathSegment(item, index)],
      }),
    )
  }

  const record = asRecord(params.value)
  if (!record) return []

  return Object.entries(record).flatMap(([key, item]) =>
    collectStructuralReferencesInObject({
      ...params,
      value: item,
      rule: params.itemRule,
      yamlPath: [...params.yamlPath, key],
    }),
  )
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
