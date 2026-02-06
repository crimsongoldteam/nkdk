import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/typeRulesFactory"
import { ConfigurationContext } from "../../context/types"
import { exportI8nTextToXML } from "../i8nText/exportToXML"
import {
  MetadataFixedArrayValueXML,
  MetadataFormChoiceListValue,
  MetadataFormChoiceListValueXML,
  MetadataSimpleValue,
  MetadataSimpleValueXML,
  MetadataValue,
  MetadataValueTypeToXML,
  MetadataValueXML,
} from "./types"
import { MetadataPrimitiveValueType } from "./types.ts"

export const exportMetadataValueToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataValue | undefined
): MetadataValueXML | undefined => {
  if (!data) return undefined

  const xmlType = MetadataValueTypeToXML[data.type]

  if (data.type === "fixedArray") {
    return exportFixedArrayValueToXML(context, undefined, data as Extract<MetadataValue, { type: "fixedArray" }>)
  }

  if (data.type === "formChoiceListDesTimeValue") {
    return exportFormChoiceListValueToXML(
      context,
      undefined,
      data as Extract<MetadataValue, { type: "formChoiceListDesTimeValue" }>
    )
  }

  return exportSimpleValue(xmlType, String(data.value))
}

export const exportMetadataValuesToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataValue[] | undefined
): MetadataValueXML[] | undefined => {
  if (!data) return undefined

  return data.map((value) => exportMetadataValueToXML(context, undefined, value)!)
}

export const exportMetadataSimpleValueToXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: string | boolean | number | undefined,
  type: MetadataPrimitiveValueType
): MetadataSimpleValueXML | undefined => {
  if (value === undefined) return undefined

  const data = {
    type,
    value,
  } as MetadataSimpleValue

  return exportMetadataValueToXML(_context, undefined, data) as MetadataSimpleValueXML
}

const exportFixedArrayValueToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: Extract<MetadataValue, { type: "fixedArray" }>
): MetadataFixedArrayValueXML => {
  const values = data.value.map((v) => exportMetadataValueToXML(context, undefined, v)!)
  return {
    "_xsi:type": "v8:FixedArray",
    "v8:Value": values.length === 1 ? values[0] : values,
  } as MetadataFixedArrayValueXML
}

export const exportFormChoiceListValueToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataFormChoiceListValue
): MetadataFormChoiceListValueXML => {
  const value = exportMetadataValueToXML(context, undefined, data.value)

  // Если значение undefined, создаем объект с xsi:nil="true"
  const valueXML: MetadataValueXML =
    value ??
    ({
      "_xsi:nil": true,
    } as any)

  return {
    "_xsi:type": "FormChoiceListDesTimeValue",
    Presentation: exportI8nTextToXML(context, undefined, data.presentation),
    Value: valueXML,
  } as MetadataFormChoiceListValueXML
}

const exportSimpleValue = (xsiType: MetadataSimpleValueXML["_xsi:type"], text: string): MetadataSimpleValueXML => ({
  "_xsi:type": xsiType,
  "#text": text,
})

export const exportAssociatedTableToXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  value: string
): MetadataSimpleValueXML | undefined => {
  return exportMetadataSimpleValueToXML(_context, undefined, value, "string")
}

registerTypeRule("MetadataValue", "exportToXML", exportMetadataValueToXML)

registerTypeRule("AssociatedTable", "exportToXML", exportAssociatedTableToXML as any)
