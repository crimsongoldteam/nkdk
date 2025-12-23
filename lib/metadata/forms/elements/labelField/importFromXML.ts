import { importBorderFromXML } from "~/lib/metadata/commonObjects/border/importFromXML"
import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { importFormFieldFromXML } from "~/lib/metadata/forms/elements/formField/importFromXML"
import { LabelField, LabelFieldXML } from "~/lib/metadata/forms/elements/labelField/types"
import { importEventsFromXML } from "~/lib/metadata/forms/events/importFromXML"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/lib/metadata/metadataFactory/types"

export const importLabelFieldFromXML = (
  configurationSettings: ConfigurationSettings, xml: LabelFieldXML | undefined
): LabelField | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importFormFieldFromXML(configurationSettings, xml)!,
    elementType: FormElementType.LabelField,

    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    backColor: importColorFromXML(configurationSettings, xml.BackColor),
    border: importBorderFromXML(configurationSettings, xml.Border),
    borderColor: importColorFromXML(configurationSettings, xml.BorderColor),
    font: importFontFromXML(configurationSettings, xml.Font),
    format: importI8nTextFromXML(configurationSettings, xml.Format),
    height: xml.Height,
    horizontalStretch: xml.HorizontalStretch,
    hyperlink: xml.Hyperlink,
    markNegatives: xml.MarkNegatives,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    passwordMode: xml.PasswordMode,
    textColor: importColorFromXML(configurationSettings, xml.TextColor),
    userVisible: importUserVisibleFromXML(configurationSettings, xml.UserVisible),
    verticalStretch: xml.VerticalStretch,
    width: xml.Width,
    events: importEventsFromXML(configurationSettings, xml.Events),
  })
}

registerMetadata("ImportFromXML", "LabelField", importLabelFieldFromXML)
