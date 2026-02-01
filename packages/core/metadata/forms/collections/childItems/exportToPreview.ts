import { ConfigurationContext } from "~/metadata/context/types"
import { getOperationFunction } from "~/metadata/metadataFactory/metadataFactory"
import { ToPreviewType } from "~/metadata/metadataFactory/types"
import { AllChildItem } from "./types"

export const exportChildItemsToPreview = <From extends AllChildItem>(
  context: ConfigurationContext,
  data: From[] | undefined
): NonNullable<ToPreviewType<From>>[] => {
  if (!data || data.length === 0) return []

  const result = []
  for (const item of data) {
    const fn = getOperationFunction("ExportToPreview", item.elementType)
    if (fn == undefined) throw new Error(`ExportToPreview function not found for element type: ${item.elementType}`)
    const resultItem = fn(context, item)
    result.push(resultItem)
  }

  return result
}
