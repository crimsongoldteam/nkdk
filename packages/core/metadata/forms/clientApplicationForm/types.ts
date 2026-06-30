import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
import { TypeDescriptionEnterprise } from "~/metadata/commonObjects/typeDescription/types"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { FormElementTreeYAML } from "../commonObjects/childItems/types"
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
    Attribute?: FormAttributesXML
    ConditionalAppearance?: Record<string, unknown>
  }
  Parameters?: {
    Parameter: FormParametersXML
  }
  Commands?: { Command: FormCommandsXML }
  Events?: {
    Event: any
  }
  ChildItems?: { ChildItem: any } | Array<{ [key: string]: any }>
  AutoCommandBar?: {
    CommandBar: any
  }
  [key: string]: any
}

export type ClientApplicationFormYAML = YAMLTypeByRule<typeof ClientApplicationFormRules> & {
  Элементы?: FormElementTreeYAML
}

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

export interface ExternalFormItemFileWidePropertyRule extends WidePropertyRuleBase {
  type: "ExternalFormItemFile"
}

export type ExternalFormItemFileRuleParams = Omit<ExternalFormItemFileWidePropertyRule, "type">

export function externalFormItemFileRule<const Params extends ExternalFormItemFileRuleParams>(
  params: WideExactRuleParams<ExternalFormItemFileRuleParams, Params>
): Readonly<{ type: "ExternalFormItemFile" } & Params> {
  return defineWidePropertyRule("ExternalFormItemFile", params)
}
export interface ConditionalAppearanceWidePropertyRule extends WidePropertyRuleBase {
  type: "ConditionalAppearance"
}

export type ConditionalAppearanceRuleParams = Omit<ConditionalAppearanceWidePropertyRule, "type">

export function conditionalAppearanceRule<const Params extends ConditionalAppearanceRuleParams>(
  params: WideExactRuleParams<ConditionalAppearanceRuleParams, Params>
): Readonly<{ type: "ConditionalAppearance" } & Params> {
  return defineWidePropertyRule("ConditionalAppearance", params)
}
export interface AutoCommandBarWidePropertyRule extends WidePropertyRuleBase {
  type: "AutoCommandBar"
}

export type AutoCommandBarRuleParams = Omit<AutoCommandBarWidePropertyRule, "type">

export function autoCommandBarRule<const Params extends AutoCommandBarRuleParams>(
  params: WideExactRuleParams<AutoCommandBarRuleParams, Params>
): Readonly<{ type: "AutoCommandBar" } & Params> {
  return defineWidePropertyRule("AutoCommandBar", params)
}
export interface ClientApplicationFormWidePropertyRule extends WidePropertyRuleBase {
  type: "ClientApplicationForm"
}

export type ClientApplicationFormRuleParams = Omit<ClientApplicationFormWidePropertyRule, "type">

export function clientApplicationFormRule<const Params extends ClientApplicationFormRuleParams>(
  params: WideExactRuleParams<ClientApplicationFormRuleParams, Params>
): Readonly<{ type: "ClientApplicationForm" } & Params> {
  return defineWidePropertyRule("ClientApplicationForm", params)
}
