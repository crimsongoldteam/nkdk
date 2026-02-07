import { ConfigurationContext } from "~/metadata/context/types"
import { ContextMenu, ContextMenuEnterprise } from "~/metadata/forms/elements/contextMenu/types"
import { registerTypeRule } from "~/metadata/metadataFactory"
import { PropertyRule } from "../calendarField/rules"

export function exportContextMenuToEnterprise<T extends ContextMenu | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: T
): ContextMenuEnterprise | undefined {
  if (data === undefined) return undefined

  const result: ContextMenuEnterprise = {}

  if (data.displayImportance !== undefined) {
    result.ВажностьПриОтображении = data.displayImportance as any
  }

  if (data.autofill !== undefined) {
    result.Автозаполнение = data.autofill ? "Истина" : "Ложь"
  }

  return result
}

registerTypeRule("ContextMenu", "exportToEnterprise", exportContextMenuToEnterprise)
