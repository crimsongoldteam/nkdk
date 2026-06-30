import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { MetadataChartOfCalculationTypesRules } from "./rules"

export type MetadataChartOfCalculationTypes = MetadataTypeByRule<typeof MetadataChartOfCalculationTypesRules>
export type MetadataChartOfCalculationTypesYAML = YAMLTypeByRule<typeof MetadataChartOfCalculationTypesRules>

registerMetadataItemRule({
  propertyType: "MetadataChartOfCalculationTypes",
  itemRule: MetadataChartOfCalculationTypesRules,
})

export interface MetadataChartOfCalculationTypesTabularSectionsWidePropertyRule extends WidePropertyRuleBase {
  type: "MetadataChartOfCalculationTypesTabularSections"
}

export type MetadataChartOfCalculationTypesTabularSectionsRuleParams = Omit<
  MetadataChartOfCalculationTypesTabularSectionsWidePropertyRule,
  "type"
>

export function metadataChartOfCalculationTypesTabularSectionsRule<
  const Params extends MetadataChartOfCalculationTypesTabularSectionsRuleParams,
>(
  params: WideExactRuleParams<MetadataChartOfCalculationTypesTabularSectionsRuleParams, Params>
): Readonly<{ type: "MetadataChartOfCalculationTypesTabularSections" } & Params> {
  return defineWidePropertyRule("MetadataChartOfCalculationTypesTabularSections", params)
}
