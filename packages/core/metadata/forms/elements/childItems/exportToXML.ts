import { Context } from "~/packages/core/metadata/context/types"
import { getOperationFunction } from "~/packages/core/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/packages/core/metadata/metadataFactory/types"
import { ChildItems, ChildItemsXML, ChildItemXML } from "./types"

export const exportChildItemsToXML = (context: Context, data: ChildItems | undefined): ChildItemsXML | undefined => {
  if (!data || data.length === 0) return undefined

  const result: ChildItemsXML = []
  for (const item of data) {
    const exportFunction = getOperationFunction("ExportToXML", item.elementType)
    if (!exportFunction) throw new Error(`Export function not found for element type: ${item.elementType}`)
    const value = exportFunction(context, item)
    result.push({ [item.elementType]: value } as Record<FormElementType, ChildItemXML>)
  }

  return result
}
