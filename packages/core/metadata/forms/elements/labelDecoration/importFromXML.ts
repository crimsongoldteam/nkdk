import { ConfigurationContext } from "~/metadata/context/types"
import { LabelDecoration } from "~/metadata/forms/elements/labelDecoration/types"
import { importElementFromXML } from "~/metadata/metadataFactory"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ElementXML, ImportFromXMLFn } from "~/metadata/metadataFactory/types"
import { PropertyRule } from "../calendarField/rules"

export function importLabelDecorationFromXML<To extends LabelDecoration>(
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  xml: ElementXML | undefined
): To | undefined {
  return importElementFromXML<To>(context, "HTMLDocumentField", xml)
}

registerMetadata("ImportFromXML", "LabelDecoration", importLabelDecorationFromXML as ImportFromXMLFn)
