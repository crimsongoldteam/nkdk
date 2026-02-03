import { ConfigurationContext } from "~/metadata/context/types"
import { AutoCommandBar, AutoCommandBarXML } from "~/metadata/forms/elements/autoCommandBar/types"
import { sortObject } from "~/metadata/helpers/compactObject"
import { getElementId } from "~/metadata/helpers/getElementId"
import { exportChildItemsToXML } from "../../collections/childItems/exportToXML"
import { NamedElement } from "../baseElement/types"
import { getAutoCommandBarName } from "./helper"
import { PropertyRule } from "../calendarField/rules"

export const exportFormAutoCommandBarToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: AutoCommandBar | undefined
): AutoCommandBarXML => {
  return exportAutoCommandBarPropsToXML(context, undefined, data, "ФормаКоманднаяПанель", "-1")
}

export const exportTableAutoCommandBarToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: AutoCommandBar | undefined,
  parentElement: NamedElement
): AutoCommandBarXML => {
  const id = getElementId(context)
  const name = getAutoCommandBarName(parentElement)
  return exportAutoCommandBarPropsToXML(context, undefined, data, name, id)
}

const exportAutoCommandBarPropsToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: AutoCommandBar | undefined,
  name: string,
  id: string
): AutoCommandBarXML => {
  const autoCommandBar = data ?? getDefaultAutoCommandBar()

  const result: AutoCommandBarXML = {
    _name: name,
    _id: id,
  }

  if (autoCommandBar.autofill !== true) result.Autofill = autoCommandBar.autofill
  if (autoCommandBar.displayImportance !== undefined) result._DisplayImportance = autoCommandBar.displayImportance
  if (autoCommandBar.horizontalAlign !== undefined) result.HorizontalAlign = autoCommandBar.horizontalAlign

  result.ChildItems = exportChildItemsToXML(context, undefined, autoCommandBar.childItems)

  return sortObject(result)
}

const getDefaultAutoCommandBar = (): AutoCommandBar => {
  return {
    childItems: [],
    autofill: true,
  }
}
