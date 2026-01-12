import { importColorFromXML } from "~/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/metadata/commonObjects/font/importFromXML"
import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/importFromXML"
import { importPictureFromXML } from "~/metadata/commonObjects/picture/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { importBaseElementFromXML } from "~/metadata/forms/elements/baseElement/importFromXML"
import { Button, ButtonXML } from "~/metadata/forms/elements/button/types"
import { importExtendedTooltipFromXML } from "~/metadata/forms/elements/extendedTooltip/importFromXML"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { ImportExportReturn } from "../types"

export const importButtonFromXML = <T extends ButtonXML | undefined>(
  context: ConfigurationContext,
  xml: T
): ImportExportReturn<T, Button> => {
  if (!xml) return undefined as ImportExportReturn<T, Button>

  const baseFields = importBaseElementFromXML(context, xml)

  const result: Button = {
    ...baseFields,
    elementType: FormElementType.Button,
  }

  if (xml.AutoMaxHeight !== undefined) result.autoMaxHeight = xml.AutoMaxHeight

  if (xml.AutoMaxWidth !== undefined) result.autoMaxWidth = xml.AutoMaxWidth

  const backColor = importColorFromXML(context, xml.BackColor)
  if (backColor !== undefined) result.backColor = backColor

  const borderColor = importColorFromXML(context, xml.BorderColor)
  if (borderColor !== undefined) result.borderColor = borderColor

  if (xml.CommandName !== undefined) result.commandName = xml.CommandName

  if (xml.CommandUniqueness !== undefined) result.commandUniqueness = xml.CommandUniqueness

  if (xml.DataPath !== undefined) result.dataPath = xml.DataPath

  if (xml.DefaultButton !== undefined) result.defaultButton = xml.DefaultButton

  if (xml.DefaultItem !== undefined) result.defaultItem = xml.DefaultItem

  if (xml._DisplayImportance !== undefined) result.displayImportance = xml._DisplayImportance

  if (xml.Enabled !== undefined) result.enabled = xml.Enabled

  const extendedTooltip = importExtendedTooltipFromXML(context, xml.ExtendedTooltip)
  if (extendedTooltip !== undefined) result.extendedTooltip = extendedTooltip

  const font = importFontFromXML(context, xml.Font)
  if (font !== undefined) result.font = font

  if (xml.Height !== undefined) result.height = xml.Height

  if (xml.HorizontalAlignInGroup !== undefined) result.horizontalAlignInGroup = xml.HorizontalAlignInGroup

  if (xml.HorizontalStretch !== undefined) result.horizontalStretch = xml.HorizontalStretch

  if (xml.LocationInCommandBar !== undefined) result.locationInCommandBar = xml.LocationInCommandBar

  if (xml.MaxHeight !== undefined) result.maxHeight = xml.MaxHeight

  if (xml.MaxWidth !== undefined) result.maxWidth = xml.MaxWidth

  if (xml.OnlyInAllActions !== undefined) result.onlyInAllActions = xml.OnlyInAllActions

  const picture = importPictureFromXML(context, xml.Picture)
  if (picture !== undefined) result.picture = picture

  if (xml.PictureLocation !== undefined) result.pictureLocation = xml.PictureLocation

  if (xml.Representation !== undefined) result.representation = xml.Representation

  if (xml.Shape !== undefined) result.shape = xml.Shape

  if (xml.ShapeRepresentation !== undefined) result.shapeRepresentation = xml.ShapeRepresentation

  if (xml.Shortcut !== undefined) result.shortcut = xml.Shortcut

  if (xml.SkipOnInput !== undefined) result.skipOnInput = xml.SkipOnInput

  const textColor = importColorFromXML(context, xml.TextColor)
  if (textColor !== undefined) result.textColor = textColor

  const title = importI8nTextFromXML(context, xml.Title)
  if (title !== undefined) result.title = title

  if (xml.TitleHeight !== undefined) result.titleHeight = xml.TitleHeight

  if (xml.ToolTipRepresentation !== undefined) result.toolTipRepresentation = xml.ToolTipRepresentation

  if (xml.Type !== undefined) result.type = xml.Type

  const userVisible = importUserVisibleFromXML(context, xml.UserVisible)
  if (userVisible !== undefined) result.userVisible = userVisible

  if (xml.VerticalAlignInGroup !== undefined) result.verticalAlignInGroup = xml.VerticalAlignInGroup

  if (xml.VerticalStretch !== undefined) result.verticalStretch = xml.VerticalStretch

  if (xml.Visible !== undefined) result.visible = xml.Visible

  if (xml.Width !== undefined) result.width = xml.Width

  return result as ImportExportReturn<T, Button>
}

registerMetadata("ImportFromXML", "Button", importButtonFromXML)
