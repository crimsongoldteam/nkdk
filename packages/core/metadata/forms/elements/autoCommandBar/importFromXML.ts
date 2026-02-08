import { ConfigurationContext } from "~/metadata/context/types"
import { AutoCommandBar } from "~/metadata/forms/elements/autoCommandBar/types"
import { ElementXML, importSingleElementFromXML, registerTypeRule } from "~/metadata/metadataFactory"
import { PropertyRule } from "../calendarField/rules"

export const importAutoCommandBarFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  xml: ElementXML
): AutoCommandBar | undefined => {
  return importSingleElementFromXML(context, "AutoCommandBar", xml)
}

registerTypeRule("AutoCommandBar", "importFromEnterprise", importAutoCommandBarFromXML)
registerTypeRule("TableAutoCommandBar", "importFromEnterprise", importAutoCommandBarFromXML)
