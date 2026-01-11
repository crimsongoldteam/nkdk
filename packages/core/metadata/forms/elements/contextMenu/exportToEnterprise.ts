import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { ContextMenu, ContextMenuEnterprise } from "~/metadata/forms/elements/contextMenu/types"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { exportChildItemsToEnterprise } from "../../collections/childItems/exportToEnterprise"
import { ImportExportReturn } from "../types"

export function exportContextMenuToEnterprise<T extends ContextMenu | undefined>(
  context: ConfigurationContext,
  data: T
): ImportExportReturn<T, ContextMenuEnterprise> {
  if (data === undefined) return undefined as ImportExportReturn<T, ContextMenuEnterprise>

  const result: ContextMenuEnterprise = {}

  const displayImportance = exportSystemEnumerationToEnterprise(
    context,
    data.displayImportance,
    SE.DisplayImportanceToEnterprise
  )
  if (displayImportance !== undefined) result.ВажностьПриОтображении = displayImportance

  const autofill = exportBooleanToEnterprise(context, data.autofill)
  if (autofill !== undefined) result.Автозаполнение = autofill

  const childItems = exportChildItemsToEnterprise(context, data.childItems)
  if (childItems !== undefined) result.ПодчиненныеЭлементы = childItems

  return result as ImportExportReturn<T, ContextMenuEnterprise>
}
