import { importColorFromXML } from "~/packages/core/metadata/commonObjects/color/importFromXML"
import { importUserVisibleFromXML } from "~/packages/core/metadata/commonObjects/userVisible/importFromXML"
import { Context } from "~/packages/core/metadata/context/types"
import { importFormFieldFromXML } from "~/packages/core/metadata/forms/elements/formField/importFromXML"
import { PdfDocumentField, PdfDocumentFieldXML } from "~/packages/core/metadata/forms/elements/pdfDocumentField/types"
import { importEventsFromXML } from "~/packages/core/metadata/forms/events/importFromXML"
import { compactObject } from "~/packages/core/metadata/helpers/compactObject"
import { registerMetadata } from "~/packages/core/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/packages/core/metadata/metadataFactory/types"

export const importPdfDocumentFieldFromXML = (
  context: Context,
  xml: PdfDocumentFieldXML | undefined
): PdfDocumentField | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importFormFieldFromXML(context, xml)!,
    elementType: FormElementType.PdfDocumentField,

    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    borderColor: importColorFromXML(context, xml.BorderColor),
    currentPageNumber: xml.CurrentPageNumber,
    height: xml.Height,
    horizontalStretch: xml.HorizontalStretch,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    orientation: xml.Orientation,
    output: xml.Output,
    scale: xml.Scale,
    usedFileName: xml.UsedFileName,
    userVisible: importUserVisibleFromXML(context, xml.UserVisible),
    verticalStretch: xml.VerticalStretch,
    viewStatusLocation: xml.ViewStatusLocation,
    width: xml.Width,
    events: importEventsFromXML(context, xml.Events),
  })
}

registerMetadata("ImportFromXML", "PdfDocumentField", importPdfDocumentFieldFromXML)
