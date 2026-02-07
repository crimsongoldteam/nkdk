import { ConfigurationContext } from "~/metadata/context/types"
import { AutoCommandBar } from "~/metadata/forms/elements/autoCommandBar/types"
import { getElementId } from "~/metadata/helpers/getElementId"
import { exportSingleElementToXML, PropertyRule, registerTypeRule } from "~/metadata/metadataFactory"
import { getAutoCommandBarName } from "./helper"
import { AutoCommandBarRules } from "./rules"

export const exportFormAutoCommandBarToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: AutoCommandBar | undefined
): any => {
  return exportAutoCommandBarPropsToXML(context, data, "ФормаКоманднаяПанель", "-1")
}

export const exportTableAutoCommandBarToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: AutoCommandBar | undefined
): any => {
  const table = context.elementContext!
  const id = getElementId(context)
  const name = getAutoCommandBarName(table)
  return exportAutoCommandBarPropsToXML(context, data, name, id)
}

const exportAutoCommandBarPropsToXML = (
  context: ConfigurationContext,
  data: AutoCommandBar | undefined,
  name: string,
  id: string
): any => {
  const autoCommandBar = data ?? getDefaultAutoCommandBar()

  return exportSingleElementToXML(context, autoCommandBar, {
    rule: AutoCommandBarRules,
    id: id,
    name: name,
  })!
}

const getDefaultAutoCommandBar = (): AutoCommandBar => {
  return {
    elementType: "AutoCommandBar",
    childItems: [],
    autofill: true,
  }
}

registerTypeRule("AutoCommandBar", "exportToEnterprise", exportFormAutoCommandBarToXML as any)
registerTypeRule("TableAutoCommandBar", "exportToEnterprise", exportTableAutoCommandBarToXML as any)
