import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { ContextMenu, ContextMenuEnterprise } from "~/metadata/forms/elements/contextMenu/types"
import { importSystemEnumerationFromYAML } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { importChildItemsTypedFromEnterprise } from "../../collections/childItems/importFromEnterprise"

export function importContextMenuFromEnterprise<T extends ContextMenuEnterprise | undefined>(
  context: ConfigurationContext,
  data: T
): ContextMenu | undefined {
  if (data === undefined) return undefined

  const result: ContextMenu = {
    childItems: [],
  }

  const displayImportance = importSystemEnumerationFromYAML(
    context,
    data.ВажностьПриОтображении,
    SE.DisplayImportanceFromEnterprise
  )
  if (displayImportance !== undefined) result.displayImportance = displayImportance

  const autofill = importBooleanFromEnterprise(context, data.Автозаполнение)
  if (autofill !== undefined) result.autofill = autofill

  result.childItems = importChildItemsTypedFromEnterprise(context, data.ПодчиненныеЭлементы)

  return result
}
