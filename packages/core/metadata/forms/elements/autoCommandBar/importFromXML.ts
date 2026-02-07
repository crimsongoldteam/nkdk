import { ConfigurationContext } from "~/metadata/context/types"
import { AutoCommandBar } from "~/metadata/forms/elements/autoCommandBar/types"
import { importElementFromXML, registerTypeRule } from "~/metadata/metadataFactory"
import { PropertyRule } from "../calendarField/rules"

export const importAutoCommandBarFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  xml: any
): AutoCommandBar | undefined => {
  return importElementFromXML(context, "AutoCommandBar", xml)
}

registerTypeRule("AutoCommandBar", "importFromEnterprise", importAutoCommandBarFromXML)
registerTypeRule("TableAutoCommandBar", "importFromEnterprise", importAutoCommandBarFromXML)
