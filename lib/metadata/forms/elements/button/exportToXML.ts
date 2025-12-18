import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportToXML"
import { exportPictureToXML } from "~/lib/metadata/commonObjects/pictures/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { exportBaseElementToXML } from "~/lib/metadata/forms/elements/baseElement/exportToXML"
import { Button, ButtonXML } from "~/lib/metadata/forms/elements/button/types"
import { exportFormDecorationToXML } from "~/lib/metadata/forms/elements/formDecoration/exportToXML"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"

export const exportButtonToXML = (
  data: Button | undefined,
  configurationSettings: ConfigurationSettings
): ButtonXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportBaseElementToXML(data, configurationSettings)!,

    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    BackColor: exportColorToXML(data.backColor, configurationSettings),
    BorderColor: exportColorToXML(data.borderColor, configurationSettings),
    CommandName: data.commandName,
    CommandUniqueness: data.commandUniqueness,
    DataPath: data.dataPath,
    DefaultButton: data.defaultButton,
    DefaultItem: data.defaultItem,
    _DisplayImportance: data.displayImportance,
    Enabled: data.enabled,
    ExtendedTooltip: exportFormDecorationToXML(data.extendedTooltip, configurationSettings),
    Font: exportFontToXML(data.font, configurationSettings),
    Height: data.height,
    HorizontalAlignInGroup: data.horizontalAlignInGroup,
    HorizontalStretch: data.horizontalStretch,
    LocationInCommandBar: data.locationInCommandBar,
    MaxHeight: data.maxHeight,
    MaxWidth: data.maxWidth,
    OnlyInAllActions: data.onlyInAllActions,
    Picture: exportPictureToXML(data.picture, configurationSettings),
    PictureLocation: data.pictureLocation,
    Representation: data.representation,
    Shape: data.shape,
    ShapeRepresentation: data.shapeRepresentation,
    Shortcut: data.shortcut,
    SkipOnInput: data.skipOnInput,
    TextColor: exportColorToXML(data.textColor, configurationSettings),
    Title: exportI8nTextToXML(data.title, configurationSettings),
    TitleHeight: data.titleHeight,
    ToolTipRepresentation: data.toolTipRepresentation,
    Type: data.type,
    VerticalAlignInGroup: data.verticalAlignInGroup,
    VerticalStretch: data.verticalStretch,
    Visible: data.visible,
    Width: data.width,
    UserVisible: exportUserVisibleToXML(data.userVisible, configurationSettings),
  })
}

registerMetadata("ExportToXML", "Button", exportButtonToXML)
