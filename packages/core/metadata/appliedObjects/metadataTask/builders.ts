import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../../commonObjects/ruleBuilder"
import { namedCollectionTarget } from "../../orchestration/property/operationTargets"
import type { PropertyRule as WidePropertyRuleBase } from "../../orchestration/property/types"

export interface MetadataTaskAddressingAttributesWidePropertyRule extends WidePropertyRuleBase {
  type: "MetadataTaskAddressingAttributes"
}

export type MetadataTaskAddressingAttributesRuleParams = Omit<MetadataTaskAddressingAttributesWidePropertyRule, "type">

export function metadataTaskAddressingAttributesRule<const Params extends MetadataTaskAddressingAttributesRuleParams>(
  params: WideExactRuleParams<MetadataTaskAddressingAttributesRuleParams, Params>
): Readonly<{ type: "MetadataTaskAddressingAttributes"; ownerFactRole: "addressingAttributes" } & Params> {
  return defineWidePropertyRule("MetadataTaskAddressingAttributes", {
    ownerFactRole: "addressingAttributes",
    ...params,
    operationTarget: namedCollectionTarget({
      kind: "addressingAttribute",
      migrationSegment: "РеквизитАдресации",
      requiresMigration: true,
    }),
  })
}
export interface MetadataTaskTabularSectionsWidePropertyRule extends WidePropertyRuleBase {
  type: "MetadataTaskTabularSections"
}

export type MetadataTaskTabularSectionsRuleParams = Omit<MetadataTaskTabularSectionsWidePropertyRule, "type">

export function metadataTaskTabularSectionsRule<const Params extends MetadataTaskTabularSectionsRuleParams>(
  params: WideExactRuleParams<MetadataTaskTabularSectionsRuleParams, Params>
): Readonly<{ type: "MetadataTaskTabularSections"; ownerFactRole: "tabularSections" } & Params> {
  return defineWidePropertyRule("MetadataTaskTabularSections", {
    ownerFactRole: "tabularSections",
    ...params,
    operationTarget: namedCollectionTarget({
      kind: "tabularSection",
      migrationSegment: "ТабличнаяЧасть",
      requiresMigration: true,
    }),
  })
}
