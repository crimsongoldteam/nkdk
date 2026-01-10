import { importColorFromXML } from "~/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/metadata/commonObjects/font/importFromXML"
import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { importBaseElementFromXML } from "~/metadata/forms/elements/baseElement/importFromXML"
import { importCommandBarFromXML } from "~/metadata/forms/elements/commandBar/importFromXML"
import { FormDecoration, FormDecorationXML } from "~/metadata/forms/elements/formDecoration/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { ImportExportReturn } from "../types"

export const importFormDecorationFromXML = <T extends FormDecorationXML | undefined>(
  context: ConfigurationContext,
  xml: T
): ImportExportReturn<T, FormDecoration> => {
  if (!xml) return undefined as ImportExportReturn<T, FormDecoration>
  const baseFields = importBaseElementFromXML(context, xml)

  const result: FormDecoration = {
    ...baseFields,
    elementType: FormElementType.FormDecoration,
  }

  if (xml.AutoMaxHeight !== undefined) result.autoMaxHeight = xml.AutoMaxHeight

  if (xml.AutoMaxWidth !== undefined) result.autoMaxWidth = xml.AutoMaxWidth

  const contextMenu = importCommandBarFromXML(context, xml.ContextMenu)
  if (contextMenu !== undefined) result.contextMenu = contextMenu

  if (xml._DisplayImportance !== undefined) result.displayImportance = xml._DisplayImportance

  if (xml.Enabled !== undefined) result.enabled = xml.Enabled

  const font = importFontFromXML(context, xml.Font)
  if (font !== undefined) result.font = font

  if (xml.Height !== undefined) result.height = xml.Height

  if (xml.HorizontalAlignInGroup !== undefined) result.horizontalAlignInGroup = xml.HorizontalAlignInGroup

  if (xml.HorizontalStretch !== undefined) result.horizontalStretch = xml.HorizontalStretch

  if (xml.MaxHeight !== undefined) result.maxHeight = xml.MaxHeight

  if (xml.MaxWidth !== undefined) result.maxWidth = xml.MaxWidth

  if (xml.Shortcut !== undefined) result.shortcut = xml.Shortcut

  if (xml.SkipOnInput !== undefined) result.skipOnInput = xml.SkipOnInput

  const textColor = importColorFromXML(context, xml.TextColor)
  if (textColor !== undefined) result.textColor = textColor

  const title = importI8nTextFromXML(context, xml.Title)
  if (title !== undefined) result.title = title

  const toolTip = importI8nTextFromXML(context, xml.ToolTip)
  if (toolTip !== undefined) result.toolTip = toolTip

  if (xml.ToolTipRepresentation !== undefined) result.toolTipRepresentation = xml.ToolTipRepresentation

  if (xml.Type !== undefined) result.type = xml.Type

  const userVisible = importUserVisibleFromXML(context, xml.UserVisible)
  if (userVisible !== undefined) result.userVisible = userVisible

  if (xml.VerticalAlignInGroup !== undefined) result.verticalAlignInGroup = xml.VerticalAlignInGroup

  if (xml.VerticalStretch !== undefined) result.verticalStretch = xml.VerticalStretch

  if (xml.Visible !== undefined) result.visible = xml.Visible

  if (xml.Width !== undefined) result.width = xml.Width

  return result as ImportExportReturn<T, FormDecoration>
}

registerMetadata("ImportFromXML", "FormDecoration", importFormDecorationFromXML)
