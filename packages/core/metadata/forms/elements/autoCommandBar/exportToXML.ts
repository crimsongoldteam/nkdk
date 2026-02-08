import { ConfigurationContext } from "~/metadata/context/types"
import { AutoCommandBar } from "~/metadata/forms/elements/autoCommandBar/types"
import { getElementId } from "~/metadata/helpers/getElementId"
import { exportSingleElementToXML, PropertyRule, registerTypeRule } from "~/metadata/metadataFactory"
import { getAutoCommandBarName } from "./helper"
import { AutoCommandBarRules } from "./rules"

export const exportFormAutoCommandBarToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  element: AutoCommandBar | undefined
): any => {
  return exportAutoCommandBarPropsToXML({
    context,
    element,
    name: "ФормаКоманднаяПанель",
    id: "-1",
  })
}

export const exportTableAutoCommandBarToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  element: AutoCommandBar | undefined
): any => {
  const table = context.elementContext!
  const id = getElementId(context)
  const name = getAutoCommandBarName(table)
  return exportAutoCommandBarPropsToXML({
    context,
    element,
    name,
    id,
  })
}

const exportAutoCommandBarPropsToXML = (params: {
  context: ConfigurationContext
  element: AutoCommandBar | undefined
  name: string
  id: string
}): any => {
  const { context, element, name, id } = params

  const autoCommandBar = element ?? getDefaultAutoCommandBar()

  return exportSingleElementToXML({
    context,
    element: autoCommandBar,
    rule: AutoCommandBarRules,
    id,
    name,
  })!
}

const getDefaultAutoCommandBar = (): AutoCommandBar => {
  return {
    elementType: "AutoCommandBar",
    childItems: [],
    autofill: true,
  }
}

registerTypeRule("AutoCommandBar", "exportToEnterprise", exportFormAutoCommandBarToXML)
registerTypeRule("TableAutoCommandBar", "exportToEnterprise", exportTableAutoCommandBarToXML)
