import { importColorFromXML } from "~/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/metadata/commonObjects/font/importFromXML"
import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { CommandBar } from "~/metadata/forms/elements/commandBar/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType, ImportFromXMLFn, ToXMLType } from "~/metadata/metadataFactory/types"
import { importCommandBarChildItemsFromXML } from "../../collections/commandBarChildItems/importFromXML"
import { importBaseElementFromXML } from "../baseElement/importFromXML"
import { importExtendedTooltipFromXML } from "../extendedTooltip/importFromXML"

export function importCommandBarFromXML<To extends CommandBar | undefined>(
  context: ConfigurationContext,
  xml: ToXMLType<To> | undefined
): To {
  if (xml === undefined) return undefined as To

  const baseFields = importBaseElementFromXML(context, xml)

  const result: CommandBar = {
    ...baseFields,
    elementType: FormElementType.CommandBar,
    childItems: [],
  }

  const extendedTooltip = importExtendedTooltipFromXML(context, xml.ExtendedTooltip)
  if (extendedTooltip !== undefined) result.extendedTooltip = extendedTooltip

  if (xml.EnableContentChange !== undefined) result.enableContentChange = xml.EnableContentChange

  if (xml.Enabled !== undefined) result.enabled = xml.Enabled

  if (xml.Height !== undefined) result.height = xml.Height

  if (xml.HorizontalLocation !== undefined) result.horizontalAlign = xml.HorizontalLocation

  if (xml.HorizontalStretch !== undefined) result.horizontalStretch = xml.HorizontalStretch

  if (xml.ReadOnly !== undefined) result.readOnly = xml.ReadOnly

  if (xml.Shortcut !== undefined) result.shortcut = xml.Shortcut

  const title = importI8nTextFromXML(context, xml.Title)
  if (title !== undefined) result.title = title

  const titleFont = importFontFromXML(context, xml.TitleFont)
  if (titleFont !== undefined) result.titleFont = titleFont

  const titleTextColor = importColorFromXML(context, xml.TitleTextColor)
  if (titleTextColor !== undefined) result.titleTextColor = titleTextColor

  const toolTip = importI8nTextFromXML(context, xml.ToolTip)
  if (toolTip !== undefined) result.toolTip = toolTip

  if (xml.ToolTipRepresentation !== undefined) result.toolTipRepresentation = xml.ToolTipRepresentation

  if (xml.Type !== undefined) result.type = xml.Type

  if (xml.VerticalAlignInGroup !== undefined) result.verticalAlignInGroup = xml.VerticalAlignInGroup

  if (xml.VerticalStretch !== undefined) result.verticalStretch = xml.VerticalStretch

  if (xml.Visible !== undefined) result.visible = xml.Visible

  if (xml.Width !== undefined) result.width = xml.Width

  const childItems = importCommandBarChildItemsFromXML(context, xml.ChildItems)
  if (childItems !== undefined && childItems.length > 0) result.childItems = childItems

  if (xml.Autofill !== undefined) result.autofill = xml.Autofill

  if (xml._DisplayImportance !== undefined) result.displayImportance = xml._DisplayImportance

  if (xml.GroupHorizontalAlign !== undefined) result.horizontalAlignInGroup = xml.GroupHorizontalAlign

  const userVisible = importUserVisibleFromXML(context, xml.UserVisible)
  if (userVisible !== undefined) result.userVisible = userVisible

  return result as To
}

registerMetadata("ImportFromXML", "CommandBar", importCommandBarFromXML as ImportFromXMLFn)
