import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML, exportI8nTextToXMLWithDefaultLanguage } from "~/metadata/commonObjects/i8nText/exportToXML"
import { exportPictureToXML } from "~/metadata/commonObjects/picture/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportChildItemsToXML } from "~/metadata/forms/collections/childItems/exportToXML"
import { exportExtendedTooltipToDeprecatedXML } from "~/metadata/forms/elements/extendedTooltip/exportToXML"
import { Page, PageXML } from "~/metadata/forms/elements/page/types"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportToXMLFn, ToXMLType } from "~/metadata/metadataFactory/types"
import { exportElementPropsToXML } from "../baseElement/exportToXML"
import { PropertyRule } from "../calendarField/rules"

export function exportPageToXML<From extends Page | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: From
): ToXMLType<From> {
  if (data === undefined) return undefined as ToXMLType<From>

  const baseFields = exportElementPropsToXML(context, undefined, data)

  const result: PageXML = {
    ...baseFields,
  } as PageXML

  const backColor = exportColorToXML(context, undefined, data.backColor)
  if (backColor !== undefined) result.BackColor = backColor

  const childItems = exportChildItemsToXML(context, undefined, data.childItems)
  if (childItems !== undefined) result.ChildItems = childItems

  if (data.childItemsHorizontalAlign !== undefined) result.ChildItemsHorizontalAlign = data.childItemsHorizontalAlign

  if (data.childItemsVerticalAlign !== undefined) result.ChildItemsVerticalAlign = data.childItemsVerticalAlign

  if (data.displayImportance !== undefined) result._DisplayImportance = data.displayImportance

  if (data.enableContentChange !== undefined) result.EnableContentChange = data.enableContentChange

  if (data.enabled !== undefined) result.Enabled = data.enabled

  const extendedTooltip = exportExtendedTooltipToDeprecatedXML(context, undefined, data.extendedTooltip, data)
  result.ExtendedTooltip = extendedTooltip

  const format = exportI8nTextToXML(context, undefined, data.format)
  if (format !== undefined) result.Format = format

  if (data.group !== undefined) result.Group = data.group

  if (data.height !== undefined) result.Height = data.height

  if (data.horizontalAlignInGroup !== undefined) result.GroupHorizontalAlign = data.horizontalAlignInGroup

  if (data.horizontalSpacing !== undefined) result.HorizontalSpacing = data.horizontalSpacing

  if (data.horizontalStretch !== undefined) result.HorizontalStretch = data.horizontalStretch

  if (data.itemsAndTitlesAlign !== undefined) result.ItemsAndTitlesAlign = data.itemsAndTitlesAlign

  const picture = exportPictureToXML(context, undefined, data.picture)
  if (picture !== undefined) result.Picture = picture

  if (data.readOnly !== undefined) result.ReadOnly = data.readOnly

  if (data.scrollOnCompress !== undefined) result.ScrollOnCompress = data.scrollOnCompress

  if (data.shortcut !== undefined) result.Shortcut = data.shortcut

  if (data.showTitle !== undefined) result.ShowTitle = data.showTitle

  if (data.slaveItemsWidth !== undefined) result.SlaveItemsWidth = data.slaveItemsWidth

  const title = exportI8nTextToXMLWithDefaultLanguage(context, undefined, data.title)
  if (title !== undefined) result.Title = title

  if (data.titleDataPath !== undefined) result.TitleDataPath = data.titleDataPath

  const titleFont = exportFontToXML(context, undefined, data.titleFont)
  if (titleFont !== undefined) result.TitleFont = titleFont

  const titleTextColor = exportColorToXML(context, undefined, data.titleTextColor)
  if (titleTextColor !== undefined) result.TitleTextColor = titleTextColor

  const toolTip = exportI8nTextToXML(context, undefined, data.toolTip)
  if (toolTip !== undefined) result.ToolTip = toolTip

  if (data.toolTipRepresentation !== undefined) result.ToolTipRepresentation = data.toolTipRepresentation

  if (data.type !== undefined) result.Type = data.type

  const userVisible = exportUserVisibleToXML(context, undefined, data.userVisible)
  if (userVisible !== undefined) result.UserVisible = userVisible

  if (data.verticalAlign !== undefined) result.VerticalAlign = data.verticalAlign

  if (data.verticalAlignInGroup !== undefined) result.GroupVerticalAlign = data.verticalAlignInGroup

  if (data.verticalScrollOnReduceSize !== undefined) result.VerticalScrollOnReduceSize = data.verticalScrollOnReduceSize

  if (data.verticalSpacing !== undefined) result.VerticalSpacing = data.verticalSpacing

  if (data.verticalStretch !== undefined) result.VerticalStretch = data.verticalStretch

  if (data.visible !== undefined) result.Visible = data.visible

  if (data.width !== undefined) result.Width = data.width

  return sortObject(result) as ToXMLType<From>
}

registerMetadata("ExportToXML", "Page", exportPageToXML as ExportToXMLFn)
