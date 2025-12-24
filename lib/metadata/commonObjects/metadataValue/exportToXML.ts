import { Context } from "../../context/types"
import {
  MetadataValue,
  MetadataValueXML,
  MetadataSimpleValueXML,
  MetadataFixedArrayValueXML,
  MetadataFormChoiceListDesTimeValueXML,
} from "./types"

export const exportMetadataValueToXML = (
  context: Context,
  data: MetadataValue | undefined
): MetadataValueXML | undefined => {
  if (!data) return undefined

  switch (data.type) {
    case "string": {
      const result: MetadataSimpleValueXML = {
        "_xsi:type": "xs:string",
        "#text": data.value,
      }
      return result
    }
    case "number": {
      const result: MetadataSimpleValueXML = {
        "_xsi:type": "xs:number",
        "#text": String(data.value),
      }
      return result
    }
    case "dateTime": {
      const result: MetadataSimpleValueXML = {
        "_xsi:type": "xs:dateTime",
        "#text": data.value.toISOString(),
      }
      return result
    }
    case "boolean": {
      const result: MetadataSimpleValueXML = {
        "_xsi:type": "xs:boolean",
        "#text": String(data.value),
      }
      return result
    }
    case "designTimeRef": {
      const result: MetadataSimpleValueXML = {
        "_xsi:type": "xr:DesignTimeRef",
        "#text": data.value,
      }
      return result
    }
    case "fixedArray": {
      const result: MetadataFixedArrayValueXML = {
        "_xsi:type": "v8:FixedArray",
        "v8:Value": data.value.map((v) =>
          exportMetadataValueToXML(context, v)
        ).filter((v): v is MetadataValueXML => v !== undefined),
      }
      return result
    }
    case "formChoiceListDesTimeValue": {
      const value = exportMetadataValueToXML(context, data.value)
      if (!value) return undefined
      const result: MetadataFormChoiceListDesTimeValueXML = {
        "_xsi:type": "FormChoiceListDesTimeValue",
        Value: value,
      }
      return result
    }
    default:
      return undefined
  }
}

export const exportMetadataValuesToXML = (
  context: Context,
  data: MetadataValue[] | undefined
): MetadataValueXML[] | undefined => {
  if (!data) return undefined

  return data.map((value) => exportMetadataValueToXML(context, value)!)
}
