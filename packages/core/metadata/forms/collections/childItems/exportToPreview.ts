import { ConfigurationContext } from "~/metadata/context/types"
import { getOperationFunction } from "~/metadata/metadataFactory/metadataFactory"
import { registerTypeRule } from "~/metadata/metadataFactory/typeRulesFactory"
import { ToPreviewType } from "~/metadata/metadataFactory/types"
import { AllChildItem } from "./types"

export const exportChildItemsToPreview = <From extends AllChildItem>(
  context: ConfigurationContext,
  data: From[] | undefined
): ToPreviewType<From>[] => {
  if (!data || data.length === 0) return []

  const result = []
  for (const item of data) {
    const fn = getOperationFunction("ExportToPreview", item.itemType)
    if (fn == undefined) throw new Error(`ExportToPreview function not found for element type: ${item.itemType}`)
    const resultItem = (fn as any)(context, item)
    result.push(resultItem)
  }

  return result
}

registerTypeRule("ChildItems", "exportToPreview", exportChildItemsToPreview)
