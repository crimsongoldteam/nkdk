import type { DirectImportPropertyFact } from "@nkdk/runtime/rule-kit"

export type { DirectImportPropertyFact } from "@nkdk/runtime/rule-kit"

export function propertyFactsWithReconstructionValues(
  facts: readonly DirectImportPropertyFact[],
): readonly DirectImportPropertyFact[] {
  return facts.map(fact => Object.hasOwn(fact, "reconstructionValue")
    ? { ...fact, value: fact.reconstructionValue }
    : fact)
}
