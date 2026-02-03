import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { _exportI8nTextToXML } from "../i8nText/_exportToXML"
import {
  MetadataFixedArrayValueXML,
  MetadataFormChoiceListValue,
  MetadataFormChoiceListValueXML,
  MetadataSimpleValueXML,
  MetadataValue,
  MetadataValueTypeToXML,
  MetadataValueXML,
} from "./types"

export const _exportMetadataValueToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataValue | undefined
): MetadataValueXML | undefined => {
  if (!data) return undefined

  const xmlType = MetadataValueTypeToXML[data.type]

  if (data.type === "fixedArray") {
    return _exportFixedArrayValueToXML(context, _rule, data as Extract<MetadataValue, { type: "fixedArray" }>)
  }

  if (data.type === "formChoiceListDesTimeValue") {
    return _exportFormChoiceListValueToXML(
      context,
      _rule,
      data as Extract<MetadataValue, { type: "formChoiceListDesTimeValue" }>
    )
  }

  return _exportSimpleValue(xmlType, String(data.value))
}

const _exportFixedArrayValueToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: Extract<MetadataValue, { type: "fixedArray" }>
): MetadataFixedArrayValueXML => {
  const values = data.value.map((v) => _exportMetadataValueToXML(context, _rule, v)!)
  return {
    "_xsi:type": "v8:FixedArray",
    "v8:Value": values.length === 1 ? values[0] : values,
  } as MetadataFixedArrayValueXML
}

export const _exportFormChoiceListValueToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataFormChoiceListValue
): MetadataFormChoiceListValueXML => {
  const value = _exportMetadataValueToXML(context, _rule, data.value)

  // Если значение undefined, создаем объект с xsi:nil="true"
  const valueXML: MetadataValueXML =
    value ??
    ({
      "_xsi:nil": true,
    } as any)

  return {
    "_xsi:type": "FormChoiceListDesTimeValue",
    Presentation: _exportI8nTextToXML(context, _rule, data.presentation),
    Value: valueXML,
  } as MetadataFormChoiceListValueXML
}

const _exportSimpleValue = (xsiType: MetadataSimpleValueXML["_xsi:type"], text: string): MetadataSimpleValueXML => ({
  "_xsi:type": xsiType,
  "#text": text,
})
