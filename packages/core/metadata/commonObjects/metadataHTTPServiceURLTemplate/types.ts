import { I8nTextXML } from "../i8nText/types"
import {
  MetadataHTTPServiceMethods,
  MetadataHTTPServiceMethodsXML,
  MetadataHTTPServiceMethodsYAML,
} from "../metadataHTTPServiceMethod/types"
import { MetadataNameYAML } from "../metadataName/types"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
import * as SE from "../../systemEnumerations/types"
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
