import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { Context } from "~/lib/metadata/context/types"
import { importFormFieldFromXML } from "~/lib/metadata/forms/elements/formField/importFromXML"
import { HTMLDocumentField, HTMLDocumentFieldXML } from "~/lib/metadata/forms/elements/htmlDocumentField/types"
import { importEventsFromXML } from "~/lib/metadata/forms/events/importFromXML"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/lib/metadata/metadataFactory/types"

export const importHTMLDocumentFieldFromXML = (
  context: Context,
  xml: HTMLDocumentFieldXML | undefined
): HTMLDocumentField | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importFormFieldFromXML(context, xml)!,
    elementType: FormElementType.HTMLDocumentField,

    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    borderColor: importColorFromXML(context, xml.BorderColor),
    height: xml.Height,
    horizontalStretch: xml.HorizontalStretch,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    output: xml.Output,
    userAgentInformation: xml.UserAgentInformation,
    userVisible: importUserVisibleFromXML(context, xml.UserVisible),
    verticalStretch: xml.VerticalStretch,
    width: xml.Width,
    events: importEventsFromXML(context, xml.Events),
  })
}

registerMetadata("ImportFromXML", "HTMLDocumentField", importHTMLDocumentFieldFromXML)
