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
    defaultItem: xml.DefaultItem,
    displayImportance: xml.DisplayImportance,
    verticalAlignInGroup: xml.VerticalAlignInGroup,
    type: xml.Type,
    visible: xml.Visible,
    height: xml.Height,
    titleHeight: xml.TitleHeight,
    horizontalAlignInGroup: xml.HorizontalAlignInGroup,
    enabled: xml.Enabled,
    title: importI8nTextFromXML(xml.Title),
    commandName: xml.CommandName,
    picture: importPictureFromXML(xml.Picture),
    defaultButton: xml.DefaultButton,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    representation: xml.Representation,
    toolTipRepresentation: xml.ToolTipRepresentation,
    shapeRepresentation: xml.ShapeRepresentation,
    locationInCommandBar: xml.LocationInCommandBar,
    pictureLocation: xml.PictureLocation,
    skipOnInput: xml.SkipOnInput,
    verticalStretch: xml.VerticalStretch,
    horizontalStretch: xml.HorizontalStretch,
    extendedTooltip: importFormDecorationFromXML(xml.ExtendedTooltip),
    shortcut: xml.Shortcut,
    onlyInAllActions: xml.OnlyInAllActions,
    commandUniqueness: xml.CommandUniqueness,
    shape: xml.Shape,
    borderColor: importColorFromXML(xml.BorderColor),
    textColor: importColorFromXML(xml.TextColor),
    backColor: importColorFromXML(xml.BackColor),
    width: xml.Width,
    font: importFontFromXML(xml.Font),
  }
}

registerImport(ZElementType.enum.Button, importButtonFromXML)