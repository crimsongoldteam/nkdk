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

export interface DcsMetadataValuePropertyRule extends BasePropertyRule {
  type: "MetadataDcsMetadataValue"
  valueType: DcsMetadataValueValueType
  /** Для `SystemEnumeration` — ключ из `SystemEnumerationTypeMap`. */
  typeSE?: keyof SystemEnumerationTypeMap
}

export type MetadataDcsMetadataValue =
  | Color
  | MetadataField
  | ChoiceParameter
  | I8nText
  | MetadataValue
  | TypeLink
  | ChoiceParameterLinks
  | Font
  | string

export type MetadataDcsMetadataValueYAML =
  | ColorYAML
  | MetadataFieldYAML
  | ChoiceParametersYAML
  | I8nTextYAML
  | MetadataValueYAML
  | TypeLinkYAML
  | ChoiceParameterLinksYAML
  | FontYAML
  | string

/** Корень DCS-фрагмента: один `dcscor:value` с `xsi:type` и содержимым. */
export type MetadataDcsMetadataValueDcsRootXML = {
  "dcscor:value":
    | string
    | {
        "_xsi:type"?: string
        "#text"?: string
        [key: string]: unknown
      }
}
