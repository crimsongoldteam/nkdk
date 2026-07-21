import { buildObjectFieldIndex } from "../validation/dataPath/objectFields"
import { createValidationOwnerFacts, type ValidationOwnerFacts } from "../validation/dataPath/ownerFacts"
import { getDataPathOwnerKindByItemType } from "../validation/dataPath/registry"
import type { OwnerTypeRef } from "../validation/dataPath/types"
import type { PreparedImportModel } from "./prepareModel"

export function extractImportOwnerFacts(prepared: PreparedImportModel): ValidationOwnerFacts[] {
  const ownerKind = getDataPathOwnerKindByItemType(prepared.rule.itemType)
  if (ownerKind === undefined) return []

  const ref: OwnerTypeRef = {
    kind: ownerKind.kind,
    ...(prepared.assignment.itemName.length === 0 ? {} : { name: prepared.assignment.itemName }),
  }
  const preliminaryFacts = createValidationOwnerFacts({
    ref,
    filePath: prepared.targetProjectPath,
    fieldIndex: { fields: new Map(), standardAttributeAliases: new Map(), diagnostics: [] },
    model: prepared.model,
  })
  const fieldIndex = buildObjectFieldIndex({ ref, facts: preliminaryFacts, rule: prepared.rule })

  return [
    createValidationOwnerFacts({
      ref,
      filePath: prepared.targetProjectPath,
      fieldIndex,
      model: prepared.model,
    }),
  ]
}
