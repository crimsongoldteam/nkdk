import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { getOperationFunction } from "~/lib/metadata/metadataFactory/metadataFactory"
import { ChildItems, ChildItemsEnterprise } from "./types"

export const exportChildItemsToEnterprise = (
  data: ChildItems | undefined,
  configurationSettings: ConfigurationSettings
): ChildItemsEnterprise | undefined => {
  if (!data || data.length === 0) return undefined

  const result: ChildItemsEnterprise = []
  for (const item of data) {
    const exportFunction = getOperationFunction("ExportToEnterprise", item.elementType)
    if (!exportFunction) throw new Error(`Export function not found for element type: ${item.elementType}`)

    result.push(exportFunction(item, configurationSettings)!)
  }

  return result
}
