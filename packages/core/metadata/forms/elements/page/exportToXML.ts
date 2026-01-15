import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML } from "~/metadata/commonObjects/i8nText/exportToXML"
import { exportPictureToXML } from "~/metadata/commonObjects/picture/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportChildItemsToXML } from "~/metadata/forms/collections/childItems/exportToXML"
import { Page, PageXML } from "~/metadata/forms/elements/page/types"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportToXMLFn, ToXMLType } from "~/metadata/metadataFactory/types"
import { exportElementPropsToXML } from "../baseElement/exportToXML"

export function exportPageToXML<From extends Page | undefined>(
  context: ConfigurationContext,
  data: From
): ToXMLType<From> {
  if (data === undefined) return undefined as ToXMLType<From>

  const baseFields = exportElementPropsToXML(context, data)

  const result: PageXML = {
    ...baseFields,
  }

  if (data.enableContentChange !== undefined) result.EnableContentChange = data.enableContentChange

  if (data.enabled !== undefined) result.Enabled = data.enabled

  if (data.height !== undefined) result.Height = data.height

  if (data.horizontalAlignInGroup !== undefined) result.HorizontalAlignInGroup = data.horizontalAlignInGroup

  if (data.horizontalStretch !== undefined) result.HorizontalStretch = data.horizontalStretch

  if (data.readOnly !== undefined) result.ReadOnly = data.readOnly

  if (data.shortcut !== undefined) result.Shortcut = data.shortcut

  const title = exportI8nTextToXML(context, data.title)
  if (title !== undefined) result.Title = title

  const titleFont = exportFontToXML(context, data.titleFont)
  if (titleFont !== undefined) result.TitleFont = titleFont

  const titleTextColor = exportColorToXML(context, data.titleTextColor)
  if (titleTextColor !== undefined) result.TitleTextColor = titleTextColor

  const toolTip = exportI8nTextToXML(context, data.toolTip)
  if (toolTip !== undefined) result.ToolTip = toolTip

  if (data.toolTipRepresentation !== undefined) result.ToolTipRepresentation = data.toolTipRepresentation

  if (data.type !== undefined) result.Type = data.type

  if (data.verticalAlignInGroup !== undefined) result.VerticalAlignInGroup = data.verticalAlignInGroup

  if (data.verticalStretch !== undefined) result.VerticalStretch = data.verticalStretch

  if (data.visible !== undefined) result.Visible = data.visible

  if (data.width !== undefined) result.Width = data.width

  const childItems = exportChildItemsToXML(context, data.childItems)
  if (childItems !== undefined) result.ChildItems = childItems

  const backColor = exportColorToXML(context, data.backColor)
  if (backColor !== undefined) result.BackColor = backColor

  if (data.childItemsHorizontalAlign !== undefined) result.ChildItemsHorizontalAlign = data.childItemsHorizontalAlign

  if (data.childItemsVerticalAlign !== undefined) result.ChildItemsVerticalAlign = data.childItemsVerticalAlign

  if (data.displayImportance !== undefined) result._DisplayImportance = data.displayImportance

  const format = exportI8nTextToXML(context, data.format)
  if (format !== undefined) result.Format = format

  if (data.group !== undefined) result.Group = data.group

  if (data.horizontalSpacing !== undefined) result.HorizontalSpacing = data.horizontalSpacing

  if (data.itemsAndTitlesAlign !== undefined) result.ItemsAndTitlesAlign = data.itemsAndTitlesAlign

  const picture = exportPictureToXML(context, data.picture)
  if (picture !== undefined) result.Picture = picture

  if (data.scrollOnCompress !== undefined) result.ScrollOnCompress = data.scrollOnCompress

  if (data.showTitle !== undefined) result.ShowTitle = data.showTitle

  if (data.slaveItemsWidth !== undefined) result.SlaveItemsWidth = data.slaveItemsWidth

  if (data.titleDataPath !== undefined) result.TitleDataPath = data.titleDataPath

  const userVisible = exportUserVisibleToXML(context, data.userVisible)
  if (userVisible !== undefined) result.UserVisible = userVisible

  if (data.verticalAlign !== undefined) result.VerticalAlign = data.verticalAlign

  if (data.verticalScrollOnReduceSize !== undefined) result.VerticalScrollOnReduceSize = data.verticalScrollOnReduceSize

  if (data.verticalSpacing !== undefined) result.VerticalSpacing = data.verticalSpacing

  return sortObject(result) as ToXMLType<From>
}

registerMetadata("ExportToXML", "Page", exportPageToXML as ExportToXMLFn)
