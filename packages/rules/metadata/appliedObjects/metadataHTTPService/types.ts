import { I8nTextXML } from "../../commonObjects/i8nText/types"
import {
  MetadataHTTPServiceURLTemplates,
  MetadataHTTPServiceURLTemplatesXML,
  MetadataHTTPServiceURLTemplatesYAML,
} from "../../commonObjects/metadataHTTPServiceURLTemplate/types"
import { defineMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import * as SE from "../../systemEnumerations/types"
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

export const metadataRuleLayer000 = defineMetadataItemRule({
  propertyType: "MetadataHTTPService",
  itemRule: MetadataHTTPServiceRules,
})
