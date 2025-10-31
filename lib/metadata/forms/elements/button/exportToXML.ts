import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportI8nTextToXML"
import { exportPictureToXML } from "~/lib/metadata/commonObjects/pictures/exportToXML"
import { exportFormDecorationToXML } from "../formDecoration/exportToXML"
import { exportBaseElementToXML } from "../baseElement/exportToXML"
import { TButtonXML, TButton } from "./types"

export const exportButtonToXML = (data: TButton | undefined): TButtonXML | undefined => {
  if (!data) return undefined

  const base = exportBaseElementToXML(data)
  if (!base) return undefined
   
  return {
    ...base,
    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    DefaultItem: data.defaultItem,
    DisplayImportance: data.displayImportance,
    VerticalAlignInGroup: data.verticalAlignInGroup,
    Type: data.type,
    Visible: data.visible,
    Height: data.height,
    TitleHeight: data.titleHeight,
    HorizontalAlignInGroup: data.horizontalAlignInGroup,
    Enabled: data.enabled,
    Title: exportI8nTextToXML(data.title),
    CommandName: data.commandName,
    Picture: exportPictureToXML(data.picture),
    DefaultButton: data.defaultButton,
    MaxHeight: data.maxHeight,
    MaxWidth: data.maxWidth,
    Representation: data.representation,
    ToolTipRepresentation: data.toolTipRepresentation,
    ShapeRepresentation: data.shapeRepresentation,
    LocationInCommandBar: data.locationInCommandBar,
    PictureLocation: data.pictureLocation,
    SkipOnInput: data.skipOnInput,
    VerticalStretch: data.verticalStretch,
    HorizontalStretch: data.horizontalStretch,
    ExtendedTooltip: exportFormDecorationToXML(data.extendedTooltip),
    Shortcut: data.shortcut,
    OnlyInAllActions: data.onlyInAllActions,
    CommandUniqueness: data.commandUniqueness,
    Shape: data.shape,
    BorderColor: exportColorToXML(data.borderColor),
    TextColor: exportColorToXML(data.textColor),
    BackColor: exportColorToXML(data.backColor),
    Width: data.width,
    Font: exportFontToXML(data.font),
  }
}