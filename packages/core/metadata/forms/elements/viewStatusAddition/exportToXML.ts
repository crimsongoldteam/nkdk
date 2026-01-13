import { exportBorderToXML } from "~/metadata/commonObjects/border/exportToXML"
import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML } from "~/metadata/commonObjects/i8nText/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { ViewStatusAddition, ViewStatusAdditionXML } from "~/metadata/forms/elements/viewStatusAddition/types"
import { sortObject } from "~/metadata/helpers/compactObject"
import { exportElementPropsToXML } from "../baseElement/exportToXML"
import { exportContextMenuToXML } from "../contextMenu/exportToXML"
import { exportExtendedTooltipToXML } from "../extendedTooltip/exportToXML"
import { getViewStatusAdditionName } from "./helper"

export const exportViewStatusAdditionToXML = (
  context: ConfigurationContext,
  data: ViewStatusAddition | undefined,
  parentElement: { name: string }
): ViewStatusAdditionXML => {
  const element = data ?? {}

  const name = getViewStatusAdditionName(parentElement)

  const baseFields = exportElementPropsToXML(context, { name })

  const result: ViewStatusAdditionXML = {
    ...baseFields,
    AdditionSource: {
      Item: parentElement.name,
      Type: "ViewStatusRepresentation",
    },
  }

  if (element.autoMaxWidth !== undefined) result.AutoMaxWidth = element.autoMaxWidth

  const backColor = exportColorToXML(context, element.backColor)
  if (backColor !== undefined) result.BackColor = backColor

  const border = exportBorderToXML(context, element.border)
  if (border !== undefined) result.Border = border

  const borderColor = exportColorToXML(context, element.borderColor)
  if (borderColor !== undefined) result.BorderColor = borderColor

  const buttonsBackColor = exportColorToXML(context, element.buttonsBackColor)
  if (buttonsBackColor !== undefined) result.ButtonsBackColor = buttonsBackColor

  const font = exportFontToXML(context, element.font)
  if (font !== undefined) result.Font = font

  if (element.horizontalAlign !== undefined) result.HorizontalAlign = element.horizontalAlign

  if (element.horizontalStretch !== undefined) result.HorizontalStretch = element.horizontalStretch

  if (element.maxWidth !== undefined) result.MaxWidth = element.maxWidth

  const textColor = exportColorToXML(context, element.textColor)
  if (textColor !== undefined) result.TextColor = textColor

  const titleFont = exportFontToXML(context, element.titleFont)
  if (titleFont !== undefined) result.TitleFont = titleFont

  const titleTextColor = exportColorToXML(context, element.titleTextColor)
  if (titleTextColor !== undefined) result.TitleTextColor = titleTextColor

  if (element.width !== undefined) result.Width = element.width

  result.ContextMenu = exportContextMenuToXML(context, element.contextMenu, { name })

  if (element.displayImportance !== undefined) result._DisplayImportance = element.displayImportance

  if (element.enabled !== undefined) result.Enabled = element.enabled

  result.ExtendedTooltip = exportExtendedTooltipToXML(context, element.extendedTooltip, { name })

  if (element.horizontalAlignInGroup !== undefined) result.HorizontalAlignInGroup = element.horizontalAlignInGroup

  const title = exportI8nTextToXML(context, element.title)
  if (title !== undefined) result.Title = title

  const toolTip = exportI8nTextToXML(context, element.toolTip)
  if (toolTip !== undefined) result.ToolTip = toolTip

  if (element.toolTipRepresentation !== undefined) result.ToolTipRepresentation = element.toolTipRepresentation

  const userVisible = exportUserVisibleToXML(context, element.userVisible)
  if (userVisible !== undefined) result.UserVisible = userVisible

  if (element.verticalAlignInGroup !== undefined) result.VerticalAlignInGroup = element.verticalAlignInGroup

  if (element.visible !== undefined) result.Visible = element.visible

  return sortObject(result)
}
