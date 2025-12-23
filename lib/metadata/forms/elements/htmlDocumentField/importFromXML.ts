import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { importFormFieldFromXML } from "~/lib/metadata/forms/elements/formField/importFromXML"
import { HTMLDocumentField, HTMLDocumentFieldXML } from "~/lib/metadata/forms/elements/htmlDocumentField/types"
import { importEventsFromXML } from "~/lib/metadata/forms/events/importFromXML"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/lib/metadata/metadataFactory/types"

export const importHTMLDocumentFieldFromXML = (
  configurationSettings: ConfigurationSettings, xml: HTMLDocumentFieldXML | undefined
): HTMLDocumentField | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importFormFieldFromXML(configurationSettings, xml)!,
    elementType: FormElementType.HTMLDocumentField,

    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    borderColor: importColorFromXML(configurationSettings, xml.BorderColor),
    height: xml.Height,
    horizontalStretch: xml.HorizontalStretch,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    output: xml.Output,
    userAgentInformation: xml.UserAgentInformation,
    userVisible: importUserVisibleFromXML(configurationSettings, xml.UserVisible),
    verticalStretch: xml.VerticalStretch,
    width: xml.Width,
    events: importEventsFromXML(configurationSettings, xml.Events),
  })
}

registerMetadata("ImportFromXML", "HTMLDocumentField", importHTMLDocumentFieldFromXML)
