import { importBooleanFromXML } from "~/metadata/commonObjects/boolean/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { AutoCommandBar, AutoCommandBarXML } from "~/metadata/forms/elements/autoCommandBar/types"
import { importChildItemsFromXML } from "../../collections/childItems/importFromXML"
import { CommandBarChildItem } from "../../collections/childItems/types"
import { isHasContent } from "./helper"
import { PropertyRule } from "../calendarField/rules"

export const importAutoCommandBarFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: AutoCommandBarXML
): AutoCommandBar | undefined => {
  const autofill = importBooleanFromXML(context, undefined, xml.Autofill) ?? true
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
