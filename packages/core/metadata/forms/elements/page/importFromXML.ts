import { importColorFromXML } from "~/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/metadata/commonObjects/font/importFromXML"
import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/importFromXML"
import { importPictureFromXML } from "~/metadata/commonObjects/picture/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { importChildItemsFromXML } from "~/metadata/forms/collections/childItems/importFromXML"
import { importExtendedTooltipFromXML } from "~/metadata/forms/elements/extendedTooltip/importFromXML"
import { Page } from "~/metadata/forms/elements/page/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ImportFromXMLFn, ToXMLType } from "~/metadata/metadataFactory/types"
import { importBaseElementFromXML } from "../baseElement/importFromXML"

export function importPageFromXML<To extends Page | undefined>(
  context: ConfigurationContext,
  xml: ToXMLType<To> | undefined
): To {
  if (xml === undefined) return undefined as To

  const baseFields = importBaseElementFromXML(context, xml)

  const result: Page = {
    ...baseFields,
    elementType: "Page",
    childItems: [],
  }

  result.childItems = importChildItemsFromXML(context, xml.ChildItems)

  if (xml.EnableContentChange !== undefined) result.enableContentChange = xml.EnableContentChange

  if (xml.Enabled !== undefined) result.enabled = xml.Enabled

  const extendedTooltip = importExtendedTooltipFromXML(context, xml.ExtendedTooltip)
  if (extendedTooltip !== undefined) result.extendedTooltip = extendedTooltip

  if (xml.Height !== undefined) result.height = xml.Height

  if (xml.HorizontalAlignInGroup !== undefined) result.horizontalAlignInGroup = xml.HorizontalAlignInGroup

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

  const backColor = importColorFromXML(context, xml.BackColor)
  if (backColor !== undefined) result.backColor = backColor

  if (xml.ChildItemsHorizontalAlign !== undefined) result.childItemsHorizontalAlign = xml.ChildItemsHorizontalAlign

  if (xml.ChildItemsVerticalAlign !== undefined) result.childItemsVerticalAlign = xml.ChildItemsVerticalAlign

  if (xml._DisplayImportance !== undefined) result.displayImportance = xml._DisplayImportance

  const format = importI8nTextFromXML(context, xml.Format)
  if (format !== undefined) result.format = format

  if (xml.Group !== undefined) result.group = xml.Group

  if (xml.HorizontalSpacing !== undefined) result.horizontalSpacing = xml.HorizontalSpacing

  if (xml.ItemsAndTitlesAlign !== undefined) result.itemsAndTitlesAlign = xml.ItemsAndTitlesAlign

  const picture = importPictureFromXML(context, xml.Picture)
  if (picture !== undefined) result.picture = picture

  if (xml.ScrollOnCompress !== undefined) result.scrollOnCompress = xml.ScrollOnCompress

  if (xml.ShowTitle !== undefined) result.showTitle = xml.ShowTitle

  if (xml.SlaveItemsWidth !== undefined) result.slaveItemsWidth = xml.SlaveItemsWidth

  if (xml.TitleDataPath !== undefined) result.titleDataPath = xml.TitleDataPath

  const userVisible = importUserVisibleFromXML(context, xml.UserVisible)
  if (userVisible !== undefined) result.userVisible = userVisible

  if (xml.VerticalAlign !== undefined) result.verticalAlign = xml.VerticalAlign

  if (xml.VerticalScrollOnReduceSize !== undefined) result.verticalScrollOnReduceSize = xml.VerticalScrollOnReduceSize

  if (xml.VerticalSpacing !== undefined) result.verticalSpacing = xml.VerticalSpacing

  // const events = importEventsFromXML(context, xml.Events)
  // if (events !== undefined) result.events = events

  return result as To
}

registerMetadata("ImportFromXML", "Page", importPageFromXML as ImportFromXMLFn)
