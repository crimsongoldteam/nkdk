import { importColorFromXML } from "~/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/metadata/commonObjects/font/importFromXML"
import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { ButtonGroup } from "~/metadata/forms/elements/buttonGroup/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ImportFromXMLFn, ToXMLType } from "~/metadata/metadataFactory/types"
import { importChildItemsFromXML } from "../../collections/childItems/importFromXML"
import { importBaseElementFromXML } from "../baseElement/importFromXML"
import { importExtendedTooltipFromXML } from "../extendedTooltip/importFromXML"
import { PropertyRule } from "../calendarField/rules"

export function importButtonGroupFromXML<To extends ButtonGroup | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: ToXMLType<To> | undefined
): To {
  if (xml === undefined) return undefined as To
  const baseFields = importBaseElementFromXML(context, undefined, xml)

  const result: ButtonGroup = {
    elementType: "ButtonGroup",
    ...baseFields,
    childItems: [],
  }

  result.childItems = importChildItemsFromXML(context, undefined, xml.ChildItems)

  const extendedTooltip = importExtendedTooltipFromXML(context, undefined, xml.ExtendedTooltip)
  if (extendedTooltip !== undefined) result.extendedTooltip = extendedTooltip

  if (xml.CommandSource !== undefined) result.commandSource = xml.CommandSource

  if (xml.Representation !== undefined) result.representation = xml.Representation

  if (xml.EnableContentChange !== undefined) result.enableContentChange = xml.EnableContentChange

  if (xml.Enabled !== undefined) result.enabled = xml.Enabled

  if (xml.Height !== undefined) result.height = xml.Height

  if (xml.GroupHorizontalAlign !== undefined) result.horizontalAlignInGroup = xml.GroupHorizontalAlign

  if (xml.HorizontalStretch !== undefined) result.horizontalStretch = xml.HorizontalStretch

  if (xml.ReadOnly !== undefined) result.readOnly = xml.ReadOnly

  if (xml.Shortcut !== undefined) result.shortcut = xml.Shortcut

  const title = importI8nTextFromXML(context, undefined, xml.Title)
  if (title !== undefined) result.title = title

  const titleFont = importFontFromXML(context, undefined, xml.TitleFont)
  if (titleFont !== undefined) result.titleFont = titleFont

  const titleTextColor = importColorFromXML(context, undefined, xml.TitleTextColor)
  if (titleTextColor !== undefined) result.titleTextColor = titleTextColor

  const toolTip = importI8nTextFromXML(context, undefined, xml.ToolTip)
  if (toolTip !== undefined) result.toolTip = toolTip

  if (xml.ToolTipRepresentation !== undefined) result.toolTipRepresentation = xml.ToolTipRepresentation

  if (xml.Type !== undefined) result.type = xml.Type

  const userVisible = importUserVisibleFromXML(context, undefined, xml.UserVisible)
  if (userVisible !== undefined) result.userVisible = userVisible

  if (xml.GroupVerticalAlign !== undefined) result.verticalAlignInGroup = xml.GroupVerticalAlign

  if (xml.VerticalStretch !== undefined) result.verticalStretch = xml.VerticalStretch

  if (xml.Visible !== undefined) result.visible = xml.Visible

  if (xml.Width !== undefined) result.width = xml.Width

  return result as To
}

registerMetadata("ImportFromXML", "ButtonGroup", importButtonGroupFromXML as ImportFromXMLFn)
