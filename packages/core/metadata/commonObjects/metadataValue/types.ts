import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
import { Static, Type } from "@sinclair/typebox"
import { definePropertyRule, type ExactRuleParams } from "~/metadata/commonObjects/ruleBuilder"
import { BasePropertyRule } from "~/metadata/orchestration"
import type { ExplicitYAMLString } from "~/yaml/explicitString"
import { I8nText, I8nTextJSONSchema, I8nTextXML, I8nTextYAML } from "../i8nText/types"
import {
  StandardPeriod,
  StandardPeriodXML,
  StandardPeriodYAML,
  StandardPeriodYAMLJSONSchema,
} from "../standardPeriod/types"

//#region MetadataValue

export const MetadataValueTypeToXML = {
  string: "xs:string",
  decimal: "xs:decimal",
  dateTime: "xs:dateTime",
  boolean: "xs:boolean",
  ref: "xr:DesignTimeRef",
  objectRef: "xr:MDObjectRef",
  ApplicationUsePurpose: "app:ApplicationUsePurpose",
  typeRef: "v8:Type",
  uuid: "v8:UUID",
  valueList: "xr:ValueList",
  DataCompositionComparisonType: "dcsset:DataCompositionComparisonType",
  AccountType: "ent:AccountType",
  fixedArray: "v8:FixedArray",
  formChoiceListDesTimeValue: "FormChoiceListDesTimeValue",
  standardPeriod: "v8:StandardPeriod",
} as const

export type MetadataValueTypeToXMLTypes = [
  ["string", string],
  ["decimal", number],
  ["dateTime", string],
  ["boolean", boolean],
  ["objectRef", string],
  ["ref", string],
  ["ApplicationUsePurpose", string],
  ["typeRef", string],
  ["uuid", string],
  ["DataCompositionComparisonType", string],
  ["AccountType", string],
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
  | "typeRef"
  | "uuid"
  | "DataCompositionComparisonType"
  | "AccountType"

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
  value: Array<MetadataTypedValue | undefined>
}

export interface MetadataFormChoiceListValue {
  type: "formChoiceListDesTimeValue"
  presentation?: I8nText
  value?: MetadataTypedValue
}

export interface MetadataValueListValue {
  type: "valueList"
}

export interface MetadataStandardPeriodValue {
  type: "standardPeriod"
  value: StandardPeriod
}

export type MetadataSimpleValue =
  | MetadataTypedPrimitiveValue["value"]
  | MetadataTypedPrimitiveValue["value"][]
  | {
      presentation: I8nText
      value: MetadataTypedPrimitiveValue
    }

export type MetadataTypedValue<T extends MetadataValueType = MetadataValueType> = Extract<
  | MetadataTypedPrimitiveValue
  | MetadataFixedArrayValue
  | MetadataFormChoiceListValue
  | MetadataValueListValue
  | MetadataStandardPeriodValue,
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
  "v8:Value": MetadataPrimitiveValueXML | { "_xsi:nil": true } | Array<MetadataPrimitiveValueXML | { "_xsi:nil": true }>
}

export interface MetadataFormChoiceListValueXML {
  "_xsi:type": "FormChoiceListDesTimeValue"
  Presentation?: I8nTextXML
  Value: MetadataPrimitiveValueXML | MetadataValueListXML | { "_xsi:nil": true }
}

export type MetadataValueListXML = {
  "_xsi:type": "xr:ValueList"
}

export type MetadataSimpleValueXML = {
  "_xsi:type": MetadataValueTypeXML
  "#text"?: string
}

//#endregion

//#region MetadataValueYAML

export const MetadataSingleValueJSONSchema = Type.Union([Type.String(), Type.Number()])
export type MetadataSingleValueYAML = Static<typeof MetadataSingleValueJSONSchema> | ExplicitYAMLString

export const MetadataExplicitFormChoiceListValueYAMLJSONSchema = Type.Object(
  {
    Тип: Type.Literal("ЗначениеСпискаВыбора"),
    Представление: Type.Optional(I8nTextJSONSchema),
    Значение: Type.Optional(Type.Any()),
  },
  { additionalProperties: false }
)

export type MetadataExplicitFormChoiceListValueYAML = {
  Тип: "ЗначениеСпискаВыбора"
  Представление?: I8nTextYAML
  Значение?: MetadataFormChoiceListValueValueYAML
}

export const MetadataFixedArrayValueJSONSchema = Type.Array(
  Type.Union([
    MetadataSingleValueJSONSchema,
    MetadataExplicitFormChoiceListValueYAMLJSONSchema,
    Type.Undefined(),
    Type.Null(),
  ])
)
export type MetadataFixedArrayValueYAML = Array<
  MetadataSingleValueYAML | MetadataExplicitFormChoiceListValueYAML | null | undefined
>
export type MetadataFixedArrayValueYAMLInput = MetadataFixedArrayValueYAML

export const MetadataExplicitDataCompositionComparisonTypeYAMLJSONSchema = Type.Object({
  Тип: Type.Literal("ВидСравненияКомпоновкиДанных"),
  Значение: Type.String(),
})
export type MetadataExplicitDataCompositionComparisonTypeYAML = Static<
  typeof MetadataExplicitDataCompositionComparisonTypeYAMLJSONSchema
>

export const MetadataExplicitAccountTypeYAMLJSONSchema = Type.Object({
  Тип: Type.Literal("ВидСчета"),
  Значение: Type.String(),
})
export type MetadataExplicitAccountTypeYAML = Static<typeof MetadataExplicitAccountTypeYAMLJSONSchema>

export const MetadataValueJSONSchema = Type.Recursive((ThisType) =>
  Type.Union([
    MetadataSingleValueJSONSchema,
    MetadataFixedArrayValueJSONSchema,
    MetadataExplicitDataCompositionComparisonTypeYAMLJSONSchema,
    MetadataExplicitAccountTypeYAMLJSONSchema,
    StandardPeriodYAMLJSONSchema,
    Type.Object(
      {
        Представление: I8nTextJSONSchema,
        Значение: Type.Optional(ThisType),
      },
      { additionalProperties: false }
    ),
    Type.Object(
      {
        Значение: ThisType,
      },
      { additionalProperties: false }
    ),
  ])
)

const MetadataFormChoiceListValueValueJSONSchema = Type.Union([
  MetadataValueJSONSchema,
  MetadataExplicitDataCompositionComparisonTypeYAMLJSONSchema,
  MetadataExplicitAccountTypeYAMLJSONSchema,
])

export const MetadataFormChoiceListComplexValueJSONSchema = Type.Union([
  Type.Object(
    {
      Представление: I8nTextJSONSchema,
      Значение: Type.Optional(MetadataFormChoiceListValueValueJSONSchema),
    },
    { additionalProperties: false }
  ),
  Type.Object(
    {
      Значение: MetadataFormChoiceListValueValueJSONSchema,
    },
    { additionalProperties: false }
  ),
])
export type MetadataFormChoiceListValueValueYAML =
  | MetadataValueYAML
  | MetadataExplicitDataCompositionComparisonTypeYAML
  | MetadataExplicitAccountTypeYAML

export type MetadataFormChoiceListComplexValueYAML = {
  Представление?: I8nTextYAML
  Значение?: MetadataFormChoiceListValueValueYAML
}

export const MetadataFormChoiceListValueJSONSchema = MetadataFormChoiceListComplexValueJSONSchema
export type MetadataFormChoiceListValueYAML = MetadataFormChoiceListComplexValueYAML

export type MetadataValueYAML =
  | MetadataSingleValueYAML
  | MetadataFixedArrayValueYAML
  | MetadataExplicitDataCompositionComparisonTypeYAML
  | MetadataExplicitAccountTypeYAML
  | StandardPeriodYAML
  | MetadataFormChoiceListComplexValueYAML
  | {
      Представление: I8nTextYAML
      Значение?: MetadataValueYAML
    }
  | {
      Значение: MetadataValueYAML
    }

//#endregion

export interface MetadataValuePropertyRule extends BasePropertyRule {
  type: "MetadataValue"

  /** Разрешённые типы значения. undefined = любой тип. */
  valueType?: MetadataValueType[]

  exportNilValue?: true
}

export type MetadataValueRuleParams = Omit<MetadataValuePropertyRule, "type">

export function metadataValueRule<const Params extends MetadataValueRuleParams>(
  params: ExactRuleParams<MetadataValueRuleParams, Params>
): Readonly<{ type: "MetadataValue" } & Params> {
  return definePropertyRule("MetadataValue", params)
}

/**
 * XML-форма MetadataValue. Объединяет все возможные XML-представления значения.
 * Дженерик-параметры оставлены для обратной совместимости — они игнорируются.
 */
export type MetadataValueXML<_Rule = unknown, _Value = unknown> =
  | MetadataPrimitiveValueXML
  | MetadataFixedArrayValueXML
  | MetadataFormChoiceListValueXML
  | MetadataValueListXML
  | StandardPeriodXML
  | { "_xsi:nil": true }

/** Validates that the actual type matches the rule's allowed types. Throws if not. */
export const assertValueType = (
  allowed: MetadataValueType[] | undefined,
  actual: MetadataValueType,
  direction: string
): void => {
  if (allowed !== undefined && !allowed.includes(actual)) {
    throw new Error(`MetadataValue: ожидались [${allowed.join(",")}], получен ${actual} в ${direction}`)
  }
}

export interface AssociatedTableWidePropertyRule extends WidePropertyRuleBase {
  type: "AssociatedTable"
}

export type AssociatedTableRuleParams = Omit<AssociatedTableWidePropertyRule, "type">

export function associatedTableRule<const Params extends AssociatedTableRuleParams>(
  params: WideExactRuleParams<AssociatedTableRuleParams, Params>
): Readonly<{ type: "AssociatedTable" } & Params> {
  return defineWidePropertyRule("AssociatedTable", params)
}
