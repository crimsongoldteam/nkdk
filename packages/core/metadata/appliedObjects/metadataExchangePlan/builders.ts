import { createOwnerAttributeCollectionRuleBuilder } from "../../commonObjects/metadataAttribute/registerOwnerCollection"
import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../../commonObjects/ruleBuilder"
import { createOwnerTabularSectionCollectionRuleBuilder } from "../../commonObjects/metadataTabularSection/registerOwnerCollection"
import type { PropertyRule as WidePropertyRuleBase } from "../../orchestration/property/types"

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
  "MetadataExchangePlanAttributes"
)
export const metadataExchangePlanTabularSectionsRule = createOwnerTabularSectionCollectionRuleBuilder(
  "MetadataExchangePlanTabularSections"
)
