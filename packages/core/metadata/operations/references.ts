import type { MetadataTargetOwner } from "../commonObjects/metadataTargets"
import type { StructuralReferenceCandidate } from "../orchestration/property/fn"
import { getTypeRule } from "../orchestration/property/typeRuleRegistry"
import type { MetadataItemRule } from "../orchestration/property/types"
import type { ConfigurationContext } from "../context/types"
import { callAtomicFromYAML } from "../orchestration/property/fromYAMLToXML"
import { exportPropertyValueToYAML } from "../orchestration/property/toYAML"
import type { ParsedYaml } from "../../yaml/parseMetadataYaml"
import type { OperationSnapshotItem } from "./projectSnapshot"
import type { MetadataOperationBlockedReference, MetadataOperationReferenceChange } from "./types"
import { defaultMetadataOperationsContext } from "./context"

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
  context?: ConfigurationContext
}): StructuralReferenceCollectionResult {
  return collectStructuralReferencesInObject({
    filePath: params.item.filePath,
    parsed: params.parsed,
    rule: params.item.rule,
    value: params.item.yaml,
    yamlPath: [],
    owner: params.owner,
    context: params.context,
  })
}

function collectStructuralReferencesInObject(params: {
  filePath: string
  parsed: ParsedYaml
  rule: MetadataItemRule
  value: unknown
  yamlPath: Array<string | number>
  owner?: MetadataTargetOwner
  context?: ConfigurationContext
}): StructuralReferenceCollectionResult {
  const record = asRecord(params.value)
  if (!record) return { ok: true, references: [] }
  const context = params.context ?? defaultMetadataOperationsContext()

  const references: StructuralReferenceInput[] = []
  for (const [propertyName, propRule] of Object.entries(params.rule.properties)) {
    if (typeof propRule.yaml !== "string") continue

    const yamlValue = record[propRule.yaml]
    if (yamlValue === undefined) continue

    const handler = getTypeRule(propRule.type, "structuralReferences")
    if (handler) {
      let typedValue = callAtomicFromYAML({
        context,
        rule: propRule,
        value: yamlValue,
        owner: params.owner,
      })
      const candidates = handler({
        filePath: params.filePath,
        parsed: params.parsed,
        yamlPath: [...params.yamlPath, propRule.yaml],
        propRule,
        propertyName,
        value: typedValue,
        setValue: (nextValue) => {
          typedValue = nextValue
          record[propRule.yaml as string] = exportPropertyValueToYAML({
            context,
            rule: propRule,
            value: nextValue,
            owner: params.owner,
          })
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
        references.push({
          ...candidate,
          filePath: params.filePath,
          setCanonical: (nextCanonical) => {
            candidate.setCanonical(nextCanonical)
            record[propRule.yaml as string] = exportPropertyValueToYAML({
              context,
              rule: propRule,
              value: typedValue,
              owner: ownerForRewrittenCanonical(propRule, params.owner, nextCanonical),
            })
          },
        })
      }
    }

    const nested = collectNestedStructuralReferences({
      ...params,
      value: yamlValue,
      propertyRule: propRule,
      yamlPath: [...params.yamlPath, propRule.yaml],
    })
    if (nested === undefined) continue
    if (!nested.ok) return nested
    references.push(...nested.references)
  }

  return { ok: true, references }
}

function ownerForRewrittenCanonical(
  rule: MetadataItemRule["properties"][string],
  owner: MetadataTargetOwner | undefined,
  canonical: string
): MetadataTargetOwner | undefined {
  if (owner === undefined || rule.metadataTarget?.kind !== "member" || rule.metadataTarget.owner !== "this")
    return owner
  const [root, objectName] = canonical.split(".")
  return root === owner.root && objectName ? { root: owner.root, objectName } : owner
}

function collectNestedStructuralReferences(params: {
  filePath: string
  parsed: ParsedYaml
  propertyRule: MetadataItemRule["properties"][string]
  value: unknown
  yamlPath: Array<string | number>
  owner?: MetadataTargetOwner
}): StructuralReferenceCollectionResult | undefined {
  const descriptor = getTypeRule(params.propertyRule.type, "yamlToXMLNestedRule")
  if (descriptor === undefined || descriptor.kind === "externalFile") return undefined
  if (descriptor.kind === "item") {
    return collectStructuralReferencesInObject({ ...params, rule: descriptor.itemRule })
  }
  if (descriptor.kind === "polymorphicRecord") {
    const record = asRecord(params.value)
    if (record === undefined) return { ok: true, references: [] }
    return collectStructuralReferencesInObject({
      ...params,
      rule: descriptor.resolveItemRule({ yaml: record, name: "" }),
    })
  }
  if (Array.isArray(params.value)) {
    const references: StructuralReferenceInput[] = []
    for (let index = 0; index < params.value.length; index += 1) {
      const result = collectStructuralReferencesInObject({
        ...params,
        value: params.value[index],
        rule:
          descriptor.resolveItemRule?.({
            yaml: params.value[index],
            name: undefined,
            index,
            propertyRule: params.propertyRule,
          }) ?? descriptor.itemRule,
        yamlPath: [...params.yamlPath, index],
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
      rule:
        descriptor.resolveItemRule?.({
          yaml: item,
          name: key,
          index: references.length,
          propertyRule: params.propertyRule,
        }) ?? descriptor.itemRule,
      yamlPath: [...params.yamlPath, key],
    })
    if (!result.ok) return result
    references.push(...result.references)
  }
  return { ok: true, references }
}

function canonicalMatchesPrefix(value: string, prefix: string): boolean {
  return value === prefix || value.startsWith(`${prefix}.`)
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : undefined
}
