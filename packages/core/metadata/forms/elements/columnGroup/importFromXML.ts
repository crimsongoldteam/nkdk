import { importColorFromXML } from "~/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/metadata/commonObjects/font/importFromXML"
import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/importFromXML"
import { importPictureFromXML } from "~/metadata/commonObjects/picture/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { ColumnGroup } from "~/metadata/forms/elements/columnGroup/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ImportFromXMLFn, ToXMLType } from "~/metadata/metadataFactory/types"
import { importChildItemsFromXML } from "../../collections/childItems/importFromXML"
import { importBaseElementFromXML } from "../baseElement/importFromXML"
import { importExtendedTooltipFromXML } from "../extendedTooltip/importFromXML"
import { PropertyRule } from "../calendarField/rules"

export function importColumnGroupFromXML<To extends ColumnGroup | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: ToXMLType<To> | undefined
): To {
  if (xml === undefined) return undefined as To

  const baseFields = importBaseElementFromXML(context, undefined, xml)

  const result: ColumnGroup = {
    ...baseFields,
    elementType: "ColumnGroup",
    childItems: [],
  }

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

  const extendedTooltip = importExtendedTooltipFromXML(context, undefined, xml.ExtendedTooltip)
  if (extendedTooltip !== undefined) result.extendedTooltip = extendedTooltip

  if (xml.GroupVerticalAlign !== undefined) result.verticalAlignInGroup = xml.GroupVerticalAlign

  if (xml.VerticalStretch !== undefined) result.verticalStretch = xml.VerticalStretch

  if (xml.Visible !== undefined) result.visible = xml.Visible

  if (xml.Width !== undefined) result.width = xml.Width

  if (xml.FixingInTable !== undefined) result.fixingInTable = xml.FixingInTable

  if (xml.Group !== undefined) result.group = xml.Group

  if (xml.HeaderDataPath !== undefined) result.headerDataPath = xml.HeaderDataPath

  if (xml.HeaderFormat !== undefined) result.headerFormat = xml.HeaderFormat

  if (xml.HeaderHorizontalAlign !== undefined) result.headerHorizontalAlign = xml.HeaderHorizontalAlign

  const headerPicture = importPictureFromXML(context, undefined, xml.HeaderPicture)
  if (headerPicture !== undefined) result.headerPicture = headerPicture

  if (xml.ShowInHeader !== undefined) result.showInHeader = xml.ShowInHeader

  if (xml.ShowTitle !== undefined) result.showTitle = xml.ShowTitle

  const titleBackColor = importColorFromXML(context, undefined, xml.TitleBackColor)
  if (titleBackColor !== undefined) result.titleBackColor = titleBackColor

  const userVisible = importUserVisibleFromXML(context, undefined, xml.UserVisible)
  if (userVisible !== undefined) result.userVisible = userVisible

  result.childItems = importChildItemsFromXML(context, undefined, xml.ChildItems)

  return result as To
}

registerMetadata("ImportFromXML", "ColumnGroup", importColumnGroupFromXML as ImportFromXMLFn)
