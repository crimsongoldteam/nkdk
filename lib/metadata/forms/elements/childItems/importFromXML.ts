import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { getOperationFunction } from "~/lib/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/lib/metadata/metadataFactory/types"
import { ChildItems, ChildItemsXML } from "./types"

export const importChildItemsFromXML = (
  configurationSettings: ConfigurationSettings,
  xml: ChildItemsXML | undefined
): ChildItems => {
  if (!xml) return []

  const result: ChildItems = []
  for (const item of xml) {
    const elementType = Object.keys(item)[0] as FormElementType
    const importFunction = getOperationFunction("ImportFromXML", elementType)
    if (!importFunction) throw new Error(`Import function not found for element type: ${elementType}`)

    result.push(importFunction(configurationSettings, item[elementType])!)
  }

  return result
}
