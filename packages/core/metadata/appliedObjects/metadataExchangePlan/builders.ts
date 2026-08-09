import { createOwnerAttributeCollectionRuleBuilder } from "../ownerChildRules"
import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../../commonObjects/ruleBuilder"
import { createOwnerTabularSectionCollectionRuleBuilder } from "../ownerChildRules"
import type { PropertyRule as WidePropertyRuleBase } from "../../ruleRuntime/property/types"
import {
  MetadataExchangePlanAttributeRules,
  MetadataExchangePlanTabularSectionRules,
} from "./childRules"

export interface ExchangePlanContentWidePropertyRule extends WidePropertyRuleBase {
  type: "ExchangePlanContent"
}

export type ExchangePlanContentRuleParams = Omit<ExchangePlanContentWidePropertyRule, "type">

export function exchangePlanContentRule<const Params extends ExchangePlanContentRuleParams>(
  params: WideExactRuleParams<ExchangePlanContentRuleParams, Params>
): Readonly<{ type: "ExchangePlanContent" } & Params> {
  return defineWidePropertyRule("ExchangePlanContent", params)
}

export const metadataExchangePlanAttributesRule = createOwnerAttributeCollectionRuleBuilder(
  "MetadataExchangePlanAttributes",
  MetadataExchangePlanAttributeRules
)
export const metadataExchangePlanTabularSectionsRule = createOwnerTabularSectionCollectionRuleBuilder(
  "MetadataExchangePlanTabularSections",
  MetadataExchangePlanTabularSectionRules
)
