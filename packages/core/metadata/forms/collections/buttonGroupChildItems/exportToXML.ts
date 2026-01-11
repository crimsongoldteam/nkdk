import { ConfigurationContext } from "~/metadata/context/types"
import { getOperationFunction } from "~/metadata/metadataFactory/metadataFactory"
import { ButtonGroupChildItemRecordXML, ButtonGroupChildItems, ButtonGroupChildItemsXML } from "./types"

export const exportButtonGroupChildItemsToXML = (
  context: ConfigurationContext,
  data: ButtonGroupChildItems | undefined
): ButtonGroupChildItemsXML | undefined => {
  if (!data || data.length === 0) return undefined

  const result: ButtonGroupChildItemRecordXML[] = []
  for (const item of data) {
    const exportFunction = getOperationFunction("ExportToXML", item.elementType)
    if (!exportFunction) throw new Error(`Export function not found for element type: ${item.elementType}`)
    const value = exportFunction(context, item)
    result.push({ [item.elementType]: value } as ButtonGroupChildItemRecordXML)
  }

  return result.length === 1 ? result[0] : result
}
