import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../../commonObjects/ruleBuilder"
import { namedCollectionTarget } from "../../orchestration/property/operationTargets"
import type { PropertyRule as WidePropertyRuleBase } from "../../orchestration/property/types"
import { createOwnerAttributeCollectionRuleBuilder } from "../../commonObjects/metadataAttribute/registerOwnerCollection"
import { createOwnerRegisterFieldCollectionRuleBuilder } from "../../commonObjects/metadataRegisterField/registerOwnerCollection"

export interface MetadataCommandsWidePropertyRule extends WidePropertyRuleBase {
  type: "MetadataCommands"
}

export type MetadataCommandsRuleParams = Omit<MetadataCommandsWidePropertyRule, "type">

export function metadataCommandsRule<const Params extends MetadataCommandsRuleParams>(
  params: WideExactRuleParams<MetadataCommandsRuleParams, Params>
): Readonly<{ type: "MetadataCommands"; ownerFactRole: "commands" } & Params> {
  return defineWidePropertyRule("MetadataCommands", {
    ownerFactRole: "commands",
    ...params,
    operationTarget: namedCollectionTarget({ kind: "command", migrationSegment: "Команда", requiresMigration: false }),
  })
}
export interface AdditionalIndexWidePropertyRule extends WidePropertyRuleBase {
  type: "AdditionalIndex"
}

export type AdditionalIndexRuleParams = Omit<AdditionalIndexWidePropertyRule, "type">

export function additionalIndexRule<const Params extends AdditionalIndexRuleParams>(
  params: WideExactRuleParams<AdditionalIndexRuleParams, Params>
): Readonly<{ type: "AdditionalIndex" } & Params> {
  return defineWidePropertyRule("AdditionalIndex", params)
}
export interface MetadataRegisterDimensionsWidePropertyRule extends WidePropertyRuleBase {
  type: "MetadataRegisterDimensions"
}

export type MetadataRegisterDimensionsRuleParams = Omit<MetadataRegisterDimensionsWidePropertyRule, "type">

export function metadataRegisterDimensionsRule<const Params extends MetadataRegisterDimensionsRuleParams>(
  params: WideExactRuleParams<MetadataRegisterDimensionsRuleParams, Params>
): Readonly<{ type: "MetadataRegisterDimensions"; ownerFactRole: "dimensions" } & Params> {
  return defineWidePropertyRule("MetadataRegisterDimensions", {
    ownerFactRole: "dimensions",
    ...params,
    operationTarget: namedCollectionTarget({
      kind: "dimension",
      migrationSegment: "Измерение",
      requiresMigration: true,
    }),
  })
}
export const metadataInformationRegisterAttributesRule = createOwnerAttributeCollectionRuleBuilder(
  "MetadataInformationRegisterAttributes"
)
export const metadataAccumulationRegisterAttributesRule = createOwnerAttributeCollectionRuleBuilder(
  "MetadataAccumulationRegisterAttributes"
)
export const metadataAccountingRegisterAttributesRule = createOwnerAttributeCollectionRuleBuilder(
  "MetadataAccountingRegisterAttributes"
)
export const metadataCalculationRegisterAttributesRule = createOwnerAttributeCollectionRuleBuilder(
  "MetadataCalculationRegisterAttributes"
)
export const metadataInformationRegisterDimensionsRule = createOwnerRegisterFieldCollectionRuleBuilder(
  "MetadataInformationRegisterDimensions",
  "dimensions"
)
export const metadataAccumulationRegisterDimensionsRule = createOwnerRegisterFieldCollectionRuleBuilder(
  "MetadataAccumulationRegisterDimensions",
  "dimensions"
)
export const metadataAccountingRegisterDimensionsRule = createOwnerRegisterFieldCollectionRuleBuilder(
  "MetadataAccountingRegisterDimensions",
  "dimensions"
)
export const metadataCalculationRegisterDimensionsRule = createOwnerRegisterFieldCollectionRuleBuilder(
  "MetadataCalculationRegisterDimensions",
  "dimensions"
)
export interface MetadataRegisterResourcesWidePropertyRule extends WidePropertyRuleBase {
  type: "MetadataRegisterResources"
}

export type MetadataRegisterResourcesRuleParams = Omit<MetadataRegisterResourcesWidePropertyRule, "type">

export function metadataRegisterResourcesRule<const Params extends MetadataRegisterResourcesRuleParams>(
  params: WideExactRuleParams<MetadataRegisterResourcesRuleParams, Params>
): Readonly<{ type: "MetadataRegisterResources"; ownerFactRole: "resources" } & Params> {
  return defineWidePropertyRule("MetadataRegisterResources", {
    ownerFactRole: "resources",
    ...params,
    operationTarget: namedCollectionTarget({ kind: "resource", migrationSegment: "Ресурс", requiresMigration: true }),
  })
}
