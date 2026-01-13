import { ConfigurationContext } from "~/metadata/context/types"
import { getOperationFunction } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"
import {
  ButtonGroupChildItemRecordXML,
  ButtonGroupChildItems,
  ButtonGroupChildItemsXML,
  ButtonGroupChildItemXML,
} from "./types"

export const exportButtonGroupChildItemsToXML = (
  context: ConfigurationContext,
  data: ButtonGroupChildItems | undefined
): ButtonGroupChildItemsXML | undefined => {
  if (!data || data.length === 0) return undefined

  const result: ButtonGroupChildItemRecordXML[] = []
  for (const item of data) {
    const fn = getOperationFunction("ExportToXML", item.elementType)
    if (fn == undefined) throw new Error(`Export function not found for element type: ${item.elementType}`)
    const resultItem = fn(context, item)
    result.push({ [item.elementType]: resultItem } as Record<FormElementType, ButtonGroupChildItemXML>)
  }

  return result.length === 1 ? result[0] : result
}
