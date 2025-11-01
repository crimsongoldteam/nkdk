import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importI8nTextFromXML"
import { importPictureFromXML } from "~/lib/metadata/commonObjects/pictures/importFromXML"
import { importFormDecorationFromXML } from "../formDecoration/importFromXML"
import { importBaseElementFromXML } from "../baseElement/importFromXML"
import { TButtonXML, TButton } from "./types"
import { ZElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"

export const importButtonFromXML = (xml: TButtonXML | undefined): TButton | undefined => {
  if (!xml) return undefined

  const base = importBaseElementFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    elementType: ZElementType.enum.Button,
    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    backColor: importColorFromXML(xml.BackColor),
    borderColor: importColorFromXML(xml.BorderColor),
    commandName: xml.CommandName,
    commandUniqueness: xml.CommandUniqueness,
    defaultButton: xml.DefaultButton,
    defaultItem: xml.DefaultItem,
    displayImportance: xml.DisplayImportance,
    enabled: xml.Enabled,
    extendedTooltip: importFormDecorationFromXML(xml.ExtendedTooltip),
    font: importFontFromXML(xml.Font),
    height: xml.Height,
    horizontalAlignInGroup: xml.HorizontalAlignInGroup,
    horizontalStretch: xml.HorizontalStretch,
    locationInCommandBar: xml.LocationInCommandBar,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    onlyInAllActions: xml.OnlyInAllActions,
    picture: importPictureFromXML(xml.Picture),
    pictureLocation: xml.PictureLocation,
    representation: xml.Representation,
    shape: xml.Shape,
    shapeRepresentation: xml.ShapeRepresentation,
    shortcut: xml.Shortcut,
    skipOnInput: xml.SkipOnInput,
    textColor: importColorFromXML(xml.TextColor),
    title: importI8nTextFromXML(xml.Title),
    titleHeight: xml.TitleHeight,
    toolTipRepresentation: xml.ToolTipRepresentation,
    type: xml.Type,
    verticalAlignInGroup: xml.VerticalAlignInGroup,
    verticalStretch: xml.VerticalStretch,
    visible: xml.Visible,
    width: xml.Width,
  }
}

registerImport(ZElementType.enum.Button, importButtonFromXML)