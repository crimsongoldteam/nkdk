import { importColorFromXML } from "~/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/metadata/commonObjects/font/importFromXML"
import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { ExtendedTooltip, ExtendedTooltipXML } from "~/metadata/forms/elements/extendedTooltip/types"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { importBaseElementFromXML } from "../baseElement/importFromXML"
import { BaseElement } from "../baseElement/types"
import { isDefaultExtendedTooltipName } from "./helper"

export const importExtendedTooltipFromXML = <T extends ExtendedTooltipXML | undefined>(
  context: ConfigurationContext,
  xml: T,
  parentElement: BaseElement
): ExtendedTooltip | undefined => {
  if (!xml) return undefined

  const baseFields = importBaseElementFromXML(context, xml)

  const result: ExtendedTooltip = {
    ...baseFields,
    elementType: FormElementType.FormDecoration,
  }

  if (xml.AutoMaxHeight !== undefined) result.autoMaxHeight = xml.AutoMaxHeight

  if (xml.AutoMaxWidth !== undefined) result.autoMaxWidth = xml.AutoMaxWidth

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

  if (isHasContent(parentElement, result)) return result

  return undefined
}

const isHasContent = (parentElement: BaseElement, data: ExtendedTooltip | undefined): boolean => {
  if (!data) return false

  if (!isDefaultExtendedTooltipName(parentElement, data)) return true

  const keys = Object.keys(data)
  const hasOtherFields = keys.some((key) => key !== "name" && key !== "id" && key !== "elementType")

  return hasOtherFields
}
