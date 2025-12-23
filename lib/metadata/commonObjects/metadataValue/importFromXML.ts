import { Context } from "../../context/types"
import { MetadataValue, MetadataValueXML } from "./types"

export const importMetadataValueFromXML = (
  _configurationSettings: Context,
  data: MetadataValueXML | string | undefined
): MetadataValue | undefined => {
  if (!data) return undefined

  // Если data - строка, возвращаем объект с этой строкой как значением
  if (typeof data === "string") {
    return {
      type: "",
      value: data,
    }
  }

  return {
    type: data["_xsi:type"] || "",
    value: data["#text"],
  }
}

export const importMetadataValuesFromXML = (
  configurationSettings: Context,
  data: MetadataValueXML[] | undefined
): MetadataValue[] | undefined => {
  if (!data) return undefined

  return data.map((value) => importMetadataValueFromXML(configurationSettings, value)!)
}
