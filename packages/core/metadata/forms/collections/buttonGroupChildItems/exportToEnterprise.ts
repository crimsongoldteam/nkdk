import { ConfigurationContext } from "~/metadata/context/types"
import { executeImportExportOperation } from "~/metadata/metadataFactory/metadataFactory"
import { ButtonGroupChildItems, ButtonGroupChildItemsEnterprise } from "./types"

export const exportButtonGroupChildItemsToEnterprise = (
  context: ConfigurationContext,
  data: ButtonGroupChildItems | undefined
): ButtonGroupChildItemsEnterprise | undefined => {
  if (!data || data.length === 0) return undefined

  const result: ButtonGroupChildItemsEnterprise = {}
  for (const item of data) {
    const resultItem = executeImportExportOperation("ExportTypedToEnterprise", item.elementType, context, item)
    if (resultItem == undefined) throw new Error(`Export function not found for element type: ${item.elementType}`)
    result[item.name] = resultItem
  }

  return result
}
