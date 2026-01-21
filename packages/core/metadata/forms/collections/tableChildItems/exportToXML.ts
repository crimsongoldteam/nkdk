import { ConfigurationContext } from "~/metadata/context/types"
import { getOperationFunction } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { TableChildItemRecordXML, TableChildItems, TableChildItemsXML, TableChildItemXML } from "./types"

export const exportTableChildItemsToXML = (
  context: ConfigurationContext,
  data: TableChildItems | undefined
): TableChildItemsXML | undefined => {
  if (!data || data.length === 0) return undefined

  const result: TableChildItemRecordXML[] = []
  for (const item of data) {
    const fn = getOperationFunction("ExportToXML", item.elementType)
    if (fn == undefined) throw new Error(`ExportToXML function not found for element type: ${item.elementType}`)
    const resultItem = fn(context, item)
    result.push({ [item.elementType]: resultItem } as Record<FormElementType, TableChildItemXML>)
  }

  return result.length === 1 ? result[0] : result
}
