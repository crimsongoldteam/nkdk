import { TypeDescriptionEnterprise } from "~/metadata/commonObjects/typeDescription/types"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { FormAttributesXML } from "../commonObjects/formAttribute/types"
import { FormCommandsXML } from "../commonObjects/formCommand/types"
import { FormParametersXML } from "../commonObjects/formParameter/types"
import { ClientApplicationFormRules } from "./rules"

export type ClientApplicationForm = MetadataTypeByRule<typeof ClientApplicationFormRules>

export interface ClientApplicationFormXML {
  _xmlns?: string
  "_xmlns:app"?: string
  "_xmlns:cfg"?: string
  "_xmlns:dcscor"?: string
  "_xmlns:dcssch"?: string
  "_xmlns:dcsset"?: string
  "_xmlns:ent"?: string
  "_xmlns:lf"?: string
  "_xmlns:style"?: string
  "_xmlns:sys"?: string
  "_xmlns:v8"?: string
  "_xmlns:v8ui"?: string
  "_xmlns:web"?: string
  "_xmlns:win"?: string
  "_xmlns:xr"?: string
  "_xmlns:xs"?: string
  "_xmlns:xsi"?: string
  _version?: string

  Attributes?: {
    Attribute: FormAttributesXML
  }
  Parameters?: {
    Parameter: FormParametersXML
  }
  Commands?: { Command: FormCommandsXML }
  Events?: {
    Event: any
  }
  ChildItems?: {
    ChildItem: any
  }
  AutoCommandBar?: {
    CommandBar: any
  }
  [key: string]: any
}

export type ClientApplicationFormYAML = YAMLTypeByRule<typeof ClientApplicationFormRules>

export interface FormMetadataXML {
  _xmlns?: string
  "_xmlns:app"?: string
  "_xmlns:cfg"?: string
  "_xmlns:cmi"?: string
  "_xmlns:ent"?: string
  "_xmlns:lf"?: string
  "_xmlns:style"?: string
  "_xmlns:sys"?: string
  "_xmlns:v8"?: string
  "_xmlns:v8ui"?: string
  "_xmlns:web"?: string
  "_xmlns:win"?: string
  "_xmlns:xen"?: string
  "_xmlns:xpr"?: string
  "_xmlns:xr"?: string
  "_xmlns:xs"?: string
  "_xmlns:xsi"?: string
  _version?: string
  Form: {
    _uuid?: string
    Properties: Record<string, any>
  }
}

export interface ClientApplicationFormEnterprise {
  prefix: string
  attributes: EnterpriseAttributes
  childItems: any
}

export interface EnterpriseAttribute {
  Name: string
  Path?: string
  Title?: string
  Type: TypeDescriptionEnterprise
}

export type EnterpriseAttributes = EnterpriseAttribute[]

export interface EnterpriseAttributeMapItem {
  name: string
  path?: string
  title?: string
  type: TypeDescriptionEnterprise
  childItems?: EnterpriseAttributesMap
}

export type EnterpriseAttributesMap = Record<string, EnterpriseAttributeMapItem>

export const FormRulesTags = {
  Form: "Form",
  Metadata: "Metadata",
} as const
