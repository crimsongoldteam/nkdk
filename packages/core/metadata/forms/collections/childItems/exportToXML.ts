import { ConfigurationContext } from "~/metadata/context/types"
import { getOperationFunction } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { AllChildItem, ChildItemXML } from "./types"

export const exportChildItemsToXML = <From extends AllChildItem>(
  context: ConfigurationContext,
  data: From[] | undefined
): Record<From["elementType"], ChildItemXML>[] | undefined => {
  if (!data || data.length === 0) return undefined

  const result: Record<From["elementType"], ChildItemXML>[] = []
  for (const item of data) {
    const exportFunction = getOperationFunction("ExportToXML", item.elementType)
    if (!exportFunction) throw new Error(`ExportToXML function not found for element type: ${item.elementType}`)
    const value = exportFunction(context, item)
    result.push({ [item.elementType]: value } as Record<FormElementType, ChildItemXML>)
  }

  return result
}
