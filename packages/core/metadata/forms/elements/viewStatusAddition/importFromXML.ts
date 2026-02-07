import { importBorderFromXML } from "~/metadata/commonObjects/border/importFromXML"
import { importColorFromXML } from "~/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/metadata/commonObjects/font/importFromXML"
import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { ViewStatusAddition, ViewStatusAdditionXML } from "~/metadata/forms/elements/viewStatusAddition/types"
import { PropertyRule } from "../calendarField/rules"
import { importContextMenuFromXML } from "../contextMenu/importFromXML"
import { importExtendedTooltipFromXML } from "../extendedTooltip/importFromXML"
import { isHasContent } from "./helper"

export const importViewStatusAdditionFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  xml: ViewStatusAdditionXML
): ViewStatusAddition | undefined => {
  const result: ViewStatusAddition = {}

  const contextMenu = importContextMenuFromXML(context, undefined, xml.ContextMenu)
  if (contextMenu !== undefined) result.contextMenu = contextMenu

  if (xml._DisplayImportance !== undefined) result.displayImportance = xml._DisplayImportance

  if (xml.Enabled !== undefined) result.enabled = xml.Enabled

  const extendedToolTip = importExtendedTooltipFromXML(context, undefined, xml.ExtendedTooltip)
  if (extendedToolTip !== undefined) result.extendedTooltip = extendedToolTip

  const title = importI8nTextFromXML(context, undefined, xml.Title)
  if (title !== undefined) result.title = title

  const toolTip = importI8nTextFromXML(context, undefined, xml.ToolTip)
  if (toolTip !== undefined) result.toolTip = toolTip

  if (xml.ToolTipRepresentation !== undefined) result.toolTipRepresentation = xml.ToolTipRepresentation

  if (xml.AutoMaxWidth !== undefined) result.autoMaxWidth = xml.AutoMaxWidth

  const backColor = importColorFromXML(context, undefined, xml.BackColor)
  if (backColor !== undefined) result.backColor = backColor

  const border = importBorderFromXML(context, undefined, xml.Border)
  if (border !== undefined) result.border = border

  const borderColor = importColorFromXML(context, undefined, xml.BorderColor)
  if (borderColor !== undefined) result.borderColor = borderColor

  const buttonsBackColor = importColorFromXML(context, undefined, xml.ButtonColor)
  if (buttonsBackColor !== undefined) result.buttonsBackColor = buttonsBackColor

  const font = importFontFromXML(context, undefined, xml.Font)
  if (font !== undefined) result.font = font

  if (xml.HorizontalLocation !== undefined) result.horizontalAlign = xml.HorizontalLocation

  if (xml.HorizontalStretch !== undefined) result.horizontalStretch = xml.HorizontalStretch

  if (xml.MaxWidth !== undefined) result.maxWidth = xml.MaxWidth

  const textColor = importColorFromXML(context, undefined, xml.TextColor)
  if (textColor !== undefined) result.textColor = textColor

  const titleFont = importFontFromXML(context, undefined, xml.TitleFont)
  if (titleFont !== undefined) result.titleFont = titleFont

  const titleTextColor = importColorFromXML(context, undefined, xml.TitleTextColor)
  if (titleTextColor !== undefined) result.titleTextColor = titleTextColor

  if (xml.Width !== undefined) result.width = xml.Width

  if (!isHasContent(result)) return undefined

  return result
}
