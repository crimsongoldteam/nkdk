import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML } from "~/metadata/commonObjects/i8nText/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import {
  SearchStringAddition,
  SearchStringAdditionXML,
  SingleSearchStringAddition,
} from "~/metadata/forms/elements/searchStringAddition/types"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportToXMLFn, ToXMLType } from "~/metadata/metadataFactory/types"
import { exportElementPropsToXML } from "../baseElement/exportToXML"
import { exportContextMenuToXML } from "../contextMenu/exportToXML"
import { exportExtendedTooltipToXML } from "../extendedTooltip/exportToXML"
import { getSearchStringAdditionName } from "./helper"
import { PropertyRule } from "../calendarField/rules"

export function exportSearchStringAdditionToXML<From extends SearchStringAddition | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: From
): ToXMLType<From> {
  if (!data) return undefined as ToXMLType<From>

  const result = exportSearchStringAdditionPropsToXML(context, undefined, data, {
    name: data.name,
    additionSource: data.additionSource,
  })

  return result as ToXMLType<From>
}

export const exportSingleSearchStringAdditionToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: SingleSearchStringAddition | undefined,
  parentElement: { name: string }
): SearchStringAdditionXML => {
  const name = getSearchStringAdditionName(parentElement)

  const result = exportSearchStringAdditionPropsToXML(context, undefined, data, {
    name,
    additionSource: parentElement.name,
  })

  return result
}

const exportSearchStringAdditionPropsToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: SingleSearchStringAddition | undefined,
  params: { name: string; additionSource?: string }
): SearchStringAdditionXML => {
  const element = data ?? { elementType: "SearchStringAddition" }

  const baseFields = exportElementPropsToXML(context, undefined, { name: params.name })

  const contextMenu = exportContextMenuToXML(context, undefined, element.contextMenu, { name: params.name })
  const extendedTooltip = exportExtendedTooltipToXML(context, undefined, element.extendedTooltip, { name: params.name })

  const additionSourceXML =
    params.additionSource !== undefined
      ? {
          AdditionSource: {
            Item: params.additionSource,
            Type: "SearchStringRepresentation" as const,
          },
        }
      : {}

  const result: SearchStringAdditionXML = {
    ...baseFields,
    ...additionSourceXML,
    ContextMenu: contextMenu,
    ExtendedTooltip: extendedTooltip,
  }

  const backColor = exportColorToXML(context, undefined, element.backColor)
  if (backColor !== undefined) result.BackColor = backColor

  const borderColor = exportColorToXML(context, undefined, element.borderColor)
  if (borderColor !== undefined) result.BorderColor = borderColor

  const font = exportFontToXML(context, undefined, element.font)
  if (font !== undefined) result.Font = font

  if (element.horizontalStretch !== undefined) result.HorizontalStretch = element.horizontalStretch

  const textColor = exportColorToXML(context, undefined, element.textColor)
  if (textColor !== undefined) result.TextColor = textColor

  if (element.width !== undefined) result.Width = element.width

  if (element.displayImportance !== undefined) result._DisplayImportance = element.displayImportance

  if (element.enabled !== undefined) result.Enabled = element.enabled

  if (element.horizontalAlignInGroup !== undefined) result.GroupHorizontalAlign = element.horizontalAlignInGroup

  const title = exportI8nTextToXML(context, undefined, element.title)
  if (title !== undefined) result.Title = title

  const toolTip = exportI8nTextToXML(context, undefined, element.toolTip)
  if (toolTip !== undefined) result.ToolTip = toolTip

  if (element.toolTipRepresentation !== undefined) result.ToolTipRepresentation = element.toolTipRepresentation

  const userVisible = exportUserVisibleToXML(context, undefined, element.userVisible)
  if (userVisible !== undefined) result.UserVisible = userVisible

  if (element.verticalAlignInGroup !== undefined) result.GroupVerticalAlign = element.verticalAlignInGroup

  if (element.visible !== undefined) result.Visible = element.visible

  return sortObject(result)
}

registerMetadata("ExportToXML", "SearchStringAddition", exportSearchStringAdditionToXML as ExportToXMLFn)
