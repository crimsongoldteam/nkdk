import { ConfigurationContext } from "~/metadata/context/types"
import { ContextMenu, ContextMenuEnterprise } from "~/metadata/forms/elements/contextMenu/types"
import { registerTypeRule } from "~/metadata/metadataFactory"
import { importChildItemsTypedFromEnterprise } from "../../collections/childItems/importFromEnterprise"
import { PropertyRule } from "../calendarField/rules"

export function importContextMenuFromEnterprise<T extends ContextMenuEnterprise | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: T
): ContextMenu | undefined {
  if (data === undefined) return undefined

  const result: ContextMenu = {
    childItems: [],
  }

  if (data.ВажностьПриОтображении !== undefined) {
    result.displayImportance = data.ВажностьПриОтображении as any
  }

  if (data.Автозаполнение !== undefined) {
    result.autofill = data.Автозаполнение === "Истина"
  }

  result.childItems = importChildItemsTypedFromEnterprise(context, undefined, data.ПодчиненныеЭлементы)

  return result
}

registerTypeRule("ContextMenu", "importFromXML", importContextMenuFromEnterprise)
