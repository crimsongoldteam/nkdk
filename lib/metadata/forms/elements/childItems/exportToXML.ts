import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { getOperationFunction } from "~/lib/metadata/metadataFactory/metadataFactory"
import { ChildItems, ChildItemsXML } from "./types"

export const exportChildItemsToXML = (
  data: ChildItems | undefined,
  configurationSettings: ConfigurationSettings
): ChildItemsXML | undefined => {
  if (!data || data.length === 0) return undefined

  const result: ChildItemsXML = []
  for (const item of data) {
    const exportFunction = getOperationFunction("ExportToXML", item.elementType)
    if (!exportFunction) throw new Error(`Export function not found for element type: ${item.elementType}`)

    result.push({ [item.elementType]: exportFunction(item, configurationSettings) })
  }

  return result
}
