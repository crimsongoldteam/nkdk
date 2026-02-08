import { ConfigurationContext } from "~/metadata/context/types"
import { Popup } from "~/metadata/forms/elements/popup/types"
import { importElementFromXML } from "~/metadata/metadataFactory"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ElementXML, ImportFromXMLFn } from "~/metadata/metadataFactory/types"
import { PropertyRule } from "../calendarField/rules"
export function importPopupFromXML<To extends Popup>(
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  xml: ElementXML | undefined
): To | undefined {
  return importElementFromXML<To>(context, "Popup", xml)
}

registerMetadata("ImportFromXML", "Popup", importPopupFromXML as ImportFromXMLFn)
