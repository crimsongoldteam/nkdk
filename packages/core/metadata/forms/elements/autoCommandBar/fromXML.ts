import { ConfigurationContext } from "~/metadata/context/types"
import { AutoCommandBar } from "~/metadata/forms/elements/autoCommandBar/types"
import { ElementXML, importSingleElementFromXML, registerTypeRule } from "~/metadata/metadataFactory"
import { PropertyRule } from "../calendarField/rules"
import { AutoCommandBarRules } from "./rules"

export const importAutoCommandBarFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  xml: ElementXML
): AutoCommandBar | undefined => {
  return importSingleElementFromXML({
    context,
    elementType: "AutoCommandBar",
    rule: AutoCommandBarRules,
    xml,
  })
}

registerTypeRule("AutoCommandBar", "importFromXML", importAutoCommandBarFromXML)
registerTypeRule("TableAutoCommandBar", "importFromXML", importAutoCommandBarFromXML)
