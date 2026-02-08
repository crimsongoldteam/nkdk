import { ConfigurationContext } from "~/metadata/context/types"
import { FormattedDocumentField } from "~/metadata/forms/elements/formattedDocumentField/types"
import { importElementFromXML } from "~/metadata/metadataFactory"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ImportFromXMLFn } from "~/metadata/metadataFactory/types"
import { PropertyRule } from "../calendarField/rules"

export function importFormattedDocumentFieldFromXML<To extends FormattedDocumentField | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  xml: ElementXML | undefined
): To {
  return importElementFromXML<FormattedDocumentField>(context, "FormattedDocumentField", xml) as To
}

registerMetadata("ImportFromXML", "FormattedDocumentField", importFormattedDocumentFieldFromXML as ImportFromXMLFn)
