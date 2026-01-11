import { ConfigurationContext } from "~/metadata/context/types"
import { AutoCommandBar, AutoCommandBarXML } from "~/metadata/forms/elements/autoCommandBar/types"
import { sortObject } from "~/metadata/helpers/compactObject"
import { getElementId } from "~/metadata/helpers/getElementId"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { exportButtonGroupChildItemsToXML } from "../../collections/buttonGroupChildItems/exportToXML"
import { BaseElement } from "../baseElement/types"
import { getAutoCommandBarName, isHasContent } from "./helper"

export const exportAutoCommandBarToXML = (
  context: ConfigurationContext,
  data: AutoCommandBar | undefined,
  parentElement?: BaseElement
): AutoCommandBarXML => {
  const autoCommandBar = data ?? getDefaultAutoCommandBar(parentElement)

  const id = isHasContent(autoCommandBar) ? getElementId(context) : "-1"

  const result: AutoCommandBarXML = {
    _name: autoCommandBar.name,
    _id: id,
  }

  if (autoCommandBar.autofill !== true) result.Autofill = autoCommandBar.autofill
  if (autoCommandBar.displayImportance !== undefined) result._DisplayImportance = autoCommandBar.displayImportance
  if (autoCommandBar.horizontalAlign !== undefined) result.HorizontalAlign = autoCommandBar.horizontalAlign

  result.ChildItems = exportButtonGroupChildItemsToXML(context, autoCommandBar.childItems)

  return sortObject(result)
}

const getDefaultAutoCommandBar = (parentElement?: BaseElement): AutoCommandBar => {
  return {
    elementType: FormElementType.CommandBar,
    name: getAutoCommandBarName(parentElement),
    childItems: [],
    autofill: true,
  }
}
