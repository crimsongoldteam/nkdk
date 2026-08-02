import { registerMetadataItemCollectionRule } from "../../orchestration/metadataCollection/ruleFactory"
import { namedCollectionTarget } from "../../orchestration/property/operationTargets"
import type { MetadataItemRule, PropertyRule } from "../../orchestration/property/types"
import { definePropertyRule, type ExactRuleParams } from "../ruleBuilder"

export function registerOwnerTabularSectionCollection(params: {
  propertyType: string
  schemaName: string
  itemRule: MetadataItemRule
}): void {
  registerMetadataItemCollectionRule({
    ...params,
    xmlElement: "TabularSection",
    keyField: "name",
    collectionItemRule: true,
  })
}

type OwnerTabularSectionCollectionRuleParams = Omit<PropertyRule, "type">

export function createOwnerTabularSectionCollectionRuleBuilder<const PropertyType extends string>(
  propertyType: PropertyType
) {
  return <const Params extends OwnerTabularSectionCollectionRuleParams>(
    params: ExactRuleParams<OwnerTabularSectionCollectionRuleParams, Params>
  ) =>
    definePropertyRule(propertyType, {
      ownerFactRole: "tabularSections" as const,
      ...params,
      operationTarget: namedCollectionTarget({
        kind: "tabularSection",
        migrationSegment: "ТабличнаяЧасть",
        requiresMigration: true,
      }),
    })
}
