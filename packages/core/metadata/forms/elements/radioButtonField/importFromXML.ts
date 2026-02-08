import { ConfigurationContext } from "~/metadata/context/types"
import { RadioButtonField } from "~/metadata/forms/elements/radioButtonField/types"
import { importElementFromXML } from "~/metadata/metadataFactory"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ElementXML, ImportFromXMLFn } from "~/metadata/metadataFactory/types"
import { PropertyRule } from "../calendarField/rules"

export function importRadioButtonFieldFromXML<To extends RadioButtonField>(
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  xml: ElementXML | undefined
): To | undefined {
  return importElementFromXML<To>(context, "RadioButtonField", xml)
}

registerMetadata("ImportFromXML", "RadioButtonField", importRadioButtonFieldFromXML as ImportFromXMLFn)
