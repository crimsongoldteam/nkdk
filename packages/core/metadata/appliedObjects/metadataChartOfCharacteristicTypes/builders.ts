import { definePropertyRule as defineWidePropertyRule, type ExactRuleParams as WideExactRuleParams } from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"

export interface MetadataChartOfCharacteristicTypesTabularSectionsWidePropertyRule extends WidePropertyRuleBase {
  type: "MetadataChartOfCharacteristicTypesTabularSections"
}

export type MetadataChartOfCharacteristicTypesTabularSectionsRuleParams = Omit<
  MetadataChartOfCharacteristicTypesTabularSectionsWidePropertyRule,
  "type"
>

export function metadataChartOfCharacteristicTypesTabularSectionsRule<
  const Params extends MetadataChartOfCharacteristicTypesTabularSectionsRuleParams,
>(
  params: WideExactRuleParams<MetadataChartOfCharacteristicTypesTabularSectionsRuleParams, Params>
): Readonly<{ type: "MetadataChartOfCharacteristicTypesTabularSections" } & Params> {
  return defineWidePropertyRule("MetadataChartOfCharacteristicTypesTabularSections", params)
}
