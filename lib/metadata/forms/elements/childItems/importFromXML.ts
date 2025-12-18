import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { ChildItems, ChildItemsXML } from "./types"

export const importChildItemsFromXML = (
  xml: ChildItemsXML | undefined,
  _configurationSettings: ConfigurationSettings
): ChildItems => {
  if (!xml) return []

  const result: ChildItems = []
  // for (const item of xml) {
  //   const importFunction = getOperationFunction("ImportFromXML", item.elementType)
  //   if (!importFunction) throw new Error(`Import function not found for element type: ${item.elementType}`)

  //   result.push(importFunction(item, _configurationSettings)!)
  // }

  return result
}
