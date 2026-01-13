import { ConfigurationContext } from "~/metadata/context/types"
import { executeImportExportOperation } from "~/metadata/metadataFactory/metadataFactory"
import { ChildItems, ChildItemsPartialEnterprise } from "./types"

export const exportTypedChildItemsToEnterprise = (
  context: ConfigurationContext,
  data: ChildItems | undefined
): ChildItemsPartialEnterprise | undefined => {
  if (!data || data.length === 0) return undefined

  const result: ChildItemsPartialEnterprise = {}
  for (const item of data) {
    const resultItem = executeImportExportOperation("ExportTypedToEnterprise", item.elementType, context, item)
    if (resultItem == undefined) throw new Error(`Export function not found for element type: ${item.elementType}`)
    result[item.name] = resultItem
  }

  return result
}

export const exportPartialChildItemsToEnterprise = (
  context: ConfigurationContext,
  data: ChildItems | undefined
): ChildItemsPartialEnterprise | undefined => {
  if (!data || data.length === 0) return undefined

  const result: ChildItemsPartialEnterprise = {}
  for (const item of data) {
    const resultItem = executeImportExportOperation("ExportPartialToEnterprise", item.elementType, context, item)
    if (resultItem == undefined) throw new Error(`Export function not found for element type: ${item.elementType}`)
    result[item.name] = resultItem
  }

  return result
}
