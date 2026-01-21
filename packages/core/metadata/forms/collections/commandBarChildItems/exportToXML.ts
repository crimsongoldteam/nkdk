import { ConfigurationContext } from "~/metadata/context/types"
import { getOperationFunction } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"
import {
  CommandBarChildItemRecordXML,
  CommandBarChildItemXML,
  CommandBarChildItems,
  CommandBarChildItemsXML,
} from "./types"

export const exportCommandBarChildItemsToXML = (
  context: ConfigurationContext,
  data: CommandBarChildItems | undefined
): CommandBarChildItemsXML | undefined => {
  if (!data || data.length === 0) return undefined

  const result: CommandBarChildItemRecordXML[] = []
  for (const item of data) {
    const fn = getOperationFunction("ExportToXML", item.elementType)
    if (fn == undefined) throw new Error(`ExportToXML function not found for element type: ${item.elementType}`)
    const resultItem = fn(context, item)
    result.push({ [item.elementType]: resultItem } as Record<FormElementType, CommandBarChildItemXML>)
  }

  return result.length === 1 ? result[0] : result
}
