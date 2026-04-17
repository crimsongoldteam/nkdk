import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { ImportFromXMLFunction } from "~/metadata/orchestration/property/fn"
import { ConfigurationContextFromXML } from "../../context/types"
import { importFixedArrayFromXML } from "./fixedArray/fromXML"
import { importFormChoiceListFromXML } from "./formChoiceList/fromXML"
import { primitiveValueHandlers } from "./handlers"
import {
  MetadataFormChoiceListValue,
  MetadataFormChoiceListValueXML,
  MetadataPrimitiveValueType,
  MetadataStringValue,
  MetadataTypedValue,
  MetadataValuePropertyRule,
  MetadataValueType,
  MetadataValueTypeFromXML,
  MetadataValueTypeXML,
  assertValueType,
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

  const ruleTyped = params.rule as MetadataValuePropertyRule | undefined
  assertValueType(ruleTyped?.valueType, resultedType, "fromXML")

  if (resultedType === "fixedArray") {
    return importFixedArrayFromXML(context, data)
  }

  if (resultedType === "formChoiceListDesTimeValue") {
    return importFormChoiceListFromXML(context, data as MetadataFormChoiceListValueXML)
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

/** @deprecated Используй importFormChoiceListFromXML из submodule formChoiceList/fromXML */
export const importFormChoiceListValueFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  data: MetadataFormChoiceListValueXML
): MetadataFormChoiceListValue | undefined => importFormChoiceListFromXML(context, data)

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
