import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML } from "~/metadata/commonObjects/i8nText/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportContextMenuDeprecatedToXML } from "~/metadata/forms/elements/contextMenu/exportToXML"
import {
  SearchControlAddition,
  SearchControlAdditionXML,
  SingleSearchControlAddition,
} from "~/metadata/forms/elements/searchControlAddition/types"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportToXMLFn, ToXMLType } from "~/metadata/metadataFactory/types"
import { exportChildItemsToXML } from "../../collections/childItems/exportToXML"
import { exportElementPropsToXML } from "../baseElement/exportToXML"
import { PropertyRule } from "../calendarField/rules"
import { exportExtendedTooltipToDeprecatedXML } from "../extendedTooltip/exportToXML"
import { getSearchControlAdditionName } from "./helper"

export function exportSearchControlAdditionToXML<From extends SearchControlAddition | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: From
): ToXMLType<From> {
  if (!data) return undefined as ToXMLType<From>

  const result = exportSearchControlAdditionPropsToXML(context, undefined, data, {
    name: data.name,
    additionSource: data.additionSource,
  })

  return result as ToXMLType<From>
}

export const exportSingleSearchControlAdditionToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: SingleSearchControlAddition | undefined,
  parentElement: { name: string }
): SearchControlAdditionXML => {
  const name = getSearchControlAdditionName(parentElement)

  const result = exportSearchControlAdditionPropsToXML(context, undefined, data, {
    name,
    additionSource: parentElement.name,
  })

  return result
}

const exportSearchControlAdditionPropsToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: SingleSearchControlAddition | undefined,
  params: { name: string; additionSource?: string }
): SearchControlAdditionXML => {
  const element = data ?? { elementType: "SearchControlAddition", childItems: [] }

  const baseFields = exportElementPropsToXML(context, undefined, { name: params.name })

  const contextMenu = exportContextMenuDeprecatedToXML(context, undefined, element.contextMenu, { name: params.name })
  const extendedTooltip = exportExtendedTooltipToDeprecatedXML(context, undefined, element.extendedTooltip, {
    name: params.name,
  })

  const additionSourceXML =
    params.additionSource !== undefined
      ? {
          AdditionSource: {
            Item: params.additionSource,
            Type: "SearchControl" as const,
          },
        }
      : {}

  const result: SearchControlAdditionXML = {
    ...baseFields,
    ...additionSourceXML,
    ContextMenu: contextMenu,
    ExtendedTooltip: extendedTooltip,
  }

  const childItems = exportChildItemsToXML(context, undefined, element.childItems)
  if (childItems !== undefined) result.ChildItems = childItems

  if (element.displayImportance !== undefined) result._DisplayImportance = element.displayImportance

  if (element.enabled !== undefined) result.Enabled = element.enabled

  if (element.horizontalAlignInGroup !== undefined) result.GroupHorizontalAlign = element.horizontalAlignInGroup

  const title = exportI8nTextToXML(context, { type: "I8nText" }, element.title)
  if (title !== undefined) result.Title = title

  const toolTip = exportI8nTextToXML(context, { type: "I8nText" }, element.toolTip)
  if (toolTip !== undefined) result.ToolTip = toolTip

  if (element.toolTipRepresentation !== undefined) result.ToolTipRepresentation = element.toolTipRepresentation

  const userVisible = exportUserVisibleToXML(context, undefined, element.userVisible)
  if (userVisible !== undefined) result.UserVisible = userVisible

  if (element.verticalAlignInGroup !== undefined) result.GroupVerticalAlign = element.verticalAlignInGroup

  if (element.visible !== undefined) result.Visible = element.visible

  if (element.autoMaxWidth !== undefined) result.AutoMaxWidth = element.autoMaxWidth

  const backColor = exportColorToXML(context, undefined, element.backColor)
  if (backColor !== undefined) result.BackColor = backColor

  const borderColor = exportColorToXML(context, undefined, element.borderColor)
  if (borderColor !== undefined) result.BorderColor = borderColor

  const font = exportFontToXML(context, undefined, element.font)
  if (font !== undefined) result.Font = font

  if (element.horizontalStretch !== undefined) result.HorizontalStretch = element.horizontalStretch

  if (element.maxWidth !== undefined) result.MaxWidth = element.maxWidth

  const textColor = exportColorToXML(context, undefined, element.textColor)
  if (textColor !== undefined) result.TextColor = textColor

  if (element.width !== undefined) result.Width = element.width

  return sortObject(result)
}

registerMetadata("ExportToXML", "SearchControlAddition", exportSearchControlAdditionToXML as ExportToXMLFn)
