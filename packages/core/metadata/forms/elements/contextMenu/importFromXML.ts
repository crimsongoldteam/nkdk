import { ConfigurationContext } from "~/metadata/context/types"
import { ContextMenu, ContextMenuXML } from "~/metadata/forms/elements/contextMenu/types"
import { registerTypeRule } from "~/metadata/metadataFactory/typeRulesFactory"
import { PropertyRule } from "../calendarField/rules"

export function importContextMenuFromXML(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: ContextMenuXML
): ContextMenu | undefined {
  if (xml === undefined) return undefined

  const result: ContextMenu = {
    childItems: [],
  }

  if (xml._DisplayImportance !== undefined) {
    result.displayImportance = xml._DisplayImportance
  }

  if (xml.Autofill !== undefined) {
    result.autofill = xml.Autofill
  }

  return result
}

registerTypeRule("ContextMenu", "importFromXML", importContextMenuFromXML)
