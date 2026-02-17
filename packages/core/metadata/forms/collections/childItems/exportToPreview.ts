import { ConfigurationContext } from "~/metadata/context/types"
import { AllChildItem } from "./types"

export const exportChildItemsToPreview = <From extends AllChildItem>(
  _context: ConfigurationContext,
  _data: From[] | undefined
) => {
  return undefined
  // ): ToPreviewType<From>[] => {
  //   if (!data || data.length === 0) return []
  //   const result = []
  //   for (const item of data) {
  //     const fn = getOperationFunction("ExportToPreview", item.itemType)
  //     if (fn == undefined) throw new Error(`ExportToPreview function not found for element type: ${item.itemType}`)
  //     const resultItem = (fn as any)(context, item)
  //     result.push(resultItem)
  //   }
  //   return result

  return []
}

// registerTypeRule("ChildItems", "exportToPreview", exportChildItemsToPreview)
