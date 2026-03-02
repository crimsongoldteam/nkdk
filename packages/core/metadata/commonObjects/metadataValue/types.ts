import { Type } from "@sinclair/typebox"
import { I8nText, I8nTextJSONSchema, I8nTextXML, I8nTextYAML } from "../i8nText/types"

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
export type MetadataPrimitiveValueType = Extract<
  MetadataValueType,
  "string" | "decimal" | "dateTime" | "boolean" | "objectRef"
>

export type MetadataValueTypeXML = (typeof MetadataValueTypeToXML)[keyof typeof MetadataValueTypeToXML]

export interface MetadataAbstractValue {
  type: MetadataValueType
}

export interface MetadataStringValue extends MetadataAbstractValue {
  type: "string"
  value: string
}

export interface MetadataDecimalValue extends MetadataAbstractValue {
  type: "decimal"
  value: number
}

export interface MetadataDateTimeValue extends MetadataAbstractValue {
  type: "dateTime"
  value: string
}

export interface MetadataBooleanValue extends MetadataAbstractValue {
  type: "boolean"
  value: boolean
}

export interface MetadataRefValue extends MetadataAbstractValue {
  type: "ref"
  value: string
}

export interface MetadataObjectRefValue extends MetadataAbstractValue {
  type: "objectRef"
  value: string
}

export type MetadataSimpleValue =
  | MetadataStringValue
  | MetadataDecimalValue
  | MetadataDateTimeValue
  | MetadataBooleanValue
  | MetadataRefValue
  | MetadataObjectRefValue

export interface MetadataFixedArrayValue extends MetadataAbstractValue {
  type: "fixedArray"
  value: MetadataValue[]
}

export interface MetadataFormChoiceListValue extends MetadataAbstractValue {
  type: "formChoiceListDesTimeValue"
  presentation?: I8nText
  value?: MetadataValue
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

export interface MetadataFormChoiceListValueXML {
  "_xsi:type": "FormChoiceListDesTimeValue"
  Presentation?: I8nTextXML
  Value: MetadataValueXML
}

export type MetadataValueXML = MetadataSimpleValueXML | MetadataFixedArrayValueXML | MetadataFormChoiceListValueXML

//#endregion

//#region MetadataValueYAML

export type MetadataSingleValueYAML = string | number

export type MetadataFixedArrayValueYAML = MetadataSingleValueYAML[]

export interface MetadataFormChoiceListComplexValueYAML {
  Представление: I8nTextYAML
  Значение: MetadataValueYAML
}

export type MetadataFormChoiceListValueYAML = MetadataFormChoiceListComplexValueYAML | string

export const MetadataValueJSONSchema = Type.Union([
  Type.String(),
  Type.Number(),
  Type.Array(Type.Union([Type.String(), Type.Number()])),
  Type.Object({
    Представление: I8nTextJSONSchema,
    Значение: Type.Any(),
  }),
])

export type MetadataValueYAML = MetadataSingleValueYAML | MetadataFixedArrayValueYAML | MetadataFormChoiceListValueYAML

//#endregion
