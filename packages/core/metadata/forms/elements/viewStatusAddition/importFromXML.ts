import { ConfigurationContext } from "~/metadata/context/types"
import { ViewStatusAddition } from "~/metadata/forms/elements/viewStatusAddition/types"
import { ElementXML, importSingleElementFromXML } from "~/metadata/metadataFactory"
import { PropertyRule } from "../calendarField/rules"

export const importViewStatusAdditionFromXML = <To extends ViewStatusAddition>(
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  xml: ElementXML
): To | undefined => {
  return importSingleElementFromXML<To>(context, "ViewStatusAddition", xml)
}
