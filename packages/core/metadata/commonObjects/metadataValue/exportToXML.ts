import { Context } from "../../context/types"
import { exportI8nTextToXML } from "../i8nText/exportToXML"
import {
  MetadataFixedArrayValueXML,
  MetadataFormChoiceListDesTimeValueXML,
  MetadataSimpleValue,
  MetadataSimpleValueXML,
  MetadataValue,
  MetadataValueTypeToXML,
  MetadataValueXML,
} from "./types"
import { MetadataPrimitiveValueType } from "./types.ts"

export const exportMetadataValueToXML = (
  context: Context,
  data: MetadataValue | undefined
): MetadataValueXML | undefined => {
  if (!data) return undefined

  const xmlType = MetadataValueTypeToXML[data.type]

  if (data.type === "fixedArray") {
    return exportFixedArrayValueToXML(context, data as Extract<MetadataValue, { type: "fixedArray" }>)
  }

  if (data.type === "formChoiceListDesTimeValue") {
    return exportFormChoiceListDesTimeValueToXML(
      context,
      data as Extract<MetadataValue, { type: "formChoiceListDesTimeValue" }>
    )
  }

  return exportSimpleValue(xmlType, String(data.value))
}

export const exportMetadataValuesToXML = (
  context: Context,
  data: MetadataValue[] | undefined
): MetadataValueXML[] | undefined => {
  if (!data) return undefined

  return data.map((value) => exportMetadataValueToXML(context, value)!)
}

export const exportMetadataSimpleValueToXML = (
  _context: Context,
  value: string | boolean | number | undefined,
  type: MetadataPrimitiveValueType
): MetadataValueXML | undefined => {
  if (!value) return undefined

  const data = {
    type,
    value,
  } as MetadataSimpleValue

  return exportMetadataValueToXML(_context, data)
}

const exportFixedArrayValueToXML = (
  context: Context,
  data: Extract<MetadataValue, { type: "fixedArray" }>
): MetadataFixedArrayValueXML => {
  const values = data.value.map((v) => exportMetadataValueToXML(context, v)!)
  return {
    "_xsi:type": "v8:FixedArray",
    "v8:Value": values.length === 1 ? values[0] : values,
  } as MetadataFixedArrayValueXML
}

const exportFormChoiceListDesTimeValueToXML = (
  context: Context,
  data: Extract<MetadataValue, { type: "formChoiceListDesTimeValue" }>
): MetadataFormChoiceListDesTimeValueXML | undefined => {
  const value = exportMetadataValueToXML(context, data.value)
  if (!value) return undefined
  return {
    "_xsi:type": "FormChoiceListDesTimeValue",
    Presentation: exportI8nTextToXML(context, data.presentation),
    Value: value,
  } as MetadataFormChoiceListDesTimeValueXML
}

const exportSimpleValue = (xsiType: MetadataSimpleValueXML["_xsi:type"], text: string): MetadataSimpleValueXML => ({
  "_xsi:type": xsiType,
  "#text": text,
})
