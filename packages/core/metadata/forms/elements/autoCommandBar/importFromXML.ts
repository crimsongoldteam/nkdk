import { importBooleanFromXML } from "~/metadata/commonObjects/boolean/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { AutoCommandBar, AutoCommandBarXML } from "~/metadata/forms/elements/autoCommandBar/types"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { importButtonGroupChildItemsFromXML } from "../../collections/buttonGroupChildItems/importFromXML"
import { BaseElement } from "../baseElement/types"
import { getAutoCommandBarName, isHasContent } from "./helper"

export const importAutoCommandBarFromXML = (
  context: ConfigurationContext,
  xml: AutoCommandBarXML,
  parentElement: BaseElement
): AutoCommandBar | undefined => {
  const autofill = importBooleanFromXML(context, xml.Autofill) ?? true
  const childItems = importButtonGroupChildItemsFromXML(context, xml.ChildItems)
  const name = getAutoCommandBarName(parentElement)

  const result: AutoCommandBar = {
    elementType: FormElementType.CommandBar,
    name: name,
    childItems: childItems,
    autofill: autofill,
  }

  if (xml._DisplayImportance !== undefined) result.displayImportance = xml._DisplayImportance

  if (xml.HorizontalAlign !== undefined) result.horizontalAlign = xml.HorizontalAlign

  if (!isHasContent(result)) return undefined

  return result
}
