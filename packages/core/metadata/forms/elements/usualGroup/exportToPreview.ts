import { exportColorToPreview } from "~/metadata/commonObjects/color/exportToPreview"
import { exportFontToPreview } from "~/metadata/commonObjects/font/exportToPreview"
import { exportI8nTextToPreview } from "~/metadata/commonObjects/i8nText/exportToPreview"
import { ConfigurationContext } from "~/metadata/context/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportToPreviewFn } from "~/metadata/metadataFactory/types"
import { exportSystemEnumerationToPreview } from "~/metadata/systemEnumerations/exportToPreview"
import { exportChildItemsToPreview } from "../../collections/childItems/exportToPreview"
import { UsualGroup, UsualGroupPreview } from "./types"

export const exportUsualGroupToPreview = (context: ConfigurationContext, element: UsualGroup): UsualGroupPreview => {
  const result: UsualGroupPreview = {
    ElementType: "FormGroup",
    Name: element.name,
  }

  if (element.backColor !== undefined) {
    const backColor = exportColorToPreview(context, element.backColor)
    if (backColor !== undefined) result.BackColor = backColor
  }

  if (element.behavior !== undefined) {
    const behavior = exportSystemEnumerationToPreview(context, element.behavior, "UsualGroupBehavior")
    if (behavior !== undefined) result.Behavior = behavior
  }

  if (element.collapsed !== undefined) result.Collapsed = element.collapsed

  if (element.collapsedRepresentationTitle !== undefined) {
    const collapsedRepresentationTitle = exportI8nTextToPreview(context, element.collapsedRepresentationTitle)
    if (collapsedRepresentationTitle !== undefined) result.CollapsedRepresentationTitle = collapsedRepresentationTitle
  }

  if (element.controlRepresentation !== undefined) {
    const controlRepresentation = exportSystemEnumerationToPreview(
      context,
      element.controlRepresentation,
      "UsualGroupControlRepresentation"
    )
    if (controlRepresentation !== undefined) result.ControlRepresentation = controlRepresentation
  }

  if (element.currentRowUse !== undefined) {
    const currentRowUse = exportSystemEnumerationToPreview(context, element.currentRowUse, "CurrentRowUse")
    if (currentRowUse !== undefined) result.CurrentRowUse = currentRowUse
  }

  if (element.displayImportance !== undefined) {
    const displayImportance = exportSystemEnumerationToPreview(context, element.displayImportance, "DisplayImportance")
    if (displayImportance !== undefined) result.DisplayImportance = displayImportance
  }

  if (element.enableContentChange !== undefined) result.EnableContentChange = element.enableContentChange

  if (element.enabled !== undefined) result.Enabled = element.enabled

  if (element.format !== undefined) {
    const format = exportI8nTextToPreview(context, element.format)
    if (format !== undefined) result.Format = format
  }

  if (element.group !== undefined) {
    const group = exportSystemEnumerationToPreview(context, element.group, "ChildFormItemsGroup")
    if (group !== undefined) result.Group = group
  }

  if (element.height !== undefined) result.Height = element.height

  if (element.hiddenRepresentationTitleBackColor !== undefined) {
    const hiddenRepresentationTitleBackColor = exportColorToPreview(context, element.hiddenRepresentationTitleBackColor)
    if (hiddenRepresentationTitleBackColor !== undefined)
      result.HiddenRepresentationTitleBackColor = hiddenRepresentationTitleBackColor
  }

  if (element.horizontalAlignInGroup !== undefined) {
    const horizontalAlign = exportSystemEnumerationToPreview(context, element.horizontalAlignInGroup, "HorizontalAlign")
    if (horizontalAlign !== undefined) result.HorizontalAlign = horizontalAlign
  }

  if (element.horizontalSpacing !== undefined) {
    const horizontalSpacing = exportSystemEnumerationToPreview(context, element.horizontalSpacing, "FormItemSpacing")
    if (horizontalSpacing !== undefined) result.HorizontalSpacing = horizontalSpacing
  }

  if (element.horizontalStretch !== undefined) result.HorizontalStretch = element.horizontalStretch

  if (element.itemsAndTitlesAlign !== undefined) {
    const itemsAndTitlesAlign = exportSystemEnumerationToPreview(
      context,
      element.itemsAndTitlesAlign,
      "ItemsAndTitlesAlignVariant"
    )
    if (itemsAndTitlesAlign !== undefined) result.ItemsAndTitlesAlign = itemsAndTitlesAlign
  }

  if (element.readOnly !== undefined) result.ReadOnly = element.readOnly

  if (element.representation !== undefined) {
    const representation = exportSystemEnumerationToPreview(context, element.representation, "UsualGroupRepresentation")
    if (representation !== undefined) result.Representation = representation
  }

  if (element.showLeftMargin !== undefined) result.ShowLeftMargin = element.showLeftMargin

  if (element.showTitle !== undefined) result.ShowTitle = element.showTitle

  if (element.throughAlign !== undefined) {
    const throughAlign = exportSystemEnumerationToPreview(context, element.throughAlign, "ThroughAlign")
    if (throughAlign !== undefined) result.ThroughAlign = throughAlign
  }

  if (element.title !== undefined) {
    const title = exportI8nTextToPreview(context, element.title)
    if (title !== undefined) result.Title = title
  }

  if (element.titleDataPath !== undefined) result.TitleDataPath = element.titleDataPath

  if (element.titleFont !== undefined) {
    const titleFont = exportFontToPreview(context, element.titleFont)
    if (titleFont !== undefined) result.TitleFont = titleFont
  }

  if (element.titleTextColor !== undefined) {
    const titleTextColor = exportColorToPreview(context, element.titleTextColor)
    if (titleTextColor !== undefined) result.TitleTextColor = titleTextColor
  }

  if (element.toolTip !== undefined) {
    const toolTip = exportI8nTextToPreview(context, element.toolTip)
    if (toolTip !== undefined) result.ToolTip = toolTip
  }

  if (element.toolTipRepresentation !== undefined) {
    const toolTipRepresentation = exportSystemEnumerationToPreview(
      context,
      element.toolTipRepresentation,
      "ToolTipRepresentation"
    )
    if (toolTipRepresentation !== undefined) result.ToolTipRepresentation = toolTipRepresentation
  }

  if (element.united !== undefined) result.United = element.united

  if (element.verticalAlignInGroup !== undefined) {
    const verticalAlign = exportSystemEnumerationToPreview(context, element.verticalAlignInGroup, "VerticalAlign")
    if (verticalAlign !== undefined) result.VerticalAlign = verticalAlign
  }

  if (element.verticalSpacing !== undefined) {
    const verticalSpacing = exportSystemEnumerationToPreview(context, element.verticalSpacing, "FormItemSpacing")
    if (verticalSpacing !== undefined) result.VerticalSpacing = verticalSpacing
  }

  if (element.verticalStretch !== undefined) result.VerticalStretch = element.verticalStretch

  if (element.visible !== undefined) result.Visible = element.visible

  if (element.width !== undefined) result.Width = element.width

  result.ChildItems = exportChildItemsToPreview(context, element.childItems)

  return result
}

registerMetadata("ExportToPreview", "UsualGroup", exportUsualGroupToPreview as ExportToPreviewFn)
