import { ConfigurationContext } from "~/metadata/context/types"
import { ContextMenu, ContextMenuXML } from "~/metadata/forms/elements/contextMenu/types"
import { ToXMLType } from "~/metadata/metadataFactory/types"
import { importButtonGroupChildItemsFromXML } from "../../collections/buttonGroupChildItems/importFromXML"

export function importContextMenuFromXML<To extends ContextMenu | undefined>(
  context: ConfigurationContext,
  xml: ToXMLType<To> | undefined
): To {
  if (xml === undefined) return undefined as To

  const result: ContextMenu = {
    childItems: [],
  }

  if (xml._DisplayImportance !== undefined) result.displayImportance = xml._DisplayImportance

  if (xml.Autofill !== undefined) result.autofill = xml.Autofill

  const childItems = importButtonGroupChildItemsFromXML(context, xml.ChildItems)
  if (childItems !== undefined) result.childItems = childItems

  if (!isHasContent(result)) return undefined as To

  return result as To
}

const EXCLUDED_FIELDS = ["name", "elementType", "childItems"]

const isHasContent = (data: ContextMenu | undefined): boolean => {
  if (!data) return false

  if (data.childItems.length > 0) return true

  const keys = Object.keys(data)
  const hasOtherFields = keys.some((key) => !EXCLUDED_FIELDS.includes(key))

  return hasOtherFields
}
