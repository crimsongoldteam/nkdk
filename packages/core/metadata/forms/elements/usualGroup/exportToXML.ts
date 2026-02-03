import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML, exportI8nTextToXMLWithDefaultLanguage } from "~/metadata/commonObjects/i8nText/exportToXML"
import { exportMetadataSimpleValueToXML } from "~/metadata/commonObjects/metadataValue/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportChildItemsToXML } from "~/metadata/forms/collections/childItems/exportToXML"
import { UsualGroup, UsualGroupXML } from "~/metadata/forms/elements/usualGroup/types"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportToXMLFn, ToXMLType } from "~/metadata/metadataFactory/types"
import { exportElementPropsToXML } from "../baseElement/exportToXML"
import { exportExtendedTooltipToXML } from "../extendedTooltip/exportToXML"
import { PropertyRule } from "../calendarField/rules"

export function exportUsualGroupToXML<From extends UsualGroup | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: From
): ToXMLType<From> {
  if (data === undefined) return undefined as ToXMLType<From>

  const baseFields = exportElementPropsToXML(context, undefined, data)

  const result: UsualGroupXML = {
    ...baseFields,
  } as UsualGroupXML

  const childItems = exportChildItemsToXML(context, undefined, data.childItems)
  if (childItems !== undefined) result.ChildItems = childItems

  result.ExtendedTooltip = exportExtendedTooltipToXML(context, undefined, data.extendedTooltip, data)

  const table = exportMetadataSimpleValueToXML(context, undefined, data.table, "string")
  if (table !== undefined) result.AssociatedTableElementId = table

  if (data.enableContentChange !== undefined) result.EnableContentChange = data.enableContentChange

  if (data.enabled !== undefined) result.Enabled = data.enabled

  if (data.height !== undefined) result.Height = data.height

  if (data.horizontalAlignInGroup !== undefined) result.GroupHorizontalAlign = data.horizontalAlignInGroup

  if (data.horizontalStretch !== undefined) result.HorizontalStretch = data.horizontalStretch

  if (data.readOnly !== undefined) result.ReadOnly = data.readOnly

  if (data.shortcut !== undefined) result.Shortcut = data.shortcut

  const title = exportI8nTextToXMLWithDefaultLanguage(context, data.title)
  if (title !== undefined) result.Title = title

  const titleFont = exportFontToXML(context, undefined, data.titleFont)
  if (titleFont !== undefined) result.TitleFont = titleFont

  const titleTextColor = exportColorToXML(context, undefined, data.titleTextColor)
  if (titleTextColor !== undefined) result.TitleTextColor = titleTextColor

  const toolTip = exportI8nTextToXML(context, undefined, data.toolTip)
  if (toolTip !== undefined) result.ToolTip = toolTip

  if (data.toolTipRepresentation !== undefined) result.ToolTipRepresentation = data.toolTipRepresentation

  if (data.verticalAlignInGroup !== undefined) result.GroupVerticalAlign = data.verticalAlignInGroup

  if (data.verticalStretch !== undefined) result.VerticalStretch = data.verticalStretch

  if (data.visible !== undefined) result.Visible = data.visible

  if (data.width !== undefined) result.Width = data.width

  const backColor = exportColorToXML(context, undefined, data.backColor)
  if (backColor !== undefined) result.BackColor = backColor

  if (data.behavior !== undefined) result.Behavior = data.behavior

  if (data.childItemsHorizontalAlign !== undefined) result.HorizontalAlign = data.childItemsHorizontalAlign

  if (data.childItemsVerticalAlign !== undefined) result.VerticalAlign = data.childItemsVerticalAlign

  const collapsedRepresentationTitle = exportI8nTextToXML(context, undefined, data.collapsedRepresentationTitle)
  if (collapsedRepresentationTitle !== undefined) result.CollapsedRepresentationTitle = collapsedRepresentationTitle

  if (data.controlRepresentation !== undefined) result.ControlRepresentation = data.controlRepresentation

  if (data.currentRowUse !== undefined) result.CurrentRowUse = data.currentRowUse

  if (data.displayImportance !== undefined) result._DisplayImportance = data.displayImportance

  const format = exportI8nTextToXML(context, undefined, data.format)
  if (format !== undefined) result.Format = format

  if (data.group !== undefined) result.Group = data.group

  if (data.horizontalAlignInGroup !== undefined) result.GroupHorizontalAlign = data.horizontalAlignInGroup

  if (data.verticalAlignInGroup !== undefined) result.GroupVerticalAlign = data.verticalAlignInGroup

  const hiddenRepresentationTitleBackColor = exportColorToXML(
    context,
    undefined,
    data.hiddenRepresentationTitleBackColor
  )
  if (hiddenRepresentationTitleBackColor !== undefined)
    result.HiddenStateTitleBackColor = hiddenRepresentationTitleBackColor

  if (data.horizontalSpacing !== undefined) result.HorizontalSpacing = data.horizontalSpacing

  if (data.itemsAndTitlesAlign !== undefined) result.ChildrenAlign = data.itemsAndTitlesAlign

  if (data.representation !== undefined) result.Representation = data.representation

  if (data.showLeftMargin !== undefined) result.ShowLeftMargin = data.showLeftMargin

  if (data.showTitle !== undefined) result.ShowTitle = data.showTitle

  if (data.throughAlign !== undefined) result.ThroughAlign = data.throughAlign

  if (data.titleDataPath !== undefined) result.TitleDataPath = data.titleDataPath

  if (data.united !== undefined) result.United = data.united

  const userVisible = exportUserVisibleToXML(context, undefined, data.userVisible)
  if (userVisible !== undefined) result.UserVisible = userVisible

  if (data.verticalSpacing !== undefined) result.VerticalSpacing = data.verticalSpacing

  if (data.collapsed !== undefined) result.Collapsed = data.collapsed

  return sortObject(result) as ToXMLType<From>
}

registerMetadata("ExportToXML", "UsualGroup", exportUsualGroupToXML as ExportToXMLFn)
