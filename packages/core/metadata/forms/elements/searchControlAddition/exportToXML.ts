import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML } from "~/metadata/commonObjects/i8nText/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportButtonGroupChildItemsToXML } from "~/metadata/forms/collections/buttonGroupChildItems/exportToXML"
import { exportContextMenuToXML } from "~/metadata/forms/elements/contextMenu/exportToXML"
import { SearchControlAddition, SearchControlAdditionXML } from "~/metadata/forms/elements/searchControlAddition/types"
import { sortObject } from "~/metadata/helpers/compactObject"
import { exportElementPropsToXML } from "../baseElement/exportToXML"
import { exportExtendedTooltipToXML } from "../extendedTooltip/exportToXML"
import { getSearchControlAdditionName } from "./helper"

export const exportSearchControlAdditionToXML = (
  context: ConfigurationContext,
  data: SearchControlAddition | undefined,
  parentElement: { name: string }
): SearchControlAdditionXML => {
  const name = getSearchControlAdditionName(parentElement)

  const element: SearchControlAddition = data ?? {
    childItems: [],
  }
  const baseFields = exportElementPropsToXML(context, { name })

  const contextMenu = exportContextMenuToXML(context, element.contextMenu, { name })
  const extendedTooltip = exportExtendedTooltipToXML(context, element.extendedTooltip, { name })

  const result: SearchControlAdditionXML = {
    AdditionSource: {
      Item: parentElement.name,
      Type: "SearchControl",
    },
    ...baseFields,
    ContextMenu: contextMenu,
    ExtendedTooltip: extendedTooltip,
  }

  const childItems = exportButtonGroupChildItemsToXML(context, element.childItems)
  if (childItems !== undefined) result.ChildItems = childItems

  if (element.displayImportance !== undefined) result._DisplayImportance = element.displayImportance

  if (element.enabled !== undefined) result.Enabled = element.enabled

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

  if (element.autoMaxWidth !== undefined) result.AutoMaxWidth = element.autoMaxWidth

  const backColor = exportColorToXML(context, element.backColor)
  if (backColor !== undefined) result.BackColor = backColor

  const borderColor = exportColorToXML(context, element.borderColor)
  if (borderColor !== undefined) result.BorderColor = borderColor

  const font = exportFontToXML(context, element.font)
  if (font !== undefined) result.Font = font

  if (element.horizontalStretch !== undefined) result.HorizontalStretch = element.horizontalStretch

  if (element.maxWidth !== undefined) result.MaxWidth = element.maxWidth

  const textColor = exportColorToXML(context, element.textColor)
  if (textColor !== undefined) result.TextColor = textColor

  if (element.width !== undefined) result.Width = element.width

  return sortObject(result)
}
