import type { PropertyOperationTargetDeclaration } from "../orchestration/property/operationTargets"
import type { MetadataItemRule } from "../orchestration/property/types"

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
