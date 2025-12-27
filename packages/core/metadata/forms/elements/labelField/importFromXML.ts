import { importBorderFromXML } from "~/metadata/commonObjects/border/importFromXML"
import { importColorFromXML } from "~/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/metadata/commonObjects/font/importFromXML"
import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { Context } from "~/metadata/context/types"
import { importFormFieldFromXML } from "~/metadata/forms/elements/formField/importFromXML"
import { LabelField, LabelFieldXML } from "~/metadata/forms/elements/labelField/types"
import { importEventsFromXML } from "~/metadata/forms/events/importFromXML"
import { compactObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const importLabelFieldFromXML = (context: Context, xml: LabelFieldXML | undefined): LabelField | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importFormFieldFromXML(context, xml)!,
    elementType: FormElementType.LabelField,

    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    backColor: importColorFromXML(context, xml.BackColor),
    border: importBorderFromXML(context, xml.Border),
    borderColor: importColorFromXML(context, xml.BorderColor),
    font: importFontFromXML(context, xml.Font),
    format: importI8nTextFromXML(context, xml.Format),
    height: xml.Height,
    horizontalStretch: xml.HorizontalStretch,
    hyperlink: xml.Hyperlink,
    markNegatives: xml.MarkNegatives,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    passwordMode: xml.PasswordMode,
    textColor: importColorFromXML(context, xml.TextColor),
    userVisible: importUserVisibleFromXML(context, xml.UserVisible),
    verticalStretch: xml.VerticalStretch,
    width: xml.Width,
    events: importEventsFromXML(context, xml.Events),
  })
}

registerMetadata("ImportFromXML", "LabelField", importLabelFieldFromXML)
