import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../../commonObjects/ruleBuilder"
import { namedCollectionTarget } from "../../orchestration/property/operationTargets"
import type { PropertyRule as WidePropertyRuleBase } from "../../orchestration/property/types"

export interface MetadataAttributesWidePropertyRule extends WidePropertyRuleBase {
  type: "MetadataAttributes"
}

export type MetadataAttributesRuleParams = Omit<MetadataAttributesWidePropertyRule, "type">

export function metadataAttributesRule<const Params extends MetadataAttributesRuleParams>(
  params: WideExactRuleParams<MetadataAttributesRuleParams, Params>
): Readonly<{ type: "MetadataAttributes"; ownerFactRole: "attributes" } & Params> {
  return defineWidePropertyRule("MetadataAttributes", {
    ownerFactRole: "attributes",
    ...params,
    operationTarget: namedCollectionTarget({
      kind: "attribute",
      migrationSegment: "Реквизит",
      requiresMigration: true,
    }),
  })
}

export interface MetadataAttributesWithAllowedTypesWidePropertyRule extends WidePropertyRuleBase {
  type: "MetadataAttributesWithAllowedTypes"
}

export type MetadataAttributesWithAllowedTypesRuleParams = Omit<
  MetadataAttributesWithAllowedTypesWidePropertyRule,
  "type"
>

export function metadataAttributesWithAllowedTypesRule<
  const Params extends MetadataAttributesWithAllowedTypesRuleParams,
>(
  params: WideExactRuleParams<MetadataAttributesWithAllowedTypesRuleParams, Params>
): Readonly<{ type: "MetadataAttributesWithAllowedTypes"; ownerFactRole: "attributes" } & Params> {
  return defineWidePropertyRule("MetadataAttributesWithAllowedTypes", {
    ownerFactRole: "attributes",
    ...params,
    operationTarget: namedCollectionTarget({
      kind: "attribute",
      migrationSegment: "Реквизит",
      requiresMigration: true,
    }),
  })
}
export interface MetadataDataProcessorTabularSectionsWidePropertyRule extends WidePropertyRuleBase {
  type: "MetadataDataProcessorTabularSections"
}

export type MetadataDataProcessorTabularSectionsRuleParams = Omit<
  MetadataDataProcessorTabularSectionsWidePropertyRule,
  "type"
>

export function metadataDataProcessorTabularSectionsRule<
  const Params extends MetadataDataProcessorTabularSectionsRuleParams,
>(
  params: WideExactRuleParams<MetadataDataProcessorTabularSectionsRuleParams, Params>
): Readonly<{ type: "MetadataDataProcessorTabularSections"; ownerFactRole: "tabularSections" } & Params> {
  return defineWidePropertyRule("MetadataDataProcessorTabularSections", {
    ownerFactRole: "tabularSections",
    ...params,
    operationTarget: namedCollectionTarget({
      kind: "tabularSection",
      migrationSegment: "ТабличнаяЧасть",
      requiresMigration: true,
    }),
  })
}
