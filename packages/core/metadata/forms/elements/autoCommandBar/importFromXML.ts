import { ConfigurationContext } from "~/metadata/context/types"
import { AutoCommandBar, AutoCommandBarXML } from "~/metadata/forms/elements/autoCommandBar/types"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { importButtonGroupChildItemsFromXML } from "../../collections/buttonGroupChildItems/importFromXML"
import { BaseElement } from "../baseElement/types"
import { getAutoCommandBarName } from "./helper"

export const importAutoCommandBarFromXML = (
  context: ConfigurationContext,
  xml: AutoCommandBarXML,
  parentElement: BaseElement
): AutoCommandBar | undefined => {
  const result: AutoCommandBar = {
    elementType: FormElementType.CommandBar,
    name: getAutoCommandBarName(parentElement),
    childItems: importButtonGroupChildItemsFromXML(context, xml.ChildItems),
  }

  if (xml.Autofill !== undefined) result.autofill = xml.Autofill

  if (xml._DisplayImportance !== undefined) result.displayImportance = xml._DisplayImportance

  if (xml.HorizontalAlign !== undefined) result.horizontalAlign = xml.HorizontalAlign

  if (!isHasContent(result)) return undefined

  return result
}

const EXCLUDED_FIELDS = ["name", "id", "elementType"]

const isHasContent = (data: AutoCommandBar): boolean => {
  if (data.childItems.length != 0) return true

  const keys = Object.keys(data)
  const hasOtherFields = keys.some((key) => !EXCLUDED_FIELDS.includes(key))

  return hasOtherFields
}
