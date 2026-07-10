import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../../orchestration/property/types"
import type { Color, ColorYAML } from "../../color/types"
import type { Font, FontYAML } from "../../font/types"
import type { FormattedI8nText, FormattedI8nTextValueYAML } from "../../formattedI8nText/types"
import type { I8nText, I8nTextYAML } from "../../i8nText/types"
import type { MetadataField, MetadataFieldYAML } from "../../metadataField/types"
import type { MetadataValue, MetadataValueYAML } from "../../metadataValue/types"
import type { TypeLink, TypeLinkYAML } from "../../typeLink/types"
import type { ChoiceParameterLinks, ChoiceParameterLinksYAML } from "../../сhoiceParameterLinks/types"
import type { ChoiceParameter, ChoiceParametersYAML } from "../../сhoiceParameters/types"
import { BasePropertyRule } from "../../../orchestration"
import type { SystemEnumerationTypeMap } from "../../../systemEnumerations/types"

export type DcsMetadataValueValueType =
  | "Color"
  | "Field"
  | "Parameter"
  | "DesignTimeValue"
  | "Primitive"
  | "TypeLink"
  | "ChoiceParameterLinks"
  | "SystemEnumeration"
  | "Font"

interface DcsMetadataValueBasePropertyRule extends BasePropertyRule {
  type: "MetadataDcsMetadataValue"
  valueType: Exclude<DcsMetadataValueValueType, "SystemEnumeration">
  exportNilValue?: boolean
}

interface SystemEnumerationPropertyRule extends BasePropertyRule {
  type: "MetadataDcsMetadataValue"
  valueType: "SystemEnumeration"
  typeSE: keyof SystemEnumerationTypeMap
  exportNilValue?: boolean
}

export type DcsMetadataValuePropertyRule = DcsMetadataValueBasePropertyRule | SystemEnumerationPropertyRule

export type MetadataDcsFieldValue = { type: "Field"; value: string }
export type MetadataDcsDesignTimeValue = { type: "DesignTimeValue"; value: string }
export type MetadataDcsExplicitTextValue = MetadataDcsFieldValue | MetadataDcsDesignTimeValue
export type MetadataDcsLocalFormattedStringTypeValue = {
  type: "LocalFormattedStringType"
  value: FormattedI8nText
}
export type MetadataDcsLocalStringTypeValueYAML = {
  Тип: "МногоязычнаяСтрока"
  Значение: I8nTextYAML
}
export type MetadataDcsLocalFormattedStringTypeValueYAML = {
  Тип: "МногоязычнаяФорматированнаяСтрока"
  Значение: FormattedI8nTextValueYAML
}
export type MetadataDcsExplicitTextValueYAML =
  | {
      Тип: "Поле"
      Значение: string
    }
  | {
      Тип: "ЗначениеВремениПроектирования"
      Значение: string
    }
  | MetadataDcsLocalStringTypeValueYAML
  | MetadataDcsLocalFormattedStringTypeValueYAML

export type MetadataDcsPrimitiveStringValueYAML = {
  Тип: "Строка"
  Значение: string
}

export type MetadataDcsSystemEnumerationValue = {
  type: "SystemEnumeration"
  typeSE: keyof SystemEnumerationTypeMap
  value: string
}

export type MetadataDcsSystemEnumerationValueYAML = {
  Тип: "СистемноеПеречисление"
  Имя: keyof SystemEnumerationTypeMap
  Значение: string
}

export type MetadataDcsMetadataSingleValue =
  | null
  | Color
  | MetadataField
  | MetadataDcsExplicitTextValue
  | MetadataDcsLocalFormattedStringTypeValue
  | ChoiceParameter
  | I8nText
  | MetadataValue
  | TypeLink
  | ChoiceParameterLinks
  | Font
  | MetadataDcsSystemEnumerationValue
  | string

export type MetadataDcsMetadataValue = MetadataDcsMetadataSingleValue | MetadataDcsMetadataSingleValue[]

export type MetadataDcsMetadataSingleValueYAML =
  | null
  | ColorYAML
  | MetadataFieldYAML
  | MetadataDcsExplicitTextValueYAML
  | MetadataDcsPrimitiveStringValueYAML
  | ChoiceParametersYAML
  | I8nTextYAML
  | MetadataValueYAML
  | TypeLinkYAML
  | ChoiceParameterLinksYAML
  | FontYAML
  | MetadataDcsSystemEnumerationValueYAML
  | string

export type MetadataDcsMetadataValueYAML = MetadataDcsMetadataSingleValueYAML | MetadataDcsMetadataSingleValueYAML[]

export type MetadataDcsMetadataValueDcsRootXML = {
  "dcscor:value":
    | string
    | Array<string | { "_xsi:type"?: string; "#text"?: string; [key: string]: unknown }>
    | {
        "_xsi:type"?: string
        "#text"?: string
        [key: string]: unknown
      }
}

export interface MetadataDcsMetadataValueWidePropertyRule extends WidePropertyRuleBase {
  type: "MetadataDcsMetadataValue"
}

export type MetadataDcsMetadataValueRuleParams = Omit<MetadataDcsMetadataValueWidePropertyRule, "type">

export function metadataDcsMetadataValueRule<const Params extends MetadataDcsMetadataValueRuleParams>(
  params: WideExactRuleParams<MetadataDcsMetadataValueRuleParams, Params>
): Readonly<{ type: "MetadataDcsMetadataValue" } & Params> {
  return defineWidePropertyRule("MetadataDcsMetadataValue", params)
}
