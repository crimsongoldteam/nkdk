import { ConfigurationContext } from "~/metadata/context/types"
import { AutoCommandBar, AutoCommandBarXML } from "~/metadata/forms/elements/autoCommandBar/types"
import { sortObject } from "~/metadata/helpers/compactObject"
import { getElementId } from "~/metadata/helpers/getElementId"
import { exportButtonGroupChildItemsToXML } from "../../collections/buttonGroupChildItems/exportToXML"
import { BaseElement } from "../baseElement/types"
import { getAutoCommandBarName, isHasContent } from "./helper"

export const exportAutoCommandBarToXML = (
  context: ConfigurationContext,
  data: AutoCommandBar | undefined,
  parentElement?: BaseElement
): AutoCommandBarXML => {
  const autoCommandBar = data ?? getDefaultAutoCommandBar()

  const id = isHasContent(autoCommandBar) ? getElementId(context) : "-1"

  const result: AutoCommandBarXML = {
    _name: getAutoCommandBarName(parentElement),
    _id: id,
  }

  if (autoCommandBar.autofill !== true) result.Autofill = autoCommandBar.autofill
  if (autoCommandBar.displayImportance !== undefined) result._DisplayImportance = autoCommandBar.displayImportance
  if (autoCommandBar.horizontalAlign !== undefined) result.HorizontalAlign = autoCommandBar.horizontalAlign

  result.ChildItems = exportButtonGroupChildItemsToXML(context, autoCommandBar.childItems)

  return sortObject(result)
}

const getDefaultAutoCommandBar = (): AutoCommandBar => {
  return {
    childItems: [],
    autofill: true,
  }
}
