import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importFromXML"
import { importPictureFromXML } from "~/lib/metadata/commonObjects/pictures/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { Context } from "~/lib/metadata/context/types"
import { importBaseElementFromXML } from "~/lib/metadata/forms/elements/baseElement/importFromXML"
import { Button, ButtonXML } from "~/lib/metadata/forms/elements/button/types"
import { importFormDecorationFromXML } from "~/lib/metadata/forms/elements/formDecoration/importFromXML"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/lib/metadata/metadataFactory/types"

export const importButtonFromXML = (configurationSettings: Context, xml: ButtonXML | undefined): Button | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importBaseElementFromXML(configurationSettings, xml)!,
    elementType: FormElementType.Button,

    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    backColor: importColorFromXML(configurationSettings, xml.BackColor),
    borderColor: importColorFromXML(configurationSettings, xml.BorderColor),
    commandName: xml.CommandName,
    commandUniqueness: xml.CommandUniqueness,
    dataPath: xml.DataPath,
    defaultButton: xml.DefaultButton,
    defaultItem: xml.DefaultItem,
    displayImportance: xml._DisplayImportance,
    enabled: xml.Enabled,
    extendedTooltip: importFormDecorationFromXML(configurationSettings, xml.ExtendedTooltip),
    font: importFontFromXML(configurationSettings, xml.Font),
    height: xml.Height,
    horizontalAlignInGroup: xml.HorizontalAlignInGroup,
    horizontalStretch: xml.HorizontalStretch,
    locationInCommandBar: xml.LocationInCommandBar,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    onlyInAllActions: xml.OnlyInAllActions,
    picture: importPictureFromXML(configurationSettings, xml.Picture),
    pictureLocation: xml.PictureLocation,
    representation: xml.Representation,
    shape: xml.Shape,
    shapeRepresentation: xml.ShapeRepresentation,
    shortcut: xml.Shortcut,
    skipOnInput: xml.SkipOnInput,
    textColor: importColorFromXML(configurationSettings, xml.TextColor),
    title: importI8nTextFromXML(configurationSettings, xml.Title),
    titleHeight: xml.TitleHeight,
    toolTipRepresentation: xml.ToolTipRepresentation,
    type: xml.Type,
    userVisible: importUserVisibleFromXML(configurationSettings, xml.UserVisible),
    verticalAlignInGroup: xml.VerticalAlignInGroup,
    verticalStretch: xml.VerticalStretch,
    visible: xml.Visible,
    width: xml.Width,
  })
}

registerMetadata("ImportFromXML", "Button", importButtonFromXML)
