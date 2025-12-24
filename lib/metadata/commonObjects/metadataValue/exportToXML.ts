import { Context } from "../../context/types"
import { exportI8nTextToXML } from "../i8nText/exportToXML"
import {
  MetadataFixedArrayValueXML,
  MetadataFormChoiceListDesTimeValueXML,
  MetadataSimpleValueXML,
  MetadataValue,
  MetadataValueXML,
} from "./types"

export const exportMetadataValueToXML = (
  context: Context,
  data: MetadataValue | undefined
): MetadataValueXML | undefined => {
  if (!data) return undefined

  if (data.type === "fixedArray") {
    const values = data.value.map((v) => exportMetadataValueToXML(context, v)!)
    return {
      "_xsi:type": "v8:FixedArray",
      "v8:Value": values.length === 1 ? values[0] : values,
    } as MetadataFixedArrayValueXML
  }

  if (data.type === "formChoiceListDesTimeValue") {
    const value = exportMetadataValueToXML(context, data.value)
    if (!value) return undefined
    return {
      "_xsi:type": "FormChoiceListDesTimeValue",
      Presentation: exportI8nTextToXML(context, data.presentation),
      Value: value,
    } as MetadataFormChoiceListDesTimeValueXML
  }

  if (data.type === "string") {
    return createSimpleValue("xs:string", data.value)
  }

  if (data.type === "decimal") {
    return createSimpleValue("xs:decimal" as any, String(data.value))
  }

  if (data.type === "dateTime") {
    return createSimpleValue("xs:dateTime", data.value)
  }

  if (data.type === "boolean") {
    return createSimpleValue("xs:boolean", data.value)
  }

  if (data.type === "designTimeRef" || (data.type === "ref" && isDesignTimeRef(data.value))) {
    return createSimpleValue("xr:DesignTimeRef", data.value)
  }

  if (data.type === "ref") {
    return createSimpleValue("xr:MDObjectRef", data.value)
  }

  if (data.type === "ApplicationUsePurpose") {
    return createSimpleValue("app:ApplicationUsePurpose", data.value)
  }

  return undefined
}

export const exportMetadataValuesToXML = (
  context: Context,
  data: MetadataValue[] | undefined
): MetadataValueXML[] | undefined => {
  if (!data) return undefined

  return data.map((value) => exportMetadataValueToXML(context, value)!)
}

const createSimpleValue = (
  xsiType: MetadataSimpleValueXML["_xsi:type"],
  text: string | boolean | number
): MetadataSimpleValueXML => ({
  "_xsi:type": xsiType,
  "#text": text,
})

const isDesignTimeRef = (value: string): boolean =>
  value.includes("Enum.") || value.includes("Catalog.") || value.includes("EmptyRef")
