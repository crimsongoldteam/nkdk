import { importOldBooleanFromXML } from "~/metadata/commonObjects/boolean/_importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { AutoCommandBar, AutoCommandBarXML } from "~/metadata/forms/elements/autoCommandBar/types"
import { importChildItemsFromXML } from "../../collections/childItems/importFromXML"
import { CommandBarChildItem } from "../../collections/childItems/types"
import { isHasContent } from "./helper"

export const importAutoCommandBarFromXML = (
  context: ConfigurationContext,
  xml: AutoCommandBarXML
): AutoCommandBar | undefined => {
  const autofill = importOldBooleanFromXML(context, xml.Autofill) ?? true
  const childItems = importChildItemsFromXML<CommandBarChildItem>(context, xml.ChildItems)

  const result: AutoCommandBar = {
    childItems: childItems,
    autofill: autofill,
  }

  if (xml._DisplayImportance !== undefined) result.displayImportance = xml._DisplayImportance

  if (xml.HorizontalAlign !== undefined) result.horizontalAlign = xml.HorizontalAlign

  if (!isHasContent(result)) return undefined

  return result
}
