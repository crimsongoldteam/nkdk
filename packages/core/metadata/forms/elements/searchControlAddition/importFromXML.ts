import { importColorFromXML } from "~/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/metadata/commonObjects/font/importFromXML"
import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { importCommandBarChildItemsFromXML } from "~/metadata/forms/collections/commandBarChildItems/importFromXML"
import { importContextMenuFromXML } from "~/metadata/forms/elements/contextMenu/importFromXML"
import {
  SearchControlAddition,
  SearchControlAdditionXML,
  SingleSearchControlAddition,
} from "~/metadata/forms/elements/searchControlAddition/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ImportFromXMLFn, ToXMLType } from "~/metadata/metadataFactory/types"
import { importExtendedTooltipFromXML } from "../extendedTooltip/importFromXML"
import { isHasContent } from "./helper"

export function importSearchControlAdditionFromXML<To extends SearchControlAddition | undefined>(
  context: ConfigurationContext,
  xml: ToXMLType<To> | undefined
): To {
  if (xml === undefined) return undefined as To

  const props = importSearchControlAdditionPropsFromXML(context, xml)
  if (props === undefined) return undefined as To

  const result: SearchControlAddition = {
    name: xml._name,
    ...props,
    elementType: "SearchControlAddition",
  }

  const additionSource = xml.AdditionSource?.Item
  if (additionSource !== undefined) result.additionSource = additionSource

  return result as To
}

export const importSingleSearchControlAdditionFromXML = (
  context: ConfigurationContext,
  xml: SearchControlAdditionXML
): SingleSearchControlAddition | undefined => {
  const result = importSearchControlAdditionPropsFromXML(context, xml)
  if (result === undefined) return undefined

  return result
}

export const importSearchControlAdditionPropsFromXML = (
  context: ConfigurationContext,
  xml: SearchControlAdditionXML
): SingleSearchControlAddition | undefined => {
  const result: SingleSearchControlAddition = {
    elementType: "SearchControlAddition",
    childItems: [],
  }

  const contextMenu = importContextMenuFromXML(context, xml.ContextMenu)
  if (contextMenu !== undefined) result.contextMenu = contextMenu

  if (xml._DisplayImportance !== undefined) result.displayImportance = xml._DisplayImportance

  if (xml.Enabled !== undefined) result.enabled = xml.Enabled

  const extendedToolTip = importExtendedTooltipFromXML(context, xml.ExtendedTooltip)
  if (extendedToolTip !== undefined) result.extendedTooltip = extendedToolTip

  if (xml.HorizontalAlignInGroup !== undefined) result.horizontalAlignInGroup = xml.HorizontalAlignInGroup

  const title = importI8nTextFromXML(context, xml.Title)
  if (title !== undefined) result.title = title

  const toolTip = importI8nTextFromXML(context, xml.ToolTip)
  if (toolTip !== undefined) result.toolTip = toolTip

  if (xml.ToolTipRepresentation !== undefined) result.toolTipRepresentation = xml.ToolTipRepresentation

  const userVisible = importUserVisibleFromXML(context, xml.UserVisible)
  if (userVisible !== undefined) result.userVisible = userVisible

  if (xml.VerticalAlignInGroup !== undefined) result.verticalAlignInGroup = xml.VerticalAlignInGroup

  if (xml.Visible !== undefined) result.visible = xml.Visible

  const childItems = importCommandBarChildItemsFromXML(context, xml.ChildItems)
  if (childItems !== undefined) result.childItems = childItems

  if (xml.AutoMaxWidth !== undefined) result.autoMaxWidth = xml.AutoMaxWidth

  const backColor = importColorFromXML(context, xml.BackColor)
  if (backColor !== undefined) result.backColor = backColor

  const borderColor = importColorFromXML(context, xml.BorderColor)
  if (borderColor !== undefined) result.borderColor = borderColor

  const font = importFontFromXML(context, xml.Font)
  if (font !== undefined) result.font = font

  if (xml.HorizontalStretch !== undefined) result.horizontalStretch = xml.HorizontalStretch

  if (xml.MaxWidth !== undefined) result.maxWidth = xml.MaxWidth

  const textColor = importColorFromXML(context, xml.TextColor)
  if (textColor !== undefined) result.textColor = textColor

  if (xml.Width !== undefined) result.width = xml.Width

  if (!isHasContent(result)) return undefined

  return result
}

registerMetadata("ImportFromXML", "SearchControlAddition", importSearchControlAdditionFromXML as ImportFromXMLFn)
