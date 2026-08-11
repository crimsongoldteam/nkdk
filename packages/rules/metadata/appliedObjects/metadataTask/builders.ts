import {
  createOwnerAttributeCollectionRuleBuilder,
  createOwnerTabularSectionCollectionRuleBuilder,
} from "../ownerChildRules"
import { MetadataTaskAttributeRules, MetadataTaskTabularSectionRules } from "./childRules"
import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../../commonObjects/ruleBuilder"
import { namedCollectionTarget } from "@nkdk/runtime/rule-kit"
import type { PropertyRule as WidePropertyRuleBase } from "@nkdk/runtime/rule-kit"

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

export const metadataTaskAttributesRule = createOwnerAttributeCollectionRuleBuilder(
  "MetadataTaskAttributes",
  MetadataTaskAttributeRules
)
export const metadataTaskTabularSectionsRule = createOwnerTabularSectionCollectionRuleBuilder(
  "MetadataTaskTabularSections",
  MetadataTaskTabularSectionRules
)
