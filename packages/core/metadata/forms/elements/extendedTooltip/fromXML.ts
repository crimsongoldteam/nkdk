import { ConfigurationContext } from "~/metadata/context/types"
import { ElementXML, FormElementType, importSingleElementFromXML, registerTypeRule } from "~/metadata/metadataFactory"
import { ExtendedTooltipRules, PropertyRule } from "./rules"
import { ExtendedTooltip } from "./types"

export const importExtendedTooltipFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  xml: ElementXML
): ExtendedTooltip | undefined => {
  return importSingleElementFromXML({
    context,
    elementType: FormElementType.ExtendedTooltip,
    rule: ExtendedTooltipRules,
    xml,
  })
}

registerTypeRule("ExtendedTooltip", "importFromXML", importExtendedTooltipFromXML)
