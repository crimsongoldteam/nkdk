import { exportBorderToXML } from "~/metadata/commonObjects/border/exportToXML"
import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML } from "~/metadata/commonObjects/i8nText/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { ViewStatusAddition, ViewStatusAdditionXML } from "~/metadata/forms/elements/viewStatusAddition/types"
import { sortObject } from "~/metadata/helpers/compactObject"
import { exportElementPropsToXML } from "../baseElement/exportToXML"
import { PropertyRule } from "../calendarField/rules"
import { exportContextMenuDeprecatedToXML } from "../contextMenu/exportToXML"
import { exportExtendedTooltipToDeprecatedXML } from "../extendedTooltip/exportToXML"
import { getViewStatusAdditionName } from "./helper"

export const exportViewStatusAdditionToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: ViewStatusAddition | undefined,
  parentElement: { name: string }
): ViewStatusAdditionXML => {
  const element = data ?? {}

  const name = getViewStatusAdditionName(parentElement)

  const baseFields = exportElementPropsToXML(context, undefined, { name })

  const contextMenu = exportContextMenuDeprecatedToXML(context, undefined, element.contextMenu, { name })
  const extendedTooltip = exportExtendedTooltipToDeprecatedXML(context, undefined, element.extendedTooltip, { name })

  const result: ViewStatusAdditionXML = {
    ...baseFields,
    AdditionSource: {
      Item: parentElement.name,
      Type: "ViewStatusRepresentation",
    },
    ContextMenu: contextMenu,
    ExtendedTooltip: extendedTooltip,
  }

  if (element.autoMaxWidth !== undefined) result.AutoMaxWidth = element.autoMaxWidth

  const backColor = exportColorToXML(context, undefined, element.backColor)
  if (backColor !== undefined) result.BackColor = backColor

  const border = exportBorderToXML(context, undefined, element.border)
  if (border !== undefined) result.Border = border

  const borderColor = exportColorToXML(context, undefined, element.borderColor)
  if (borderColor !== undefined) result.BorderColor = borderColor

  const buttonsBackColor = exportColorToXML(context, undefined, element.buttonsBackColor)
  if (buttonsBackColor !== undefined) result.ButtonColor = buttonsBackColor

  const font = exportFontToXML(context, undefined, element.font)
  if (font !== undefined) result.Font = font

  if (element.horizontalAlign !== undefined) result.HorizontalLocation = element.horizontalAlign

  if (element.horizontalStretch !== undefined) result.HorizontalStretch = element.horizontalStretch

  if (element.maxWidth !== undefined) result.MaxWidth = element.maxWidth

  const textColor = exportColorToXML(context, undefined, element.textColor)
  if (textColor !== undefined) result.TextColor = textColor

  const titleFont = exportFontToXML(context, undefined, element.titleFont)
  if (titleFont !== undefined) result.TitleFont = titleFont

  const titleTextColor = exportColorToXML(context, undefined, element.titleTextColor)
  if (titleTextColor !== undefined) result.TitleTextColor = titleTextColor

  if (element.width !== undefined) result.Width = element.width

  if (element.displayImportance !== undefined) result._DisplayImportance = element.displayImportance

  if (element.enabled !== undefined) result.Enabled = element.enabled

  const title = exportI8nTextToXML(context, undefined, element.title)
  if (title !== undefined) result.Title = title

  const toolTip = exportI8nTextToXML(context, undefined, element.toolTip)
  if (toolTip !== undefined) result.ToolTip = toolTip

  if (element.toolTipRepresentation !== undefined) result.ToolTipRepresentation = element.toolTipRepresentation

  return sortObject(result)
}
