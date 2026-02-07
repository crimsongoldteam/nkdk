import { ConfigurationContext } from "~/metadata/context/types"
import { getOperationFunction } from "~/metadata/metadataFactory/metadataFactory"
import { registerTypeRule } from "~/metadata/metadataFactory/typeRulesFactory"
import { ToPreviewType } from "~/metadata/metadataFactory/types"
import { AllChildItem } from "./types"
import { PropertyRule } from "../../elements/calendarField/rules"

export const exportChildItemsToPreview = <From extends AllChildItem>(
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  data: From[] | undefined
): ToPreviewType<From>[] => {
  if (!data || data.length === 0) return []

  const result = []
  for (const item of data) {
    const fn = getOperationFunction("ExportToPreview", item.elementType)
    if (fn == undefined) throw new Error(`ExportToPreview function not found for element type: ${item.elementType}`)
    const resultItem = (fn as any)(context, rule, item)
    result.push(resultItem)
  }

  return result
}

registerTypeRule("ChildItems", "exportToPreview", exportChildItemsToPreview)
