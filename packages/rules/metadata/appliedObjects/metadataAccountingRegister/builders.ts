import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../../commonObjects/ruleBuilder"
import { namedCollectionTarget } from "@nkdk/runtime/rule-kit"
import type { PropertyRule as WidePropertyRuleBase } from "@nkdk/runtime/rule-kit"
import {
  createOwnerAttributeCollectionRuleBuilder,
  createOwnerRegisterFieldCollectionRuleBuilder,
} from "../ownerChildRules"
import {
  MetadataAccountingRegisterAttributeRules,
  MetadataAccountingRegisterDimensionRules,
  MetadataAccountingRegisterResourceRules,
} from "./childRules"
import {
  MetadataAccumulationRegisterAttributeRules,
  MetadataAccumulationRegisterDimensionRules,
  MetadataAccumulationRegisterResourceRules,
} from "../metadataAccumulationRegister/childRules"
import {
  MetadataCalculationRegisterAttributeRules,
  MetadataCalculationRegisterDimensionRules,
  MetadataCalculationRegisterResourceRules,
} from "../metadataCalculationRegister/childRules"
import {
  MetadataInformationRegisterAttributeRules,
  MetadataInformationRegisterDimensionRules,
  MetadataInformationRegisterResourceRules,
} from "../metadataInformationRegister/childRules"

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
export const metadataInformationRegisterAttributesRule = createOwnerAttributeCollectionRuleBuilder(
  "MetadataInformationRegisterAttributes",
  MetadataInformationRegisterAttributeRules
)
export const metadataAccumulationRegisterAttributesRule = createOwnerAttributeCollectionRuleBuilder(
  "MetadataAccumulationRegisterAttributes",
  MetadataAccumulationRegisterAttributeRules
)
export const metadataAccountingRegisterAttributesRule = createOwnerAttributeCollectionRuleBuilder(
  "MetadataAccountingRegisterAttributes",
  MetadataAccountingRegisterAttributeRules
)
export const metadataCalculationRegisterAttributesRule = createOwnerAttributeCollectionRuleBuilder(
  "MetadataCalculationRegisterAttributes",
  MetadataCalculationRegisterAttributeRules
)
export const metadataInformationRegisterDimensionsRule = createOwnerRegisterFieldCollectionRuleBuilder(
  "MetadataInformationRegisterDimensions",
  "dimensions",
  MetadataInformationRegisterDimensionRules
)
export const metadataAccumulationRegisterDimensionsRule = createOwnerRegisterFieldCollectionRuleBuilder(
  "MetadataAccumulationRegisterDimensions",
  "dimensions",
  MetadataAccumulationRegisterDimensionRules
)
export const metadataAccountingRegisterDimensionsRule = createOwnerRegisterFieldCollectionRuleBuilder(
  "MetadataAccountingRegisterDimensions",
  "dimensions",
  MetadataAccountingRegisterDimensionRules
)
export const metadataCalculationRegisterDimensionsRule = createOwnerRegisterFieldCollectionRuleBuilder(
  "MetadataCalculationRegisterDimensions",
  "dimensions",
  MetadataCalculationRegisterDimensionRules
)
export const metadataInformationRegisterResourcesRule = createOwnerRegisterFieldCollectionRuleBuilder(
  "MetadataInformationRegisterResources",
  "resources",
  MetadataInformationRegisterResourceRules
)
export const metadataAccumulationRegisterResourcesRule = createOwnerRegisterFieldCollectionRuleBuilder(
  "MetadataAccumulationRegisterResources",
  "resources",
  MetadataAccumulationRegisterResourceRules
)
export const metadataAccountingRegisterResourcesRule = createOwnerRegisterFieldCollectionRuleBuilder(
  "MetadataAccountingRegisterResources",
  "resources",
  MetadataAccountingRegisterResourceRules
)
export const metadataCalculationRegisterResourcesRule = createOwnerRegisterFieldCollectionRuleBuilder(
  "MetadataCalculationRegisterResources",
  "resources",
  MetadataCalculationRegisterResourceRules
)
