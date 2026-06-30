import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { MetadataChartOfCharacteristicTypesRules } from "./rules"

export type MetadataChartOfCharacteristicTypes = MetadataTypeByRule<typeof MetadataChartOfCharacteristicTypesRules>
export type MetadataChartOfCharacteristicTypesYAML = YAMLTypeByRule<typeof MetadataChartOfCharacteristicTypesRules>

registerMetadataItemRule({
  propertyType: "MetadataChartOfCharacteristicTypes",
  itemRule: MetadataChartOfCharacteristicTypesRules,
})

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
