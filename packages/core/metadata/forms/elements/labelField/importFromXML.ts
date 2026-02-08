import { ConfigurationContext } from "~/metadata/context/types"
import { LabelField } from "~/metadata/forms/elements/labelField/types"
import { importElementFromXML } from "~/metadata/metadataFactory"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ElementXML, ImportFromXMLFn } from "~/metadata/metadataFactory/types"
import { PropertyRule } from "../calendarField/rules"

export function importLabelFieldFromXML<To extends LabelField>(
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  xml: ElementXML | undefined
): To | undefined {
  return importElementFromXML<To>(context, "LabelField", xml)
}

registerMetadata("ImportFromXML", "LabelField", importLabelFieldFromXML as ImportFromXMLFn)
