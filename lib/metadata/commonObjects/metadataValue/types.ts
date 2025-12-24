import { I8nText, I8nTextXML } from "../i8nText/types"

//#region MetadataValue

export const MetadataValueTypeToXML = {
  string: "xs:string",
  decimal: "xs:decimal",
  dateTime: "xs:dateTime",
  boolean: "xs:boolean",
  ref: "xr:DesignTimeRef",
  objectRef: "xr:MDObjectRef",
  ApplicationUsePurpose: "app:ApplicationUsePurpose",
  fixedArray: "v8:FixedArray",
  formChoiceListDesTimeValue: "FormChoiceListDesTimeValue",
} as const

export const MetadataValueTypeFromXML = (xmlType: MetadataValueTypeXML): MetadataValueType | undefined => {
  return Object.keys(MetadataValueTypeToXML).find(
    (key) => MetadataValueTypeToXML[key as keyof typeof MetadataValueTypeToXML] === xmlType
  ) as MetadataValueType | undefined
}

export type MetadataValueType = keyof typeof MetadataValueTypeToXML
export type MetadataPrimitiveValueType = Extract<MetadataValueType, "string" | "decimal" | "dateTime" | "boolean">

export type MetadataValueTypeXML = (typeof MetadataValueTypeToXML)[keyof typeof MetadataValueTypeToXML]

export interface MetadataAbstractValue {
  type: MetadataValueType
}

export interface MetadataSimpleValue {
  type: MetadataValueType
  value: string | boolean | number
}

export interface MetadataFixedArrayValue extends MetadataAbstractValue {
  type: "fixedArray"
  value: MetadataValue[]
}

export interface MetadataFormChoiceListValue extends MetadataAbstractValue {
  type: "formChoiceListDesTimeValue"
  presentation?: I8nText
  value: MetadataValue
}

export type MetadataValue = MetadataSimpleValue | MetadataFixedArrayValue | MetadataFormChoiceListValue

//#region MetadataValueXML

export interface MetadataSimpleValueXML {
  "_xsi:type": MetadataValueTypeXML
  "#text": string | boolean | number
}

export interface MetadataFixedArrayValueXML {
  "_xsi:type": "v8:FixedArray"
  "v8:Value": MetadataValueXML | MetadataValueXML[]
}

export interface MetadataFormChoiceListDesTimeValueXML {
  "_xsi:type": "FormChoiceListDesTimeValue"
  Presentation?: I8nTextXML
  Value: MetadataValueXML
}

export type MetadataValueXML =
  | MetadataSimpleValueXML
  | MetadataFixedArrayValueXML
  | MetadataFormChoiceListDesTimeValueXML

//#endregion

export interface MetadataValueEnterprise {
  Тип: string
  Значение: string
}

export interface MetadataFormChoiceListDesTimeValueEnterprise {
  Представление: string
  Тип: string
  Значение: string
}

export type MetadataValueEnterpriseResult =
  | MetadataValueEnterprise
  | MetadataFormChoiceListDesTimeValueEnterprise
  | string
  | string[]
  | undefined
