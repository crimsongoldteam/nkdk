import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { ContextMenu, ContextMenuEnterprise } from "~/metadata/forms/elements/contextMenu/types"
import { exportSystemEnumerationToYAML } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { exportTypedChildItemsToEnterprise } from "../../collections/childItems/exportToEnterprise"
import { PropertyRule } from "../calendarField/rules"
import { isHasContent } from "./helper"

export function exportContextMenuToEnterprise<T extends ContextMenu | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: T
): ContextMenuEnterprise | undefined {
  if (data === undefined) return undefined

  if (!isHasContent(data)) return undefined

  const result: ContextMenuEnterprise = {}

  const displayImportance = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.displayImportance,
    SE.DisplayImportanceToEnterprise
  )
  if (displayImportance !== undefined) result.ВажностьПриОтображении = displayImportance

  const autofill = exportBooleanToEnterprise(context, undefined, data.autofill)
  if (autofill !== undefined) result.Автозаполнение = autofill

  const childItems = exportTypedChildItemsToEnterprise(context, undefined, data.childItems)
  if (childItems !== undefined) result.ПодчиненныеЭлементы = childItems

  return result
}
