import { buildObjectFieldIndex } from "../validation/dataPath/objectFields"
import type { ValidationOwnerFacts } from "../validation/dataPath/ownerFacts"
import { getDataPathOwnerKindByItemType } from "../validation/dataPath/registry"
import type { OwnerTypeRef } from "../validation/dataPath/types"
import type { LocalIndexes, MetadataItemRule } from "@nkdk/runtime/rule-kit"

export interface ImportOwnerFactsSource {
  readonly rule: MetadataItemRule
  readonly assignment: { readonly itemName: string }
  readonly targetProjectPath: string
  readonly localIndexes: LocalIndexes
}

export function extractImportOwnerFacts(prepared: ImportOwnerFactsSource): ValidationOwnerFacts[] {
  const ownerKind = getDataPathOwnerKindByItemType(prepared.rule.itemType)
  if (ownerKind === undefined) return []

  const ref: OwnerTypeRef = {
    kind: ownerKind.kind,
    ...(prepared.assignment.itemName.length === 0 ? {} : { name: prepared.assignment.itemName }),
  }
  const preliminaryFacts = {
    ref,
    filePath: prepared.targetProjectPath,
    fieldIndex: { fields: new Map(), standardAttributeAliases: new Map(), diagnostics: [] },
    ...(prepared.localIndexes.metadata.ownerFacts ?? {}),
  } as ValidationOwnerFacts
  const fieldIndex = buildObjectFieldIndex({ ref, facts: preliminaryFacts, rule: prepared.rule })

  return [{ ...preliminaryFacts, fieldIndex }]
}
