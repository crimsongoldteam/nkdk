import { ConfigurationContext } from "~/metadata/context/types"
import { getOperationFunction } from "~/metadata/metadataFactory/metadataFactory"
import { ToXMLType } from "~/metadata/metadataFactory/types"
import { AllChildItem } from "./types"

export const exportChildItemsToXML = <From extends AllChildItem>(
  context: ConfigurationContext,
  data: From[] | undefined
): Record<From["elementType"], ToXMLType<From>>[] | undefined => {
  if (!data || data.length === 0) return undefined

  const result: Record<From["elementType"], ToXMLType<From>>[] = []
  for (const item of data) {
    const exportFunction = getOperationFunction("ExportToXML", item.elementType)
    if (!exportFunction) throw new Error(`ExportToXML function not found for element type: ${item.elementType}`)
    const value = exportFunction(context, item)
    result.push({ [item.elementType]: value } as Record<From["elementType"], ToXMLType<From>>)
  }

  return result
}
