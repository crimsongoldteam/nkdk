import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML } from "~/metadata/commonObjects/i8nText/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { SearchStringAddition, SearchStringAdditionXML } from "~/metadata/forms/elements/searchStringAddition/types"
import { sortObject } from "~/metadata/helpers/compactObject"
import { exportElementPropsToXML } from "../baseElement/exportToXML"
import { exportContextMenuToXML } from "../contextMenu/exportToXML"
import { exportExtendedTooltipToXML } from "../extendedTooltip/exportToXML"
import { getSearchStringAdditionName } from "./helper"

export const exportSearchStringAdditionToXML = (
  context: ConfigurationContext,
  data: SearchStringAddition | undefined,
  parentElement: { name: string }
): SearchStringAdditionXML => {
  const element = data ?? {}

  const name = getSearchStringAdditionName(parentElement)

  const baseFields = exportElementPropsToXML(context, { name })

  const result: SearchStringAdditionXML = {
    ...baseFields,
    AdditionSource: {
      Item: parentElement.name,
      Type: "SearchStringAddition",
    },
  }

  const backColor = exportColorToXML(context, element.backColor)
  if (backColor !== undefined) result.BackColor = backColor

  const borderColor = exportColorToXML(context, element.borderColor)
  if (borderColor !== undefined) result.BorderColor = borderColor

  const font = exportFontToXML(context, element.font)
  if (font !== undefined) result.Font = font

  if (element.horizontalStretch !== undefined) result.HorizontalStretch = element.horizontalStretch

  const textColor = exportColorToXML(context, element.textColor)
  if (textColor !== undefined) result.TextColor = textColor

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
