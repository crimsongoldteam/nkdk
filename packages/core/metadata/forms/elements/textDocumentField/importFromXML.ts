import { ConfigurationContext } from "~/metadata/context/types"
import { TextDocumentField } from "~/metadata/forms/elements/textDocumentField/types"
import { importElementFromXML } from "~/metadata/metadataFactory"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ElementXML, ImportFromXMLFn } from "~/metadata/metadataFactory/types"
import { PropertyRule } from "../calendarField/rules"

export function importTextDocumentFieldFromXML<To extends TextDocumentField>(
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  xml: ElementXML | undefined
): To | undefined {
  return importElementFromXML<To>(context, "TextDocumentField", xml)
}

registerMetadata("ImportFromXML", "TextDocumentField", importTextDocumentFieldFromXML as ImportFromXMLFn)
