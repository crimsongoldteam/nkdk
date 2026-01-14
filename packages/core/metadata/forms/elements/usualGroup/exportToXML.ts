import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportI8nTextToXML } from "~/metadata/commonObjects/i8nText/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportChildItemsToXML } from "~/metadata/forms/collections/childItems/exportToXML"
import { exportFormGroupPropsToXML } from "~/metadata/forms/elements/formGroup/exportToXML"
import { UsualGroup, UsualGroupXML } from "~/metadata/forms/elements/usualGroup/types"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ToXMLType } from "~/metadata/metadataFactory/types"
import { exportExtendedTooltipToXML } from "../extendedTooltip/exportToXML"

export function exportUsualGroupToXML<From extends UsualGroup | undefined>(
  context: ConfigurationContext,
  data: From
): ToXMLType<From> {
  if (data === undefined) return undefined as ToXMLType<From>

  const baseFields = exportFormGroupPropsToXML(context, data)

  const extendedTooltip = exportExtendedTooltipToXML(context, data.extendedTooltip, data)

  const result: UsualGroupXML = {
    ExtendedTooltip: extendedTooltip,
    ...baseFields,
  }

  const childItems = exportChildItemsToXML(context, data.childItems)
  if (childItems !== undefined) result.ChildItems = childItems

  // const associatedTable = exportTableToXML(context, data.associatedTable)
  // if (associatedTable !== undefined) result.AssociatedTable = associatedTable

  const backColor = exportColorToXML(context, data.backColor)
  if (backColor !== undefined) result.BackColor = backColor

  if (data.behavior !== undefined) result.Behavior = data.behavior

  if (data.childItemsHorizontalAlign !== undefined) result.ChildItemsHorizontalAlign = data.childItemsHorizontalAlign

  if (data.childItemsVerticalAlign !== undefined) result.ChildItemsVerticalAlign = data.childItemsVerticalAlign

  if (data.collapsedRepresentationTitle !== undefined)
    result.CollapsedRepresentationTitle = data.collapsedRepresentationTitle

  if (data.controlRepresentation !== undefined) result.ControlRepresentation = data.controlRepresentation

  if (data.currentRowUse !== undefined) result.CurrentRowUse = data.currentRowUse

  if (data.displayImportance !== undefined) result._DisplayImportance = data.displayImportance

  const format = exportI8nTextToXML(context, data.format)
  if (format !== undefined) result.Format = format

  if (data.group !== undefined) result.Group = data.group

  if (data.groupHorizontalAlign !== undefined) result.GroupHorizontalAlign = data.groupHorizontalAlign

  if (data.groupVerticalAlign !== undefined) result.GroupVerticalAlign = data.groupVerticalAlign

  const hiddenRepresentationTitleBackColor = exportColorToXML(context, data.hiddenRepresentationTitleBackColor)
  if (hiddenRepresentationTitleBackColor !== undefined)
    result.HiddenRepresentationTitleBackColor = hiddenRepresentationTitleBackColor

  if (data.horizontalSpacing !== undefined) result.HorizontalSpacing = data.horizontalSpacing

  if (data.itemsAndTitlesAlign !== undefined) result.ItemsAndTitlesAlign = data.itemsAndTitlesAlign

  if (data.representation !== undefined) result.Representation = data.representation

  if (data.showLeftMargin !== undefined) result.ShowLeftMargin = data.showLeftMargin

  if (data.showTitle !== undefined) result.ShowTitle = data.showTitle

  if (data.slaveItemsWidth !== undefined) result.SlaveItemsWidth = data.slaveItemsWidth

  if (data.throughAlign !== undefined) result.ThroughAlign = data.throughAlign

  if (data.titleDataPath !== undefined) result.TitleDataPath = data.titleDataPath

  if (data.united !== undefined) result.United = data.united

  const userVisible = exportUserVisibleToXML(context, data.userVisible)
  if (userVisible !== undefined) result.UserVisible = userVisible

  if (data.verticalAlign !== undefined) result.VerticalAlign = data.verticalAlign

  if (data.verticalSpacing !== undefined) result.VerticalSpacing = data.verticalSpacing

  return sortObject(result) as ToXMLType<From>
}

registerMetadata("ExportToXML", "UsualGroup", exportUsualGroupToXML)
