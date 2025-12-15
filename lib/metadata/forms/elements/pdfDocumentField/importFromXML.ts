import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { importFormFieldFromXML } from "~/lib/metadata/forms/elements/formField/importFromXML"
import { importEventsFromXML } from "~/lib/metadata/forms/events/importFromXML"
import { registerImport } from "~/lib/xml/import/importerFactory"
import { FormElementType } from "../types"

export const importPdfDocumentFieldFromXML = (xml: PdfDocumentFieldXML | undefined): PdfDocumentField | undefined => {
  if (!xml) return undefined

  return {
    ...importFormFieldFromXML(xml)!,
    elementType: FormElementType.PdfDocumentField,

    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    borderColor: importColorFromXML(xml.BorderColor),
    currentPageNumber: xml.CurrentPageNumber,
    height: xml.Height,
    horizontalStretch: xml.HorizontalStretch,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    orientation: xml.Orientation,
    output: xml.Output,
    scale: xml.Scale,
    usedFileName: xml.UsedFileName,
    verticalStretch: xml.VerticalStretch,
    viewStatusLocation: xml.ViewStatusLocation,
    width: xml.Width,
    userVisible: importUserVisibleFromXML(xml.UserVisible),
    events: importEventsFromXML(xml.Events),
  }
}

registerImport(FormElementType.PdfDocumentField, importPdfDocumentFieldFromXML)
