import { Context } from "../../context/types"
import {
  MetadataValue,
  MetadataValueXML,
  MetadataSimpleValueXML,
  MetadataFixedArrayValueXML,
  MetadataFormChoiceListDesTimeValueXML,
} from "./types"

const mapXMLTypeToType = (
  xmlType: string
): MetadataValue["type"] | undefined => {
  switch (xmlType) {
    case "xs:string":
      return "string"
    case "xs:number":
      return "number"
    case "xs:dateTime":
      return "dateTime"
    case "xs:boolean":
      return "boolean"
    case "xr:DesignTimeRef":
      return "designTimeRef"
    case "v8:FixedArray":
      return "fixedArray"
    case "FormChoiceListDesTimeValue":
      return "formChoiceListDesTimeValue"
    default:
      return undefined
  }
}

export const importMetadataValueFromXML = (
  context: Context,
  data: MetadataValueXML | string | undefined
): MetadataValue | undefined => {
  if (!data) return undefined

  // Если data - строка, возвращаем объект с этой строкой как значением
  if (typeof data === "string") {
    return {
      type: "string",
      value: data,
    }
  }

  // Обработка простых типов с "#text"
  if (
    data["_xsi:type"] === "xs:string" ||
    data["_xsi:type"] === "xs:number" ||
    data["_xsi:type"] === "xs:dateTime" ||
    data["_xsi:type"] === "xs:boolean" ||
    data["_xsi:type"] === "xr:DesignTimeRef"
  ) {
    const xmlType = data["_xsi:type"]
    const type = mapXMLTypeToType(xmlType)
    if (!type) return undefined

    const textValue = (data as MetadataSimpleValueXML)["#text"]

    if (type === "string") {
      return {
        type: "string",
        value: textValue,
      }
    }
    if (type === "number") {
      return {
        type: "number",
        value: Number(textValue),
      }
    }
    if (type === "dateTime") {
      return {
        type: "dateTime",
        value: new Date(textValue),
      }
    }
    if (type === "boolean") {
      return {
        type: "boolean",
        value: textValue === "true",
      }
    }
    if (type === "designTimeRef") {
      return {
        type: "designTimeRef",
        value: textValue,
      }
    }
  }

  // Обработка FixedArray
  if (data["_xsi:type"] === "v8:FixedArray") {
    const fixedArrayData = data as MetadataFixedArrayValueXML
    const values = Array.isArray(fixedArrayData["v8:Value"])
      ? fixedArrayData["v8:Value"]
      : [fixedArrayData["v8:Value"]]
    return {
      type: "fixedArray",
      value: values
        .map((v) => importMetadataValueFromXML(context, v))
        .filter((v): v is MetadataValue => v !== undefined),
    }
  }

  // Обработка FormChoiceListDesTimeValue
  if (data["_xsi:type"] === "FormChoiceListDesTimeValue") {
    const formChoiceData = data as MetadataFormChoiceListDesTimeValueXML
    const value = importMetadataValueFromXML(context, formChoiceData.Value)
    if (!value) return undefined
    return {
      type: "formChoiceListDesTimeValue",
      value,
    }
  }

  return undefined
}

export const importMetadataValuesFromXML = (
  context: Context,
  data: MetadataValueXML[] | undefined
): MetadataValue[] | undefined => {
  if (!data) return undefined

  return data.map((value) => importMetadataValueFromXML(context, value)!)
}
