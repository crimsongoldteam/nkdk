import { Static, Type } from "@sinclair/typebox"
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

type MetadataSimpleValue =
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

export type MetadataValueByRule<Rule extends MetadataValuePropertyRule> = Rule["valueType"] extends undefined
  ? MetadataTypedValue
  : MetadataSimpleValue

//#region MetadataValueXML

export type MetadataValueXML<
  Rule extends MetadataValuePropertyRule = MetadataValuePropertyRule,
  Value extends MetadataTypedValue | MetadataSimpleValue | undefined = undefined,
> = Value extends undefined
  ? Rule extends { exportNilValue: true }
    ? { "_xsi:nil": true }
    : undefined
  : Rule extends { valueType: infer Type extends MetadataValueType }
    ? MetadataTypedValueXML<Type>
    : MetadataTypedValueXML

export type MetadataPrimitiveValueXML<T extends MetadataPrimitiveValueType = MetadataPrimitiveValueType> = {
  "_xsi:type": MetadataValueTypeMap[T]
  "#text"?: string
}

export type MetadataFixedArrayValueXML = {
  "_xsi:type": "v8:FixedArray"
  "v8:Value":
    | MetadataValueXML<
        { type: "MetadataValue"; valueType: "fixedArray"; exportNilValue: true },
        MetadataPrimitiveValueType
      >
    | MetadataValueXML<
        { type: "MetadataValue"; valueType: "fixedArray"; exportNilValue: true },
        MetadataPrimitiveValueType
      >[]
}

export interface MetadataFormChoiceListValueXML {
  "_xsi:type": "FormChoiceListDesTimeValue"
  Presentation?: I8nTextXML
  Value: MetadataValueXML<
    { type: "MetadataValue"; valueType: "formChoiceListDesTimeValue" },
    MetadataPrimitiveValueType
  >
}

type MetadataTypedValueXML<Type extends MetadataValueType = MetadataPrimitiveValueType> =
  Type extends MetadataPrimitiveValueType
    ? MetadataPrimitiveValueXML<Type>
    : Type extends "fixedArray"
      ? MetadataFixedArrayValueXML
      : MetadataFormChoiceListValueXML

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

export type MetadataValuePropertyRule = {
  type: "MetadataValue"

  /**
   * Тип значения
   */
  valueType?: MetadataValueType

  /**
   * Для YAML: принудительно выгружать строковые значения с кавычками
   */
  withType?: true

  /**
   * Если включен, то значение undefined будет выгружено с `_xsi:nil="true"`
   */
  exportNilValue?: true
}
