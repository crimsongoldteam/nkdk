import { I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import {
  MetadataHTTPServiceMethods,
  MetadataHTTPServiceMethodsXML,
  MetadataHTTPServiceMethodsYAML,
} from "~/metadata/commonObjects/metadataHTTPServiceMethod/types"
import { MetadataNameYAML } from "~/metadata/commonObjects/metadataName/types"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import * as SE from "~/metadata/systemEnumerations/types"
import { MetadataHTTPServiceURLTemplateRules } from "./rules"

export type MetadataHTTPServiceURLTemplate = MetadataTypeByRule<typeof MetadataHTTPServiceURLTemplateRules>

export interface MetadataHTTPServiceURLTemplateXML {
  _uuid?: string
  Properties: {
    Comment?: string
    ExtendedConfigurationObject?: string
    Name: string
    ObjectBelonging?: SE.ObjectBelonging
    Synonym?: I8nTextXML
    Template?: string
  }
  ChildObjects?: {
    Method?: MetadataHTTPServiceMethodsXML
  }
}

export type MetadataHTTPServiceURLTemplateYAML = YAMLTypeByRule<typeof MetadataHTTPServiceURLTemplateRules>

export type MetadataHTTPServiceURLTemplates = MetadataHTTPServiceURLTemplate[]
export type MetadataHTTPServiceURLTemplatesXML = MetadataHTTPServiceURLTemplateXML | MetadataHTTPServiceURLTemplateXML[]
export type MetadataHTTPServiceURLTemplatesYAML = Record<MetadataNameYAML, MetadataHTTPServiceURLTemplateYAML>

export type { MetadataHTTPServiceMethods, MetadataHTTPServiceMethodsXML, MetadataHTTPServiceMethodsYAML }
