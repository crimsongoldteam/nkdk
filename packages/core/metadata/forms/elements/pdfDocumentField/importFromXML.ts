import { ConfigurationContext } from "~/metadata/context/types"
import { PdfDocumentField } from "~/metadata/forms/elements/pdfDocumentField/types"
import { importElementFromXML } from "~/metadata/metadataFactory"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ElementXML, ImportFromXMLFn } from "~/metadata/metadataFactory/types"
import { PropertyRule } from "../calendarField/rules"

export function importPdfDocumentFieldFromXML<To extends PdfDocumentField>(
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  xml: ElementXML | undefined
): To | undefined {
  return importElementFromXML<To>(context, "PDFDocumentField", xml)
}

registerMetadata("ImportFromXML", "PDFDocumentField", importPdfDocumentFieldFromXML as ImportFromXMLFn)
