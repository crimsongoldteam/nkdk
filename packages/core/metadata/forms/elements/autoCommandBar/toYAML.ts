import { ConfigurationContext } from "~/metadata/context/types"
import { AutoCommandBar, AutoCommandBarEnterprise } from "~/metadata/forms/elements/autoCommandBar/types"
import { exportSingleElementToEnterprise, registerTypeRule } from "~/metadata/metadataFactory"
import { PropertyRule } from "../calendarField/rules"
import { AutoCommandBarRules } from "./rules"

export const exportAutoCommandBarToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: AutoCommandBar | undefined
): AutoCommandBarEnterprise | undefined => {
  return exportSingleElementToEnterprise(context, data, { rules: AutoCommandBarRules })
}

registerTypeRule("AutoCommandBar", "exportToEnterprise", exportAutoCommandBarToEnterprise)
registerTypeRule("TableAutoCommandBar", "exportToEnterprise", exportAutoCommandBarToEnterprise)
