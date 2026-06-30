import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { MetadataReportRules } from "./rules"

export type MetadataReport = MetadataTypeByRule<typeof MetadataReportRules>
export type MetadataReportYAML = YAMLTypeByRule<typeof MetadataReportRules>

registerMetadataItemRule({
  propertyType: "MetadataReport",
  itemRule: MetadataReportRules,
})

export interface MetadataReportAttributesWidePropertyRule extends WidePropertyRuleBase {
  type: "MetadataReportAttributes"
}

export type MetadataReportAttributesRuleParams = Omit<MetadataReportAttributesWidePropertyRule, "type">

export function metadataReportAttributesRule<const Params extends MetadataReportAttributesRuleParams>(
  params: WideExactRuleParams<MetadataReportAttributesRuleParams, Params>
): Readonly<{ type: "MetadataReportAttributes" } & Params> {
  return defineWidePropertyRule("MetadataReportAttributes", params)
}
export interface MetadataReportTabularSectionsWidePropertyRule extends WidePropertyRuleBase {
  type: "MetadataReportTabularSections"
}

export type MetadataReportTabularSectionsRuleParams = Omit<MetadataReportTabularSectionsWidePropertyRule, "type">

export function metadataReportTabularSectionsRule<const Params extends MetadataReportTabularSectionsRuleParams>(
  params: WideExactRuleParams<MetadataReportTabularSectionsRuleParams, Params>
): Readonly<{ type: "MetadataReportTabularSections" } & Params> {
  return defineWidePropertyRule("MetadataReportTabularSections", params)
}
