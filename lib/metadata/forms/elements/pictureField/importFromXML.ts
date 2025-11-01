import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importBorderFromXML } from "~/lib/metadata/commonObjects/border/importFromXML"
import { importFormFieldFromXML } from "../formField/importFromXML"
import { TPictureFieldXML, TPictureField } from "./types"
import { ZElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"

export const importPictureFieldFromXML = (xml: TPictureFieldXML | undefined): TPictureField | undefined => {
  if (!xml) return undefined

  const base = importFormFieldFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    elementType: ZElementType.enum.PictureField,
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
    valuesPicture: xml.ValuesPicture,
    verticalStretch: xml.VerticalStretch,
    width: xml.Width,
    zoomable: xml.Zoomable,
  }
}

registerImport(ZElementType.enum.PictureField, importPictureFieldFromXML)