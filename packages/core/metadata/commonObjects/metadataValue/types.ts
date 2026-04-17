import { Static, Type } from "@sinclair/typebox"
import { BasePropertyRule } from "~/metadata/orchestration"
import { I8nText, I8nTextJSONSchema, I8nTextXML } from "../i8nText/types"

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

export type MetadataValueTypeToXMLTypes = [
  ["string", string],
  ["decimal", number],
  ["dateTime", string],
  ["boolean", boolean],
  ["objectRef", string],
  ["ref", string],
  ["ApplicationUsePurpose", string],
  // ["fixedArray", string[] | number[] | boolean[]],
  // ["formChoiceListDesTimeValue", { presentation: I8nText; value: MetadataValue }],
]

type MetadataValueTypeMap = typeof MetadataValueTypeToXML
export type MetadataValueType = keyof MetadataValueTypeMap

export type MetadataValueTypeXML = MetadataValueTypeMap[keyof MetadataValueTypeMap]

export const MetadataValueTypeFromXML = (xmlType: MetadataValueTypeXML | undefined): MetadataValueType | undefined => {
  if (!xmlType) return undefined
  const entries = Object.entries(MetadataValueTypeToXML) as Array<[MetadataValueType, MetadataValueTypeXML]>
  return entries.find(([, v]) => v === xmlType)?.[0]
}

export type MetadataPrimitiveValueType =
  | "string"
  | "decimal"
  | "dateTime"
  | "boolean"
  | "ref"
  | "objectRef"
  | "ApplicationUsePurpose"

type MetadataValueTypeToXMLTypesTuple = MetadataValueTypeToXMLTypes[number]
type MetadataValueTypeToXMLTypesMap = {
  [T in MetadataValueTypeToXMLTypesTuple[0]]: Extract<MetadataValueTypeToXMLTypesTuple, [T, unknown]>[1]
}

export type MetadataTypedPrimitiveValue = {
  [Type in MetadataPrimitiveValueType]: {
    type: Type
    value: MetadataValueTypeToXMLTypesMap[Type]
  }
}[MetadataPrimitiveValueType]

export type MetadataStringValue = Extract<MetadataTypedPrimitiveValue, { type: "string" }>
export type MetadataDecimalValue = Extract<MetadataTypedPrimitiveValue, { type: "decimal" }>
export type MetadataDateTimeValue = Extract<MetadataTypedPrimitiveValue, { type: "dateTime" }>
export type MetadataBooleanValue = Extract<MetadataTypedPrimitiveValue, { type: "boolean" }>
export type MetadataRefValue = Extract<MetadataTypedPrimitiveValue, { type: "ref" }>
export type MetadataObjectRefValue = Extract<MetadataTypedPrimitiveValue, { type: "objectRef" }>

export interface MetadataFixedArrayValue {
  type: "fixedArray"
  value: MetadataTypedValue[]
}

export interface MetadataFormChoiceListValue {
  type: "formChoiceListDesTimeValue"
  presentation?: I8nText
  value?: MetadataTypedValue
}

export type MetadataSimpleValue =
  | MetadataTypedPrimitiveValue["value"]
  | MetadataTypedPrimitiveValue["value"][]
  | {
      presentation: I8nText
      value: MetadataTypedPrimitiveValue
    }

export type MetadataTypedValue<T extends MetadataValueType = MetadataValueType> = Extract<
  MetadataTypedPrimitiveValue | MetadataFixedArrayValue | MetadataFormChoiceListValue,
  { type: T }
>

export type MetadataValue = MetadataTypedValue

//#region MetadataValueXML

export type MetadataPrimitiveValueXML<T extends MetadataPrimitiveValueType = MetadataPrimitiveValueType> = {
  "_xsi:type": MetadataValueTypeMap[T]
  "#text"?: string
}

export type MetadataFixedArrayValueXML = {
  "_xsi:type": "v8:FixedArray"
  "v8:Value": MetadataPrimitiveValueXML | MetadataPrimitiveValueXML[]
}

export interface MetadataFormChoiceListValueXML {
  "_xsi:type": "FormChoiceListDesTimeValue"
  Presentation?: I8nTextXML
  Value: MetadataPrimitiveValueXML | { "_xsi:nil": true }
}

export type MetadataSimpleValueXML = {
  "_xsi:type": MetadataValueTypeXML
  "#text"?: string
}

//#endregion

//#region MetadataValueYAML

export const MetadataSingleValueJSONSchema = Type.Union([Type.String(), Type.Number()])
export type MetadataSingleValueYAML = Static<typeof MetadataSingleValueJSONSchema>

export const MetadataFixedArrayValueJSONSchema = Type.Array(MetadataSingleValueJSONSchema)
export type MetadataFixedArrayValueYAML = Static<typeof MetadataFixedArrayValueJSONSchema>

export const MetadataValueJSONSchema = Type.Recursive((ThisType) =>
  Type.Union([
    MetadataSingleValueJSONSchema,
    MetadataFixedArrayValueJSONSchema,
    Type.Union([
      Type.Object({
        Представление: I8nTextJSONSchema,
        Значение: ThisType,
      }),
      Type.String(),
    ]),
  ])
)

export const MetadataFormChoiceListComplexValueJSONSchema = Type.Object({
  Представление: I8nTextJSONSchema,
  Значение: MetadataValueJSONSchema,
})
export type MetadataFormChoiceListComplexValueYAML = Static<typeof MetadataFormChoiceListComplexValueJSONSchema>

export const MetadataFormChoiceListValueJSONSchema = Type.Union([
  MetadataFormChoiceListComplexValueJSONSchema,
  Type.String(),
])
export type MetadataFormChoiceListValueYAML = MetadataFormChoiceListComplexValueYAML | string

export type MetadataValueYAML = Static<typeof MetadataValueJSONSchema>

//#endregion

export interface MetadataValuePropertyRule extends BasePropertyRule {
  type: "MetadataValue"

  /** Тип значения. После #74: всегда массив в новом коде. Одиночная строка — compat до #76. */
  valueType?: MetadataValueType | MetadataValueType[]

  exportNilValue?: true
  /** @deprecated Compat до #76. В новом коде не использовать. */
  withType?: boolean
}

/** Нормализует valueType: строка → массив, undefined → undefined */
export const normalizeValueType = (
  valueType: MetadataValueType | MetadataValueType[] | undefined
): MetadataValueType[] | undefined => {
  if (valueType === undefined) return undefined
  if (Array.isArray(valueType)) return valueType
  return [valueType]
}

/** Проверяет, является ли правило новым (valueType — массив), а не compat (одиночная строка или withType) */
export const isNewModeRule = (rule: MetadataValuePropertyRule | undefined): boolean => {
  if (!rule) return false
  if (Array.isArray(rule.valueType)) return true
  if (rule.valueType === undefined && rule.withType === undefined) return true
  return false
}
