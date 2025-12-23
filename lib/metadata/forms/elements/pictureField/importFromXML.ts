import { importBorderFromXML } from "~/lib/metadata/commonObjects/border/importFromXML"
import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importPictureFromXML } from "~/lib/metadata/commonObjects/pictures/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { Context } from "~/lib/metadata/context/types"
import { importFormFieldFromXML } from "~/lib/metadata/forms/elements/formField/importFromXML"
import { PictureField, PictureFieldXML } from "~/lib/metadata/forms/elements/pictureField/types"
import { importEventsFromXML } from "~/lib/metadata/forms/events/importFromXML"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/lib/metadata/metadataFactory/types"

export const importPictureFieldFromXML = (
  context: Context,
  xml: PictureFieldXML | undefined
): PictureField | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importFormFieldFromXML(context, xml)!,
    elementType: FormElementType.PictureField,

    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    border: importBorderFromXML(context, xml.Border),
    borderColor: importColorFromXML(context, xml.BorderColor),
    enableDrag: xml.EnableDrag,
    enableStartDrag: xml.EnableStartDrag,
    fileDragMode: xml.FileDragMode,
    font: importFontFromXML(context, xml.Font),
    height: xml.Height,
    horizontalStretch: xml.HorizontalStretch,
    hyperlink: xml.Hyperlink,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    nonselectedPictureText: xml.NonselectedPictureText,
    pictureSize: xml.PictureSize,
    scale: xml.Scale,
    textColor: importColorFromXML(context, xml.TextColor),
    userVisible: importUserVisibleFromXML(context, xml.UserVisible),
    valuesPicture: importPictureFromXML(context, xml.ValuesPicture),
    verticalStretch: xml.VerticalStretch,
    width: xml.Width,
    zoomable: xml.Zoomable,
    events: importEventsFromXML(context, xml.Events),
  })
}

registerMetadata("ImportFromXML", "PictureField", importPictureFieldFromXML)
