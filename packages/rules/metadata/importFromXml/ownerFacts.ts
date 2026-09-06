import { buildObjectFieldIndex } from "../validation/dataPath/objectFields"
import type { ValidationOwnerFacts } from "../validation/dataPath/ownerFacts"
import { getDataPathOwnerKindByItemType } from "../validation/dataPath/registry"
import type { OwnerTypeRef } from "../validation/dataPath/types"
import type { DirectImportFactsSink, LocalIndexes, MetadataItemRule, OwnerFactRole } from "@nkdk/runtime/rule-kit"
import type { ParsedMetadataTarget } from "@nkdk/runtime/rule-kit"
import { validationOwnerRef } from "../validation/dataPath/validationOwnerRef"
import { ownerFactFromYAML } from "../validation/dataPath/ownerFacts"
import { selectImportPropertyValues } from "./selectedPropertyFacts"

type ImportPropertyFact = Parameters<DirectImportFactsSink["acceptProperty"]>[0]

export interface ImportOwnerFactsSource {
  readonly rule: MetadataItemRule
  readonly assignment: { readonly itemName: string }
  readonly targetProjectPath: string
  readonly localIndexes: LocalIndexes
  readonly semanticFacts?: readonly ImportPropertyFact[]
}

export function extractImportOwnerFacts(
  prepared: ImportOwnerFactsSource,
  objectTarget?: ParsedMetadataTarget,
  rawYaml?: unknown,
): ValidationOwnerFacts[] {
  const ownerKind = getDataPathOwnerKindByItemType(prepared.rule.itemType)
  if (ownerKind === undefined) return []

  const ref: OwnerTypeRef = validationOwnerRef({
    fallback: {
      kind: ownerKind.kind,
      ...(prepared.assignment.itemName.length === 0 ? {} : { name: prepared.assignment.itemName }),
    },
    itemType: prepared.rule.itemType,
    ...(objectTarget === undefined ? {} : { objectTarget }),
  })
  const preliminaryFacts = {
    ref,
    filePath: prepared.targetProjectPath,
    fieldIndex: { fields: new Map(), standardAttributeAliases: new Map(), diagnostics: [] },
    ...(prepared.localIndexes.metadata.ownerFacts ?? {}),
    ...(prepared.semanticFacts === undefined
      ? ownerFactsFromYaml(prepared.rule, rawYaml)
      : ownerFactsFromProperties(prepared.rule, prepared.semanticFacts)),
  } as ValidationOwnerFacts
  const fieldIndex = buildObjectFieldIndex({ ref, facts: preliminaryFacts, rule: prepared.rule })

  return [{ ...preliminaryFacts, fieldIndex }]
}

function ownerFactsFromProperties(rule: MetadataItemRule, facts: readonly ImportPropertyFact[]): Record<string, unknown> {
  const selected = new Map<string, OwnerFactRole>()
  for (const property of Object.values(rule.properties)) {
    if (property.ownerFactRole === undefined || typeof property.yaml !== "string") continue
    selected.set(property.yaml, property.ownerFactRole)
  }
  const values = selectImportPropertyValues(facts, selected.keys())
  const result: Record<string, unknown> = {}
  for (const [key, role] of selected) {
    const normalized = ownerFactFromYAML(role, values.get(key))
    if (normalized !== undefined) result[role] = normalized
  }
  return result
}

function ownerFactsFromYaml(rule: MetadataItemRule, yaml: unknown): Record<string, unknown> {
  if (yaml === null || typeof yaml !== "object" || Array.isArray(yaml)) return {}
  const record = yaml as Record<string, unknown>
  const facts: Record<string, unknown> = {}
  for (const property of Object.values(rule.properties)) {
    if (property.ownerFactRole === undefined || typeof property.yaml !== "string") continue
    const value = ownerFactFromYAML(property.ownerFactRole, record[property.yaml])
    if (value !== undefined) facts[property.ownerFactRole] = value
  }
  return facts
}
