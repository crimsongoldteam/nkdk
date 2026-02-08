import { ConfigurationContext } from "~/metadata/context/types"
import { HTMLDocumentField } from "~/metadata/forms/elements/htmlDocumentField/types"
import { importElementFromXML } from "~/metadata/metadataFactory"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ElementXML, ImportFromXMLFn } from "~/metadata/metadataFactory/types"
import { PropertyRule } from "../calendarField/rules"

export function importHTMLDocumentFieldFromXML<To extends HTMLDocumentField>(
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  xml: ElementXML | undefined
): To | undefined {
  return importElementFromXML<To>(context, "HTMLDocumentField", xml)
}

registerMetadata("ImportFromXML", "HTMLDocumentField", importHTMLDocumentFieldFromXML as ImportFromXMLFn)
