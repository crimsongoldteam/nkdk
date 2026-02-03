import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { ContextMenu, ContextMenuEnterprise } from "~/metadata/forms/elements/contextMenu/types"
import { importSystemEnumerationFromYAML } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { importChildItemsTypedFromEnterprise } from "../../collections/childItems/importFromEnterprise"
import { PropertyRule } from "../calendarField/rules"

export function importContextMenuFromEnterprise<T extends ContextMenuEnterprise | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: T
): ContextMenu | undefined {
  if (data === undefined) return undefined

  const result: ContextMenu = {
    childItems: [],
  }

  const displayImportance = importSystemEnumerationFromYAML(
    context,
    undefined,
    data.ВажностьПриОтображении,
    SE.DisplayImportanceFromEnterprise
  )
  if (displayImportance !== undefined) result.displayImportance = displayImportance

  const autofill = importBooleanFromEnterprise(context, undefined, data.Автозаполнение)
  if (autofill !== undefined) result.autofill = autofill

  result.childItems = importChildItemsTypedFromEnterprise(context, undefined, data.ПодчиненныеЭлементы)

  return result
}
