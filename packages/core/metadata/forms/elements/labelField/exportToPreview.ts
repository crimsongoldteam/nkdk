import { exportColorToPreview } from "~/metadata/commonObjects/color/exportToPreview"
import { exportFontToPreview } from "~/metadata/commonObjects/font/exportToPreview"
import { exportI8nTextToPreview } from "~/metadata/commonObjects/i8nText/exportToPreview"
import { exportPictureToPreview } from "~/metadata/commonObjects/picture/exportToPreview"
import { ConfigurationContext } from "~/metadata/context/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportToPreviewFn } from "~/metadata/metadataFactory/types"
import { exportSystemEnumerationToPreview } from "~/metadata/systemEnumerations/exportToPreview"
import { getAttributeName } from "../../preview/getAttributeName"
import { LabelField, LabelFieldPreview } from "./types"

const exportBorderToPreview = (element: LabelField["border"]): LabelFieldPreview["Border"] => {
  if (!element) return undefined
  return {
    type: "border",
    borderType: element.controlBorderType,
    width: element.width,
  }
}

export const exportLabelFieldToPreview = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  element: LabelField
): LabelFieldPreview => {
  const result: LabelFieldPreview = {
    ElementType: "FormField",
    Name: element.name,
    Type: exportSystemEnumerationToPreview(context, "LabelField", "FormFieldType")!,
  }

  if (element.autoCellHeight !== undefined) result.AutoCellHeight = element.autoCellHeight

  if (element.autoMaxHeight !== undefined) result.AutoMaxHeight = element.autoMaxHeight

  if (element.autoMaxWidth !== undefined) result.AutoMaxWidth = element.autoMaxWidth

  const backColor = exportColorToPreview(context, element.backColor)
  if (backColor !== undefined) result.BackColor = backColor

  const border = exportBorderToPreview(element.border)
  if (border !== undefined) result.Border = border

  const borderColor = exportColorToPreview(context, element.borderColor)
  if (borderColor !== undefined) result.BorderColor = borderColor

  if (element.font !== undefined) result.Font = exportFontToPreview(context, element.font)

  const format = exportI8nTextToPreview(context, element.format)
  if (format !== undefined) result.Format = format

  if (element.height !== undefined) result.Height = element.height

  if (element.horizontalStretch !== undefined) result.HorizontalStretch = element.horizontalStretch

  if (element.hyperlink !== undefined) result.Hyperlink = element.hyperlink

  if (element.markNegatives !== undefined) result.MarkNegatives = element.markNegatives

  if (element.maxHeight !== undefined) result.MaxHeight = element.maxHeight

  if (element.maxWidth !== undefined) result.MaxWidth = element.maxWidth

  if (element.passwordMode !== undefined) result.PasswordMode = element.passwordMode

  const textColor = exportColorToPreview(context, element.textColor)
  if (textColor !== undefined) result.TextColor = textColor

  if (element.verticalStretch !== undefined) result.VerticalStretch = element.verticalStretch

  if (element.width !== undefined) result.Width = element.width

  if (element.autoCellHeight !== undefined) result.AutoCellHeight = element.autoCellHeight

  if (element.cellHyperlink !== undefined) result.CellHyperlink = element.cellHyperlink

  const dataPath = getAttributeName(context, element.dataPath)
  if (dataPath !== undefined) result.DataPath = dataPath

  if (element.defaultItem !== undefined) result.DefaultItem = element.defaultItem

  const displayImportance = exportSystemEnumerationToPreview(context, element.displayImportance, "DisplayImportance")
  if (displayImportance !== undefined) result.DisplayImportance = displayImportance

  const editMode = exportSystemEnumerationToPreview(context, element.editMode, "ColumnEditMode")
  if (editMode !== undefined) result.EditMode = editMode

  if (element.enabled !== undefined) result.Enabled = element.enabled

  const fixingInTable = exportSystemEnumerationToPreview(context, element.fixingInTable, "FixingInTable")
  if (fixingInTable !== undefined) result.FixingInTable = fixingInTable

  const footerBackColor = exportColorToPreview(context, element.footerBackColor)
  if (footerBackColor !== undefined) result.FooterBackColor = footerBackColor

  const footerDataPath = getAttributeName(context, element.footerDataPath)
  if (footerDataPath !== undefined) result.FooterDataPath = footerDataPath

  const footerFont = exportFontToPreview(context, element.footerFont)
  if (footerFont !== undefined) result.FooterFont = footerFont

  const footerHorizontalAlign = exportSystemEnumerationToPreview(
    context,
    element.footerHorizontalAlign,
    "HorizontalAlign"
  )
  if (footerHorizontalAlign !== undefined) result.FooterHorizontalAlign = footerHorizontalAlign

  const footerPicture = exportPictureToPreview(context, element.footerPicture)
  if (footerPicture !== undefined) result.FooterPicture = footerPicture

  const footerText = exportI8nTextToPreview(context, element.footerText)
  if (footerText !== undefined) result.FooterText = footerText

  const footerTextColor = exportColorToPreview(context, element.footerTextColor)
  if (footerTextColor !== undefined) result.FooterTextColor = footerTextColor

  const headerHorizontalAlign = exportSystemEnumerationToPreview(
    context,
    element.headerHorizontalAlign,
    "HorizontalAlign"
  )
  if (headerHorizontalAlign !== undefined) result.HeaderHorizontalAlign = headerHorizontalAlign

  const headerPicture = exportPictureToPreview(context, element.headerPicture)
  if (headerPicture !== undefined) result.HeaderPicture = headerPicture

  const horizontalAlign = exportSystemEnumerationToPreview(context, element.horizontalAlign, "HorizontalAlign")
  if (horizontalAlign !== undefined) result.HorizontalAlign = horizontalAlign

  const horizontalAlignInGroup = exportSystemEnumerationToPreview(
    context,
    element.horizontalAlignInGroup,
    "HorizontalAlign"
  )
  if (horizontalAlignInGroup !== undefined) result.HorizontalAlignInGroup = horizontalAlignInGroup

  if (element.readOnly !== undefined) result.ReadOnly = element.readOnly

  if (element.showInFooter !== undefined) result.ShowInFooter = element.showInFooter

  if (element.showInHeader !== undefined) result.ShowInHeader = element.showInHeader

  if (element.skipOnInput !== undefined) result.SkipOnInput = element.skipOnInput

  const title = exportI8nTextToPreview(context, element.title)
  if (title !== undefined) result.Title = title

  const titleBackColor = exportColorToPreview(context, element.titleBackColor)
  if (titleBackColor !== undefined) result.TitleBackColor = titleBackColor

  const titleFont = exportFontToPreview(context, element.titleFont)
  if (titleFont !== undefined) result.TitleFont = titleFont

  if (element.titleHeight !== undefined) result.TitleHeight = element.titleHeight

  const titleLocation = exportSystemEnumerationToPreview(context, element.titleLocation, "FormItemTitleLocation")
  if (titleLocation !== undefined) result.TitleLocation = titleLocation

  const titleTextColor = exportColorToPreview(context, element.titleTextColor)
  if (titleTextColor !== undefined) result.TitleTextColor = titleTextColor

  const toolTip = exportI8nTextToPreview(context, element.toolTip)
  if (toolTip !== undefined) result.ToolTip = toolTip

  const toolTipRepresentation = exportSystemEnumerationToPreview(
    context,
    element.toolTipRepresentation,
    "ToolTipRepresentation"
  )
  if (toolTipRepresentation !== undefined) result.ToolTipRepresentation = toolTipRepresentation

  const verticalAlign = exportSystemEnumerationToPreview(context, element.verticalAlign, "VerticalAlign")
  if (verticalAlign !== undefined) result.VerticalAlign = verticalAlign

  const verticalAlignInGroup = exportSystemEnumerationToPreview(context, element.verticalAlignInGroup, "VerticalAlign")
  if (verticalAlignInGroup !== undefined) result.VerticalAlignInGroup = verticalAlignInGroup

  if (element.visible !== undefined) result.Visible = element.visible

  const warningOnEdit = exportI8nTextToPreview(context, element.warningOnEdit)
  if (warningOnEdit !== undefined) result.WarningOnEdit = warningOnEdit

  const warningOnEditRepresentation = exportSystemEnumerationToPreview(
    context,
    element.warningOnEditRepresentation,
    "WarningOnEditRepresentation"
  )
  if (warningOnEditRepresentation !== undefined) result.WarningOnEditRepresentation = warningOnEditRepresentation

  return result
}

registerMetadata("ExportToPreview", "LabelField", exportLabelFieldToPreview as ExportToPreviewFn)
