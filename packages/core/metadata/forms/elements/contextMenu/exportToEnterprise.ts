import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { ContextMenu, ContextMenuEnterprise } from "~/metadata/forms/elements/contextMenu/types"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { exportCommandBarChildItemsToEnterprise } from "../../collections/commandBarChildItems/exportToEnterprise"
import { isHasContent } from "./helper"

export function exportContextMenuToEnterprise<T extends ContextMenu | undefined>(
  context: ConfigurationContext,
  data: T
): ContextMenuEnterprise | undefined {
  if (data === undefined) return undefined

  if (!isHasContent(data)) return undefined

  const result: ContextMenuEnterprise = {}

  const displayImportance = exportSystemEnumerationToEnterprise(
    context,
    data.displayImportance,
    SE.DisplayImportanceToEnterprise
  )
  if (displayImportance !== undefined) result.ВажностьПриОтображении = displayImportance

  const autofill = exportBooleanToEnterprise(context, data.autofill)
  if (autofill !== undefined) result.Автозаполнение = autofill

  const childItems = exportCommandBarChildItemsToEnterprise(context, data.childItems)
  if (childItems !== undefined) result.ПодчиненныеЭлементы = childItems

  return result
}
