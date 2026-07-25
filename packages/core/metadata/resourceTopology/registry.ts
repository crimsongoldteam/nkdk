import type { PropertyRule } from "../orchestration/property/types"
import { getTypeRule } from "../orchestration/property/typeRuleRegistry"
import type { MetadataResourceDeclaration } from "./types"

export function describePropertyResourceTopology(
  propertyName: string,
  propertyRule: PropertyRule
): readonly MetadataResourceDeclaration[] {
  const declarations = getTypeRule(propertyRule.type, "resourceTopology")?.({ propertyRule }) ?? []
  return declarations.map((declaration) => ({
    ...declaration,
    source: {
      kind: "property",
      description: `${propertyName}:${propertyRule.type}`,
    },
  }))
}
