import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
import { I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import {
  MetadataHTTPServiceURLTemplates,
  MetadataHTTPServiceURLTemplatesXML,
  MetadataHTTPServiceURLTemplatesYAML,
} from "~/metadata/commonObjects/metadataHTTPServiceURLTemplate/types"
import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import * as SE from "~/metadata/systemEnumerations/types"
import { MetadataHTTPServiceRules } from "./rules"

export type MetadataHTTPService = MetadataTypeByRule<typeof MetadataHTTPServiceRules>
export type MetadataHTTPServiceYAML = YAMLTypeByRule<typeof MetadataHTTPServiceRules>

export interface MetadataHTTPServiceXML {
  _uuid?: string
  Properties: {
    Comment?: string
    ExtendedConfigurationObject?: string
    Name: string
    ObjectBelonging?: SE.ObjectBelonging
    ReuseSessions?: SE.SessionReuseMode
    RootURL?: string
    SessionMaxAge?: number
    Synonym?: I8nTextXML
  }
  ChildObjects?: {
    URLTemplate?: MetadataHTTPServiceURLTemplatesXML
  }
}

export type { MetadataHTTPServiceURLTemplates, MetadataHTTPServiceURLTemplatesXML, MetadataHTTPServiceURLTemplatesYAML }

registerMetadataItemRule({
  propertyType: "MetadataHTTPService",
  itemRule: MetadataHTTPServiceRules,
})

export interface MetadataHTTPServiceURLTemplatesWidePropertyRule extends WidePropertyRuleBase {
  type: "MetadataHTTPServiceURLTemplates"
}

export type MetadataHTTPServiceURLTemplatesRuleParams = Omit<MetadataHTTPServiceURLTemplatesWidePropertyRule, "type">

export function metadataHTTPServiceURLTemplatesRule<const Params extends MetadataHTTPServiceURLTemplatesRuleParams>(
  params: WideExactRuleParams<MetadataHTTPServiceURLTemplatesRuleParams, Params>
): Readonly<{ type: "MetadataHTTPServiceURLTemplates" } & Params> {
  return defineWidePropertyRule("MetadataHTTPServiceURLTemplates", params)
}
