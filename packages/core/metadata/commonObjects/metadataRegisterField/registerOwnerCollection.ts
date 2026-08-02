import { registerMetadataItemCollectionRule } from "../../orchestration/metadataCollection/ruleFactory"
import { namedCollectionTarget } from "../../orchestration/property/operationTargets"
import type { MetadataItemRule, PropertyRule } from "../../orchestration/property/types"
import { definePropertyRule, type ExactRuleParams } from "../ruleBuilder"

export function registerOwnerRegisterFieldCollection(params: {
  propertyType: string
  schemaName: string
  itemRule: MetadataItemRule
  xmlElement: "Dimension" | "Resource"
}): void {
  registerMetadataItemCollectionRule({
    ...params,
    keyField: "name",
    collectionItemRule: true,
  })
}

interface OwnerRegisterFieldCollectionWidePropertyRule extends PropertyRule {
  type: string
}

type OwnerRegisterFieldCollectionRuleParams = Omit<
  OwnerRegisterFieldCollectionWidePropertyRule,
  "type"
>

export function createOwnerRegisterFieldCollectionRuleBuilder<
  const PropertyType extends string,
  const Role extends "dimensions" | "resources",
>(propertyType: PropertyType, role: Role) {
  const target =
    role === "dimensions"
      ? { kind: "dimension" as const, migrationSegment: "Измерение" as const }
      : { kind: "resource" as const, migrationSegment: "Ресурс" as const }

  return <Params extends OwnerRegisterFieldCollectionRuleParams>(
    params: ExactRuleParams<OwnerRegisterFieldCollectionRuleParams, Params>
  ) =>
    definePropertyRule(propertyType, {
      ownerFactRole: role,
      ...params,
      operationTarget: namedCollectionTarget({ ...target, requiresMigration: true }),
    })
}
