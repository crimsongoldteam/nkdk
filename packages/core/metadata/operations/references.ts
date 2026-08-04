import type { MetadataTargetOwner } from "../commonObjects/metadataTargets"
import type { ConfigurationContext } from "../context/types"
import {
  collectStructuralYamlReferences,
  type StructuralYamlReference,
} from "../validation/structuralReferences"
import type { ParsedYaml } from "../../yaml/parseMetadataYaml"
import type { OperationSnapshotItem } from "./projectSnapshot"
import type { MetadataOperationBlockedReference, MetadataOperationReferenceChange } from "./types"
import { defaultMetadataOperationsContext } from "./context"

export type StructuralReferenceInput = Pick<
  StructuralYamlReference,
  "filePath" | "yamlPath" | "canonical" | "setCanonical"
>

export type WritableStructuralReferenceInput = StructuralReferenceInput & Pick<
  StructuralYamlReference,
  "stageCanonical" | "commitStaged"
>

export type StructuralReferenceCollectionResult =
  | { ok: true; references: WritableStructuralReferenceInput[] }
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
  const collected = collectStructuralYamlReferences({
    filePath: params.item.filePath,
    parsed: params.parsed,
    rule: params.item.rule,
    yaml: params.item.yaml,
    owner: params.owner,
    context: params.context ?? defaultMetadataOperationsContext(),
  })
  return collected.ok
    ? collected
    : { ok: false, code: "rule_contract_violation", message: collected.message }
}

function canonicalMatchesPrefix(value: string, prefix: string): boolean {
  return value === prefix || value.startsWith(`${prefix}.`)
}
