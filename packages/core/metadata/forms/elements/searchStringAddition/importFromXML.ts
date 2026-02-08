import { importColorFromXML } from "~/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/metadata/commonObjects/font/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import {
  SearchStringAddition,
  SearchStringAdditionXML,
  SingleSearchStringAddition,
} from "~/metadata/forms/elements/searchStringAddition/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ElementXML, ImportFromXMLFn } from "~/metadata/metadataFactory/types"
import { PropertyRule } from "../calendarField/rules"
import { importContextMenuFromXML } from "../contextMenu/importFromXML"
import { importExtendedTooltipFromXML } from "../extendedTooltip/importFromXML"
import { isHasContent } from "./helper"
import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/importFromXML"

export const importSearchStringAdditionFromXML = <To extends SearchStringAddition | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  xml: ElementXML | undefined
): To => {
  if (xml === undefined) return undefined as To

  const props = importSingleSearchStringAdditionFromXML(context, undefined, xml)

  const result: SearchStringAddition = {
    elementType: "SearchStringAddition",
    name: xml._name,
    ...props,
  }

  const additionSource = xml.AdditionSource?.Item
  if (additionSource !== undefined) result.additionSource = additionSource

  return result as To
}

export const importSingleSearchStringAdditionFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  xml: SearchStringAdditionXML
): SingleSearchStringAddition | undefined => {
  const result: SingleSearchStringAddition = {
    elementType: "SearchStringAddition",
  }

  const contextMenu = importContextMenuFromXML(context, undefined, xml.ContextMenu)
  if (contextMenu !== undefined) result.contextMenu = contextMenu

  if (xml._DisplayImportance !== undefined) result.displayImportance = xml._DisplayImportance

  if (xml.Enabled !== undefined) result.enabled = xml.Enabled

  const extendedToolTip = importExtendedTooltipFromXML(context, undefined, xml.ExtendedTooltip)
  if (extendedToolTip !== undefined) result.extendedTooltip = extendedToolTip

  if (xml.GroupHorizontalAlign !== undefined) result.horizontalAlignInGroup = xml.GroupHorizontalAlign

  const title = importI8nTextFromXML(context, { type: "I8nText" }, xml.Title)
  if (title !== undefined) result.title = title

  const toolTip = importI8nTextFromXML(context, { type: "I8nText" }, xml.ToolTip)
  if (toolTip !== undefined) result.toolTip = toolTip

  if (xml.ToolTipRepresentation !== undefined) result.toolTipRepresentation = xml.ToolTipRepresentation

  const userVisible = importUserVisibleFromXML(context, undefined, xml.UserVisible)
  if (userVisible !== undefined) result.userVisible = userVisible

  if (xml.GroupVerticalAlign !== undefined) result.verticalAlignInGroup = xml.GroupVerticalAlign

  if (xml.Visible !== undefined) result.visible = xml.Visible

  const backColor = importColorFromXML(context, undefined, xml.BackColor)
  if (backColor !== undefined) result.backColor = backColor

  const borderColor = importColorFromXML(context, undefined, xml.BorderColor)
  if (borderColor !== undefined) result.borderColor = borderColor

  const font = importFontFromXML(context, undefined, xml.Font)
  if (font !== undefined) result.font = font

  if (xml.HorizontalStretch !== undefined) result.horizontalStretch = xml.HorizontalStretch

  const textColor = importColorFromXML(context, undefined, xml.TextColor)
  if (textColor !== undefined) result.textColor = textColor

  if (xml.Width !== undefined) result.width = xml.Width

  if (!isHasContent(result)) return undefined

  return result
}

registerMetadata("ImportFromXML", "SearchStringAddition", importSearchStringAdditionFromXML as ImportFromXMLFn)
