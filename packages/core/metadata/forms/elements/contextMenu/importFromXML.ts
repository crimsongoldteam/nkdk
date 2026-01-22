import { ConfigurationContext } from "~/metadata/context/types"
import { ContextMenu, ContextMenuXML } from "~/metadata/forms/elements/contextMenu/types"
import { importChildItemsFromXML } from "../../collections/childItems/importFromXML"

export function importContextMenuFromXML(context: ConfigurationContext, xml: ContextMenuXML): ContextMenu | undefined {
  if (xml === undefined) return undefined

  const result: ContextMenu = {
    childItems: [],
  }

  if (xml._DisplayImportance !== undefined) result.displayImportance = xml._DisplayImportance

  if (xml.Autofill !== undefined) result.autofill = xml.Autofill

  result.childItems = importChildItemsFromXML(context, xml.ChildItems)

  if (!isHasContent(result)) return undefined

  return result
}

const EXCLUDED_FIELDS = ["name", "elementType", "childItems"]

const isHasContent = (data: ContextMenu | undefined): boolean => {
  if (!data) return false

  if (data.childItems.length > 0) return true

  const keys = Object.keys(data)
  const hasOtherFields = keys.some((key) => !EXCLUDED_FIELDS.includes(key))

  return hasOtherFields
}
