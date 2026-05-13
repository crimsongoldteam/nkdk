import { I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import { MetadataNameYAML } from "~/metadata/commonObjects/metadataName/types"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import * as SE from "~/metadata/systemEnumerations/types"
import { MetadataHTTPServiceMethodRules } from "./rules"

export type MetadataHTTPServiceMethod = MetadataTypeByRule<typeof MetadataHTTPServiceMethodRules>

export interface MetadataHTTPServiceMethodXML {
  _uuid?: string
  Properties: {
    Comment?: string
    ExtendedConfigurationObject?: string
    Handler?: string
    HTTPMethod?: SE.HTTPMethod
    Name: string
    ObjectBelonging?: SE.ObjectBelonging
    Synonym?: I8nTextXML
  }
}

export type MetadataHTTPServiceMethodYAML = YAMLTypeByRule<typeof MetadataHTTPServiceMethodRules>

export type MetadataHTTPServiceMethods = MetadataHTTPServiceMethod[]
export type MetadataHTTPServiceMethodsXML = MetadataHTTPServiceMethodXML | MetadataHTTPServiceMethodXML[]
export type MetadataHTTPServiceMethodsYAML = Record<MetadataNameYAML, MetadataHTTPServiceMethodYAML>
