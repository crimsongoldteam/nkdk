import type { PropertyOperationTargetDeclaration } from "@nkdk/runtime/rule-kit"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"

export interface MetadataRuleOperationTargetDescriptor {
  propertyName: string
  propertyYaml?: string
  declaration: PropertyOperationTargetDeclaration
}

export function describeMetadataRuleOperationTargets(rule: MetadataItemRule): MetadataRuleOperationTargetDescriptor[] {
  return Object.entries(rule.properties).flatMap(([propertyName, propertyRule]) => {
    const declaration = propertyRule.operationTarget
    if (declaration === undefined) return []
    return [
      {
        propertyName,
        propertyYaml: typeof propertyRule.yaml === "string" ? propertyRule.yaml : undefined,
        declaration,
      },
    ]
  })
}
