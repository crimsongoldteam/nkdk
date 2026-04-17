import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { ImportFromXMLFunction } from "~/metadata/orchestration/property/fn"
import { ConfigurationContext, ConfigurationContextFromXML } from "../../context/types"
import { importI8nTextFromXML } from "../i8nText/fromXML"
import { primitiveValueHandlers } from "./handlers"
import {
  MetadataFixedArrayValue,
  MetadataFixedArrayValueXML,
  MetadataFormChoiceListValue,
  MetadataFormChoiceListValueXML,
  MetadataPrimitiveValueType,
  MetadataStringValue,
  MetadataTypedValue,
  MetadataValueType,
  MetadataValueTypeFromXML,
  MetadataValueTypeXML,
} from "./types"

const PRIMITIVE_TYPES: readonly MetadataPrimitiveValueType[] = [
  "string",
  "decimal",
  "dateTime",
  "boolean",
  "ref",
  "objectRef",
  "ApplicationUsePurpose",
]

/**
 * Импортирует MetadataValue из XML. Всегда возвращает тегированную форму {type, value}.
 * Тип берётся из xsi:type в XML или из параметра `type`.
 */
export const importMetadataValueFromXML = (params: {
  context: ConfigurationContextFromXML
  rule: PropertyRule | undefined
  value: any
  type?: MetadataValueType
}): MetadataTypedValue | undefined => {
  const { context, value: data, type } = params
  if (!data) return undefined

  const resultedType: MetadataValueType | undefined = type ?? MetadataValueTypeFromXML(data["_xsi:type"] as MetadataValueTypeXML)
  if (!resultedType) throw new Error(`MetadataValue: не распознан тип: ${data["_xsi:type"]}`)

  if (resultedType === "fixedArray") {
    return importFixedArrayFromXML(context, data as MetadataFixedArrayValueXML)
  }

  if (resultedType === "formChoiceListDesTimeValue") {
    return importFormChoiceListValueFromXML(context, undefined, data as MetadataFormChoiceListValueXML)
  }

  if (!PRIMITIVE_TYPES.includes(resultedType as MetadataPrimitiveValueType)) {
    throw new Error(`MetadataValue: неподдерживаемый примитивный тип: ${resultedType}`)
  }

  const textValue = data["#text"] as string | boolean | number | undefined
  const handler = primitiveValueHandlers[resultedType as MetadataPrimitiveValueType]
  return handler.fromXML(context, textValue)
}

export const importMetadataValuesFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  data: any[] | undefined
): MetadataTypedValue[] | undefined => {
  if (!data) return undefined
  return data.map((value) => importMetadataValueFromXML({ context, rule: undefined, value })!)
}

export const importMetadataSimpleValueFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  data: any
): string | boolean | number | undefined => {
  const result = importMetadataValueFromXML({ context, rule: undefined, value: data })
  if (!result) return undefined
  if (!("value" in result)) throw new Error(`MetadataValue: ожидался примитив, получен ${result.type}`)
  return (result as any).value as string | boolean | number
}

const importFixedArrayFromXML = (
  context: ConfigurationContextFromXML,
  data: MetadataFixedArrayValueXML | { "v8:Value": any | any[] }
): MetadataFixedArrayValue => {
  const raw = data["v8:Value"]
  const values = Array.isArray(raw) ? raw : [raw]
  return {
    type: "fixedArray",
    value: values.map((v) => importMetadataValueFromXML({ context, rule: undefined, value: v })!),
  }
}

export const importFormChoiceListValueFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  data: MetadataFormChoiceListValueXML
): MetadataFormChoiceListValue | undefined => {
  if (!data) return undefined
  const value = importMetadataValueFromXML({ context, rule: undefined, value: data.Value })
  const presentation = importI8nTextFromXML(context, { type: "I8nText" }, data.Presentation)
  return { type: "formChoiceListDesTimeValue", value, presentation }
}

/**
 * Импортирует AssociatedTable (xs:string) из XML.
 * Возвращает MetadataStringValue вместо raw string.
 */
export const importAssociatedTableFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule,
  data: any
): MetadataStringValue | undefined => {
  const result = importMetadataValueFromXML({ context, rule: undefined, value: data, type: "string" })
  if (!result) return undefined
  return result as MetadataStringValue
}

const importMetadataValueFromXMLForRule: ImportFromXMLFunction = (context, rule, value) =>
  importMetadataValueFromXML({ context, rule, value })

registerTypeRule("MetadataValue", "importFromXML", importMetadataValueFromXMLForRule)
registerTypeRule("AssociatedTable", "importFromXML", importAssociatedTableFromXML)
