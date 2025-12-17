import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportToXML"
import { exportPictureToXML } from "~/lib/metadata/commonObjects/pictures/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { exportBaseElementToXML } from "~/lib/metadata/forms/elements/baseElement/exportToXML"
import { Button, ButtonXML } from "~/lib/metadata/forms/elements/button/types"
import { exportFormDecorationToXML } from "~/lib/metadata/forms/elements/formDecoration/exportToXML"
import { FormElementType } from "~/lib/metadata/forms/elements/types"
import { registerExport } from "~/lib/xml/export/exporterFactory"

export const exportButtonToXML = (data: Button | undefined): ButtonXML | undefined => {
  if (!data) return undefined

  return {
    ...exportBaseElementToXML(data)!,

    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    BackColor: exportColorToXML(data.backColor),
    BorderColor: exportColorToXML(data.borderColor),
    CommandName: data.commandName,
    CommandUniqueness: data.commandUniqueness,
    DataPath: data.dataPath,
    DefaultButton: data.defaultButton,
    DefaultItem: data.defaultItem,
    _DisplayImportance: data.displayImportance,
    Enabled: data.enabled,
    ExtendedTooltip: exportFormDecorationToXML(data.extendedTooltip),
    Font: exportFontToXML(data.font),
    Height: data.height,
    HorizontalAlignInGroup: data.horizontalAlignInGroup,
    HorizontalStretch: data.horizontalStretch,
    LocationInCommandBar: data.locationInCommandBar,
    MaxHeight: data.maxHeight,
    MaxWidth: data.maxWidth,
    Name: data.name,
    OnlyInAllActions: data.onlyInAllActions,
    Picture: exportPictureToXML(data.picture),
    PictureLocation: data.pictureLocation,
    Representation: data.representation,
    Shape: data.shape,
    ShapeRepresentation: data.shapeRepresentation,
    Shortcut: data.shortcut,
    SkipOnInput: data.skipOnInput,
    TextColor: exportColorToXML(data.textColor),
    Title: exportI8nTextToXML(data.title),
    TitleHeight: data.titleHeight,
    ToolTipRepresentation: data.toolTipRepresentation,
    Type: data.type,
    VerticalAlignInGroup: data.verticalAlignInGroup,
    VerticalStretch: data.verticalStretch,
    Visible: data.visible,
    Width: data.width,
    UserVisible: exportUserVisibleToXML(data.userVisible),
  }
}

registerExport(FormElementType.Button, exportButtonToXML)
