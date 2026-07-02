import { I8nTextXML } from "../i8nText/types"
import { MetadataNameYAML } from "../metadataName/types"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
import * as SE from "../../systemEnumerations/types"
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
