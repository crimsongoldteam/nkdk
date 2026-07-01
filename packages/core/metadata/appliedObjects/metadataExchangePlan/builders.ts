import { definePropertyRule as defineWidePropertyRule, type ExactRuleParams as WideExactRuleParams } from "~/metadata/commonObjects/ruleBuilder"
import { namedCollectionTarget } from "~/metadata/orchestration/property/operationTargets"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"

export interface ExchangePlanContentWidePropertyRule extends WidePropertyRuleBase {
  type: "ExchangePlanContent"
}

export type ExchangePlanContentRuleParams = Omit<ExchangePlanContentWidePropertyRule, "type">

export function exchangePlanContentRule<const Params extends ExchangePlanContentRuleParams>(
  params: WideExactRuleParams<ExchangePlanContentRuleParams, Params>
): Readonly<{ type: "ExchangePlanContent" } & Params> {
  return defineWidePropertyRule("ExchangePlanContent", params)
}
export interface MetadataExchangePlanTabularSectionsWidePropertyRule extends WidePropertyRuleBase {
  type: "MetadataExchangePlanTabularSections"
}

export type MetadataExchangePlanTabularSectionsRuleParams = Omit<
  MetadataExchangePlanTabularSectionsWidePropertyRule,
  "type"
>

export function metadataExchangePlanTabularSectionsRule<
  const Params extends MetadataExchangePlanTabularSectionsRuleParams,
>(
  params: WideExactRuleParams<MetadataExchangePlanTabularSectionsRuleParams, Params>
): Readonly<{ type: "MetadataExchangePlanTabularSections" } & Params> {
  return defineWidePropertyRule("MetadataExchangePlanTabularSections", {
    ...params,
    operationTarget: namedCollectionTarget({
      kind: "tabularSection",
      migrationSegment: "ТабличнаяЧасть",
      requiresMigration: true,
    }),
  })
}
