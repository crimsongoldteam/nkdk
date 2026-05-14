import type { Color, ColorYAML } from "~/metadata/commonObjects/color/types"
import type { Font, FontYAML } from "~/metadata/commonObjects/font/types"
import type { I8nText, I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"
import type { MetadataField, MetadataFieldYAML } from "~/metadata/commonObjects/metadataField/types"
import type { MetadataValue, MetadataValueYAML } from "~/metadata/commonObjects/metadataValue/types"
import type { TypeLink, TypeLinkYAML } from "~/metadata/commonObjects/typeLink/types"
import type {
  ChoiceParameterLinks,
  ChoiceParameterLinksYAML,
} from "~/metadata/commonObjects/сhoiceParameterLinks/types"
import type { ChoiceParameter, ChoiceParametersYAML } from "~/metadata/commonObjects/сhoiceParameters/types"
import { BasePropertyRule } from "~/metadata/orchestration"
import type { SystemEnumerationTypeMap } from "~/metadata/systemEnumerations/types"

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
export type MetadataDcsExplicitTextValueYAML =
  | {
      Тип: "Поле"
      Значение: string
    }
  | {
      Тип: "ЗначениеВремениПроектирования"
      Значение: string
    }

export type MetadataDcsMetadataSingleValue =
  | null
  | Color
  | MetadataField
  | MetadataDcsExplicitTextValue
  | ChoiceParameter
  | I8nText
  | MetadataValue
  | TypeLink
  | ChoiceParameterLinks
  | Font
  | string

export type MetadataDcsMetadataValue = MetadataDcsMetadataSingleValue | MetadataDcsMetadataSingleValue[]

export type MetadataDcsMetadataSingleValueYAML =
  | null
  | ColorYAML
  | MetadataFieldYAML
  | MetadataDcsExplicitTextValueYAML
  | ChoiceParametersYAML
  | I8nTextYAML
  | MetadataValueYAML
  | TypeLinkYAML
  | ChoiceParameterLinksYAML
  | FontYAML
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
