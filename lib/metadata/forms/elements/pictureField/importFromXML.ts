import { importBorderFromXML } from "~/lib/metadata/commonObjects/border/importFromXML"
import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importPictureFromXML } from "~/lib/metadata/commonObjects/pictures/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { importFormFieldFromXML } from "~/lib/metadata/forms/elements/formField/importFromXML"
import { importEventsFromXML } from "~/lib/metadata/forms/events/importFromXML"
import { registerImport } from "~/lib/xml/import/importerFactory"
import { FormElementType } from "../types"

export const importPictureFieldFromXML = (xml: PictureFieldXML | undefined): PictureField | undefined => {
  if (!xml) return undefined

  return {
    ...importFormFieldFromXML(xml)!,
    elementType: FormElementType.PictureField,

    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    border: importBorderFromXML(xml.Border),
    borderColor: importColorFromXML(xml.BorderColor),
    enableDrag: xml.EnableDrag,
    enableStartDrag: xml.EnableStartDrag,
    fileDragMode: xml.FileDragMode,
    font: importFontFromXML(xml.Font),
    height: xml.Height,
    horizontalStretch: xml.HorizontalStretch,
    hyperlink: xml.Hyperlink,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    nonselectedPictureText: xml.NonselectedPictureText,
    pictureSize: xml.PictureSize,
    scale: xml.Scale,
    textColor: importColorFromXML(xml.TextColor),
    valuesPicture: importPictureFromXML(xml.ValuesPicture),
    verticalStretch: xml.VerticalStretch,
    width: xml.Width,
    zoomable: xml.Zoomable,
    userVisible: importUserVisibleFromXML(xml.UserVisible),
    events: importEventsFromXML(xml.Events),
  }
}

registerImport(FormElementType.PictureField, importPictureFieldFromXML)
