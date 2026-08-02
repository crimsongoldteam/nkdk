import { registerMetadataItemCollectionRule } from "../../orchestration/metadataCollection/ruleFactory"
import { namedCollectionTarget } from "../../orchestration/property/operationTargets"
import type { MetadataItemRule, PropertyRule } from "../../orchestration/property/types"
import { definePropertyRule, type ExactRuleParams } from "../ruleBuilder"

export function registerOwnerAttributeCollection(params: {
  propertyType: string
  schemaName: string
  itemRule: MetadataItemRule
}): void {
  registerMetadataItemCollectionRule({
    ...params,
    xmlElement: "Attribute",
    keyField: "name",
    collectionItemRule: true,
  })
}

interface OwnerAttributeCollectionWidePropertyRule extends PropertyRule {
  type: string
}

type OwnerAttributeCollectionRuleParams = Omit<OwnerAttributeCollectionWidePropertyRule, "type">

export function createOwnerAttributeCollectionRuleBuilder<const PropertyType extends string>(
  propertyType: PropertyType
) {
  return <Params extends OwnerAttributeCollectionRuleParams>(
    params: ExactRuleParams<OwnerAttributeCollectionRuleParams, Params>
  ) =>
    definePropertyRule(propertyType, {
      ownerFactRole: "attributes" as const,
      ...params,
      operationTarget: namedCollectionTarget({
        kind: "attribute",
        migrationSegment: "Реквизит",
        requiresMigration: true,
      }),
    })
}
