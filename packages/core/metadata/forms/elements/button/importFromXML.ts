import { importColorFromXML } from "~/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/metadata/commonObjects/font/importFromXML"
import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/importFromXML"
import { importPictureFromXML } from "~/metadata/commonObjects/pictures/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { Context } from "~/metadata/context/types"
import { importBaseElementFromXML } from "~/metadata/forms/elements/baseElement/importFromXML"
import { Button, ButtonXML } from "~/metadata/forms/elements/button/types"
import { importFormDecorationFromXML } from "~/metadata/forms/elements/formDecoration/importFromXML"
import { compactObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const importButtonFromXML = (context: Context, xml: ButtonXML | undefined): Button | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importBaseElementFromXML(context, xml)!,
    elementType: FormElementType.Button,

    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    backColor: importColorFromXML(context, xml.BackColor),
    borderColor: importColorFromXML(context, xml.BorderColor),
    commandName: xml.CommandName,
    commandUniqueness: xml.CommandUniqueness,
    dataPath: xml.DataPath,
    defaultButton: xml.DefaultButton,
    defaultItem: xml.DefaultItem,
    displayImportance: xml._DisplayImportance,
    enabled: xml.Enabled,
    extendedTooltip: importFormDecorationFromXML(context, xml.ExtendedTooltip),
    font: importFontFromXML(context, xml.Font),
    height: xml.Height,
    horizontalAlignInGroup: xml.HorizontalAlignInGroup,
    horizontalStretch: xml.HorizontalStretch,
    locationInCommandBar: xml.LocationInCommandBar,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    onlyInAllActions: xml.OnlyInAllActions,
    picture: importPictureFromXML(context, xml.Picture),
    pictureLocation: xml.PictureLocation,
    representation: xml.Representation,
    shape: xml.Shape,
    shapeRepresentation: xml.ShapeRepresentation,
    shortcut: xml.Shortcut,
    skipOnInput: xml.SkipOnInput,
    textColor: importColorFromXML(context, xml.TextColor),
    title: importI8nTextFromXML(context, xml.Title),
    titleHeight: xml.TitleHeight,
    toolTipRepresentation: xml.ToolTipRepresentation,
    type: xml.Type,
    userVisible: importUserVisibleFromXML(context, xml.UserVisible),
    verticalAlignInGroup: xml.VerticalAlignInGroup,
    verticalStretch: xml.VerticalStretch,
    visible: xml.Visible,
    width: xml.Width,
  })
}

registerMetadata("ImportFromXML", "Button", importButtonFromXML)
