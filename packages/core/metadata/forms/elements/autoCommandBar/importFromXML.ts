import { importBooleanFromXML } from "~/metadata/commonObjects/boolean/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { AutoCommandBar, AutoCommandBarXML } from "~/metadata/forms/elements/autoCommandBar/types"
import { importCommandBarChildItemsFromXML } from "../../collections/commandBarChildItems/importFromXML"
import { isHasContent } from "./helper"

export const importAutoCommandBarFromXML = (
  context: ConfigurationContext,
  xml: AutoCommandBarXML
): AutoCommandBar | undefined => {
  const autofill = importBooleanFromXML(context, xml.Autofill) ?? true
  const childItems = importCommandBarChildItemsFromXML(context, xml.ChildItems)

  const result: AutoCommandBar = {
    childItems: childItems,
    autofill: autofill,
  }

  if (xml._DisplayImportance !== undefined) result.displayImportance = xml._DisplayImportance

  if (xml.HorizontalAlign !== undefined) result.horizontalAlign = xml.HorizontalAlign

  if (!isHasContent(result)) return undefined

  return result
}
