import { definePropertyRule as defineWidePropertyRule, type ExactRuleParams as WideExactRuleParams } from "~/metadata/commonObjects/ruleBuilder"
import { namedCollectionTarget } from "~/metadata/orchestration/property/operationTargets"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"

export interface MetadataCommandsWidePropertyRule extends WidePropertyRuleBase {
  type: "MetadataCommands"
}

export type MetadataCommandsRuleParams = Omit<MetadataCommandsWidePropertyRule, "type">

export function metadataCommandsRule<const Params extends MetadataCommandsRuleParams>(
  params: WideExactRuleParams<MetadataCommandsRuleParams, Params>
): Readonly<{ type: "MetadataCommands" } & Params> {
  return defineWidePropertyRule("MetadataCommands", {
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
): Readonly<{ type: "MetadataRegisterDimensions" } & Params> {
  return defineWidePropertyRule("MetadataRegisterDimensions", {
    ...params,
    operationTarget: namedCollectionTarget({ kind: "dimension", migrationSegment: "Измерение", requiresMigration: true }),
  })
}
export interface MetadataRegisterAttributesWidePropertyRule extends WidePropertyRuleBase {
  type: "MetadataRegisterAttributes"
}

export type MetadataRegisterAttributesRuleParams = Omit<MetadataRegisterAttributesWidePropertyRule, "type">

export function metadataRegisterAttributesRule<const Params extends MetadataRegisterAttributesRuleParams>(
  params: WideExactRuleParams<MetadataRegisterAttributesRuleParams, Params>
): Readonly<{ type: "MetadataRegisterAttributes" } & Params> {
  return defineWidePropertyRule("MetadataRegisterAttributes", {
    ...params,
    operationTarget: namedCollectionTarget({ kind: "attribute", migrationSegment: "Реквизит", requiresMigration: true }),
  })
}
export interface MetadataRegisterResourcesWidePropertyRule extends WidePropertyRuleBase {
  type: "MetadataRegisterResources"
}

export type MetadataRegisterResourcesRuleParams = Omit<MetadataRegisterResourcesWidePropertyRule, "type">

export function metadataRegisterResourcesRule<const Params extends MetadataRegisterResourcesRuleParams>(
  params: WideExactRuleParams<MetadataRegisterResourcesRuleParams, Params>
): Readonly<{ type: "MetadataRegisterResources" } & Params> {
  return defineWidePropertyRule("MetadataRegisterResources", {
    ...params,
    operationTarget: namedCollectionTarget({ kind: "resource", migrationSegment: "Ресурс", requiresMigration: true }),
  })
}
