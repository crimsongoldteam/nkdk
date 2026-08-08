import type { MetadataTargetOwner } from "../commonObjects/metadataTargets"
import type { ConfigurationContext } from "../context/types"
import { callAtomicFromYAML } from "../orchestration/property/fromYAMLToXML"
import type {
  PendingMetadataTargetReferenceCandidate,
  StructuralReferenceCandidate,
} from "../orchestration/property/fn"
import { getTypeRule } from "../orchestration/property/typeRuleRegistry"
import type { MetadataItemRule } from "../orchestration/property/types"
import { exportPropertyValueToYAML } from "../orchestration/property/toYAML"
import type { ParsedYaml } from "../../yaml/parseMetadataYaml"
import {
  collectDependentStructuralItemReferences,
  type DependentStructuralItemReference,
} from "../orchestration/property/dependentItemRegistry"

export interface StructuralYamlReference extends StructuralReferenceCandidate {
  readonly filePath: string
  readonly target: PendingMetadataTargetReferenceCandidate["target"]
  readonly constraint: PendingMetadataTargetReferenceCandidate["constraint"]
  readonly stageCanonical: (nextCanonical: string) => void
  readonly commitStaged: () => void
}

export type StructuralYamlReferenceCollectionResult =
  | { ok: true; references: StructuralYamlReference[] }
  | { ok: false; message: string }

export function collectStructuralYamlReferences(params: {
  filePath: string
  parsed: ParsedYaml
  rule: MetadataItemRule
  yaml: unknown
  owner?: MetadataTargetOwner
  context: ConfigurationContext
}): StructuralYamlReferenceCollectionResult {
  return collectObjectReferences({
    ...params,
    value: params.yaml,
    yamlPath: [],
    rootYaml: params.yaml,
    rootRule: params.rule,
  })
}

function collectObjectReferences(params: {
  filePath: string
  parsed: ParsedYaml
  rule: MetadataItemRule
  value: unknown
  yamlPath: Array<string | number>
  owner?: MetadataTargetOwner
  context: ConfigurationContext
  itemName?: string
  rootYaml: unknown
  rootRule: MetadataItemRule
}): StructuralYamlReferenceCollectionResult {
  const record = asRecord(params.value)
  if (record === undefined) return { ok: true, references: [] }

  const references: StructuralYamlReference[] = []
  const dependentReferences = collectDependentStructuralItemReferences({
    itemType: params.rule.itemType,
    ...(params.itemName === undefined ? {} : { itemName: params.itemName }),
    item: record,
    itemYamlPath: params.yamlPath,
    rootYaml: params.rootYaml,
    rootRule: params.rootRule,
    filePath: params.filePath,
    parsed: params.parsed,
    owner: { dir: params.owner?.root ?? "", name: params.owner?.objectName ?? "" },
    context: params.context,
    metadataTargetOwner: params.owner,
  })
  for (const candidate of dependentReferences) {
    let staged = false
    references.push({
      ...candidate,
      target: dependentStructuralTarget(candidate.target),
      constraint: dependentStructuralConstraint(candidate.constraint),
      filePath: params.filePath,
      stageCanonical(nextCanonical: string) {
        candidate.setCanonical(nextCanonical)
        staged = true
      },
      commitStaged() {
        if (!staged) return
        candidate.commitValue()
        staged = false
      },
      setCanonical(nextCanonical: string) {
        candidate.setCanonical(nextCanonical)
        candidate.commitValue()
      },
    })
  }
  for (const [propertyName, propertyRule] of Object.entries(params.rule.properties)) {
    if (typeof propertyRule.yaml !== "string") continue
    const yamlValue = record[propertyRule.yaml]
    if (yamlValue === undefined) continue

    const handler = getTypeRule(propertyRule.type, "structuralReferences")
    if (handler !== undefined) {
      let typedValue = callAtomicFromYAML({
        context: params.context,
        rule: propertyRule,
        value: yamlValue,
        owner: params.owner,
      })
      const candidates = handler({
        filePath: params.filePath,
        parsed: params.parsed,
        yamlPath: [...params.yamlPath, propertyRule.yaml],
        propRule: propertyRule,
        propertyName,
        value: typedValue,
        setValue: (nextValue) => {
          typedValue = nextValue
          record[propertyRule.yaml as string] = exportPropertyValueToYAML({
            context: params.context,
            rule: propertyRule,
            value: nextValue,
            owner: params.owner,
          })
        },
        owner: params.owner,
      })
      const indexedCandidates = getTypeRule(propertyRule.type, "collectMetadataTargetReferences")?.({
        filePath: params.filePath,
        parsed: params.parsed,
        yamlPath: [...params.yamlPath, propertyRule.yaml],
        propRule: propertyRule,
        propertyName,
        value: typedValue,
        owner: params.owner,
      }).references ?? []
      let stagedCanonical: string | undefined
      const commitStaged = (): void => {
        if (stagedCanonical === undefined) return
        record[propertyRule.yaml as string] = exportPropertyValueToYAML({
          context: params.context,
          rule: propertyRule,
          value: typedValue,
          owner: ownerForRewrittenCanonical(propertyRule, params.owner, stagedCanonical),
        })
        stagedCanonical = undefined
      }
      for (const candidate of candidates) {
        const runtimeCandidate = candidate as StructuralReferenceCandidate & { setCanonical?: unknown }
        if (typeof runtimeCandidate.setCanonical !== "function") {
          throw new Error(`Правило ${propertyRule.type} распознало ссылку без setter в ${params.filePath}`)
        }
        const indexed = indexedCandidates.find((reference) =>
          reference.canonical === candidate.canonical && sameYamlPath(reference.yamlPath, candidate.yamlPath))
        if (indexed === undefined) {
          throw new Error(`Правило ${propertyRule.type} не материализовало индекс ссылки в ${params.filePath}`)
        }
        references.push({
          ...candidate,
          filePath: params.filePath,
          target: indexed.target,
          constraint: indexed.constraint,
          stageCanonical: (nextCanonical) => {
            candidate.setCanonical(nextCanonical)
            stagedCanonical = nextCanonical
          },
          commitStaged,
          setCanonical: (nextCanonical) => {
            candidate.setCanonical(nextCanonical)
            record[propertyRule.yaml as string] = exportPropertyValueToYAML({
              context: params.context,
              rule: propertyRule,
              value: typedValue,
              owner: ownerForRewrittenCanonical(propertyRule, params.owner, nextCanonical),
            })
          },
        })
      }
    }

    const nested = collectNestedReferences({
      ...params,
      value: yamlValue,
      propertyRule,
      yamlPath: [...params.yamlPath, propertyRule.yaml],
    })
    if (nested === undefined) continue
    if (!nested.ok) return nested
    references.push(...nested.references)
  }
  return { ok: true, references }
}

function dependentStructuralTarget(
  target: DependentStructuralItemReference["target"],
): StructuralYamlReference["target"] {
  return target as StructuralYamlReference["target"]
}

function dependentStructuralConstraint(
  constraint: DependentStructuralItemReference["constraint"],
): StructuralYamlReference["constraint"] {
  return constraint as StructuralYamlReference["constraint"]
}

function collectNestedReferences(params: {
  filePath: string
  parsed: ParsedYaml
  propertyRule: MetadataItemRule["properties"][string]
  value: unknown
  yamlPath: Array<string | number>
  owner?: MetadataTargetOwner
  context: ConfigurationContext
  rootYaml: unknown
  rootRule: MetadataItemRule
}): StructuralYamlReferenceCollectionResult | undefined {
  const descriptor = getTypeRule(params.propertyRule.type, "yamlToXMLNestedRule")
  if (descriptor === undefined || descriptor.kind === "externalFile") return undefined
  if (descriptor.kind === "item") {
    return collectObjectReferences({ ...params, rule: descriptor.itemRule })
  }
  if (descriptor.kind === "polymorphicRecord") {
    const record = asRecord(params.value)
    return record === undefined
      ? { ok: true, references: [] }
      : collectObjectReferences({
          ...params,
          rule: descriptor.resolveItemRule({ yaml: record, name: "" }),
        })
  }
  if (Array.isArray(params.value)) {
    const references: StructuralYamlReference[] = []
    for (let index = 0; index < params.value.length; index += 1) {
      const result = collectObjectReferences({
        ...params,
        value: params.value[index],
        rule: descriptor.resolveItemRule?.({
          yaml: params.value[index],
          name: undefined,
          index,
          propertyRule: params.propertyRule,
        }) ?? descriptor.itemRule,
        yamlPath: [...params.yamlPath, index],
        itemName: undefined,
      })
      if (!result.ok) return result
      references.push(...result.references)
    }
    return { ok: true, references }
  }

  const record = asRecord(params.value)
  if (record === undefined) return { ok: true, references: [] }
  const references: StructuralYamlReference[] = []
  for (const [key, item] of Object.entries(record)) {
    const result = collectObjectReferences({
      ...params,
      value: item,
      rule: descriptor.resolveItemRule?.({
        yaml: item,
        name: key,
        index: references.length,
        propertyRule: params.propertyRule,
      }) ?? descriptor.itemRule,
      yamlPath: [...params.yamlPath, key],
      itemName: key,
    })
    if (!result.ok) return result
    references.push(...result.references)
  }
  return { ok: true, references }
}

function ownerForRewrittenCanonical(
  rule: MetadataItemRule["properties"][string],
  owner: MetadataTargetOwner | undefined,
  canonical: string,
): MetadataTargetOwner | undefined {
  if (owner === undefined || rule.metadataTarget?.kind !== "member" || rule.metadataTarget.owner !== "this") return owner
  const [root, objectName] = canonical.split(".")
  return root === owner.root && objectName ? { root: owner.root, objectName } : owner
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : undefined
}

function sameYamlPath(left: readonly (string | number)[], right: readonly (string | number)[]): boolean {
  return left.length === right.length && left.every((segment, index) => segment === right[index])
}
