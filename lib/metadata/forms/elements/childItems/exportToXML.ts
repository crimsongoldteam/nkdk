import { Context } from "~/lib/metadata/context/types"
import { getOperationFunction } from "~/lib/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/lib/metadata/metadataFactory/types"
import { ChildItems, ChildItemsXML, ChildItemXML } from "./types"

export const exportChildItemsToXML = (
  configurationSettings: Context,
  data: ChildItems | undefined
): ChildItemsXML | undefined => {
  if (!data || data.length === 0) return undefined

  const result: ChildItemsXML = []
  for (const item of data) {
    const exportFunction = getOperationFunction("ExportToXML", item.elementType)
    if (!exportFunction) throw new Error(`Export function not found for element type: ${item.elementType}`)
    const value = exportFunction(configurationSettings, item)
    result.push({ [item.elementType]: value } as Record<FormElementType, ChildItemXML>)
  }

  return result
}
