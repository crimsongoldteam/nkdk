import { importBorderFromXML } from "~/lib/metadata/commonObjects/border/importFromXML"
import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importFromXML"
import { importPictureFromXML } from "~/lib/metadata/commonObjects/pictures/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { importEventsFromXML } from "~/lib/metadata/forms/events/importFromXML"
import { registerImport } from "~/lib/xml/import/importerFactory"
import { importCommandBarFromXML } from "../commandBar/importFromXML"
import { importFormDecorationFromXML } from "../formDecoration/importFromXML"
import { FormElementType } from "../types"
import { PictureDecoration, PictureDecorationXML } from "./types"

export const importPictureDecorationFromXML = (xml: PictureDecorationXML | undefined): PictureDecoration | undefined => {
  if (!xml) return undefined
   
  return {
...importFormDecorationFromXML(xml)!,
elementType: FormElementType.PictureDecoration,

    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    contextMenu: importCommandBarFromXML(xml.ContextMenu),
    displayImportance: xml._DisplayImportance,
    enabled: xml.Enabled,
    extendedTooltip: importFormDecorationFromXML(xml.ExtendedTooltip),
    font: importFontFromXML(xml.Font),
    height: xml.Height,
    horizontalAlignInGroup: xml.HorizontalAlignInGroup,
    horizontalStretch: xml.HorizontalStretch,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    shortcut: xml.Shortcut,
    skipOnInput: xml.SkipOnInput,
    textColor: importColorFromXML(xml.TextColor),
    title: importI8nTextFromXML(xml.Title),
    toolTip: importI8nTextFromXML(xml.ToolTip),
    toolTipRepresentation: xml.ToolTipRepresentation,
    type: xml.Type,
    userVisible: importUserVisibleFromXML(xml.UserVisible),
    verticalAlignInGroup: xml.VerticalAlignInGroup,
    verticalStretch: xml.VerticalStretch,
    visible: xml.Visible,
    width: xml.Width,
    border: importBorderFromXML(xml.Border),
    borderColor: importColorFromXML(xml.BorderColor),
    enableDrag: xml.EnableDrag,
    enableStartDrag: xml.EnableStartDrag,
    fileDragMode: xml.FileDragMode,
    hyperlink: xml.Hyperlink,
    nonselectedPictureText: xml.NonselectedPictureText,
    picture: importPictureFromXML(xml.Picture),
    pictureSize: xml.PictureSize,
    scale: xml.Scale,
    zoomable: xml.Zoomable,
    events: importEventsFromXML(xml.Events),
  }
}

registerImport(FormElementType.PictureDecoration, importPictureDecorationFromXML)