import { exportColorToPreview } from "~/metadata/commonObjects/color/exportToPreview"
import { exportFontToPreview } from "~/metadata/commonObjects/font/exportToPreview"
import { exportI8nTextToPreview } from "~/metadata/commonObjects/i8nText/exportToPreview"
import { exportPictureToPreview } from "~/metadata/commonObjects/picture/exportToPreview"
import { ConfigurationContext } from "~/metadata/context/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportToPreviewFn } from "~/metadata/metadataFactory/types"
import { exportSystemEnumerationDeprecatedToPreview } from "~/metadata/systemEnumerations/exportToPreview"
import { getAttributeName } from "../../preview/getAttributeName"
import { PropertyRule } from "../calendarField/rules"
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
  _rule: PropertyRule<any>,
  element: LabelField
): LabelFieldPreview => {
  const result: LabelFieldPreview = {
    ElementType: "FormField",
    Name: element.name,
    Type: exportSystemEnumerationDeprecatedToPreview(context, undefined, "LabelField", "FormFieldType")!,
  }

  if (element.autoCellHeight !== undefined) result.AutoCellHeight = element.autoCellHeight

  if (element.autoMaxHeight !== undefined) result.AutoMaxHeight = element.autoMaxHeight

  if (element.autoMaxWidth !== undefined) result.AutoMaxWidth = element.autoMaxWidth

  const backColor = exportColorToPreview(context, undefined, element.backColor)
  if (backColor !== undefined) result.BackColor = backColor

  const border = exportBorderToPreview(element.border)
  if (border !== undefined) result.Border = border

  const borderColor = exportColorToPreview(context, undefined, element.borderColor)
  if (borderColor !== undefined) result.BorderColor = borderColor

  if (element.font !== undefined) result.Font = exportFontToPreview(context, undefined, element.font)

  const format = exportI8nTextToPreview(context, undefined, element.format)
  if (format !== undefined) result.Format = format

  if (element.height !== undefined) result.Height = element.height

  if (element.horizontalStretch !== undefined) result.HorizontalStretch = element.horizontalStretch

  if (element.hyperlink !== undefined) result.Hyperlink = element.hyperlink

  if (element.markNegatives !== undefined) result.MarkNegatives = element.markNegatives

  if (element.maxHeight !== undefined) result.MaxHeight = element.maxHeight

  if (element.maxWidth !== undefined) result.MaxWidth = element.maxWidth

  if (element.passwordMode !== undefined) result.PasswordMode = element.passwordMode

  const textColor = exportColorToPreview(context, undefined, element.textColor)
  if (textColor !== undefined) result.TextColor = textColor

  if (element.verticalStretch !== undefined) result.VerticalStretch = element.verticalStretch

  if (element.width !== undefined) result.Width = element.width

  if (element.autoCellHeight !== undefined) result.AutoCellHeight = element.autoCellHeight

  if (element.cellHyperlink !== undefined) result.CellHyperlink = element.cellHyperlink

  const dataPath = getAttributeName(context, element.dataPath)
  if (dataPath !== undefined) result.DataPath = dataPath

  if (element.defaultItem !== undefined) result.DefaultItem = element.defaultItem

  const displayImportance = exportSystemEnumerationDeprecatedToPreview(
    context,
    undefined,
    element.displayImportance,
    "DisplayImportance"
  )
  if (displayImportance !== undefined) result.DisplayImportance = displayImportance

  const editMode = exportSystemEnumerationDeprecatedToPreview(context, undefined, element.editMode, "ColumnEditMode")
  if (editMode !== undefined) result.EditMode = editMode

  if (element.enabled !== undefined) result.Enabled = element.enabled

  const fixingInTable = exportSystemEnumerationDeprecatedToPreview(
    context,
    undefined,
    element.fixingInTable,
    "FixingInTable"
  )
  if (fixingInTable !== undefined) result.FixingInTable = fixingInTable

  const footerBackColor = exportColorToPreview(context, undefined, element.footerBackColor)
  if (footerBackColor !== undefined) result.FooterBackColor = footerBackColor

  const footerDataPath = getAttributeName(context, element.footerDataPath)
  if (footerDataPath !== undefined) result.FooterDataPath = footerDataPath

  const footerFont = exportFontToPreview(context, undefined, element.footerFont)
  if (footerFont !== undefined) result.FooterFont = footerFont

  const footerHorizontalAlign = exportSystemEnumerationDeprecatedToPreview(
    context,
    undefined,
    element.footerHorizontalAlign,
    "HorizontalAlign"
  )
  if (footerHorizontalAlign !== undefined) result.FooterHorizontalAlign = footerHorizontalAlign

  const footerPicture = exportPictureToPreview(context, undefined, element.footerPicture)
  if (footerPicture !== undefined) result.FooterPicture = footerPicture

  const footerText = exportI8nTextToPreview(context, undefined, element.footerText)
  if (footerText !== undefined) result.FooterText = footerText

  const footerTextColor = exportColorToPreview(context, undefined, element.footerTextColor)
  if (footerTextColor !== undefined) result.FooterTextColor = footerTextColor

  const headerHorizontalAlign = exportSystemEnumerationDeprecatedToPreview(
    context,
    undefined,
    element.headerHorizontalAlign,
    "HorizontalAlign"
  )
  if (headerHorizontalAlign !== undefined) result.HeaderHorizontalAlign = headerHorizontalAlign

  const headerPicture = exportPictureToPreview(context, undefined, element.headerPicture)
  if (headerPicture !== undefined) result.HeaderPicture = headerPicture

  const horizontalAlign = exportSystemEnumerationDeprecatedToPreview(
    context,
    undefined,
    element.horizontalAlign,
    "HorizontalAlign"
  )
  if (horizontalAlign !== undefined) result.HorizontalAlign = horizontalAlign

  const horizontalAlignInGroup = exportSystemEnumerationDeprecatedToPreview(
    context,
    undefined,
    element.horizontalAlignInGroup,
    "HorizontalAlign"
  )
  if (horizontalAlignInGroup !== undefined) result.HorizontalAlignInGroup = horizontalAlignInGroup

  if (element.readOnly !== undefined) result.ReadOnly = element.readOnly

  if (element.showInFooter !== undefined) result.ShowInFooter = element.showInFooter

  if (element.showInHeader !== undefined) result.ShowInHeader = element.showInHeader

  if (element.skipOnInput !== undefined) result.SkipOnInput = element.skipOnInput

  const title = exportI8nTextToPreview(context, undefined, element.title)
  if (title !== undefined) result.Title = title

  const titleBackColor = exportColorToPreview(context, undefined, element.titleBackColor)
  if (titleBackColor !== undefined) result.TitleBackColor = titleBackColor

  const titleFont = exportFontToPreview(context, undefined, element.titleFont)
  if (titleFont !== undefined) result.TitleFont = titleFont

  if (element.titleHeight !== undefined) result.TitleHeight = element.titleHeight

  const titleLocation = exportSystemEnumerationDeprecatedToPreview(
    context,
    undefined,
    element.titleLocation,
    "FormItemTitleLocation"
  )
  if (titleLocation !== undefined) result.TitleLocation = titleLocation

  const titleTextColor = exportColorToPreview(context, undefined, element.titleTextColor)
  if (titleTextColor !== undefined) result.TitleTextColor = titleTextColor

  const toolTip = exportI8nTextToPreview(context, undefined, element.toolTip)
  if (toolTip !== undefined) result.ToolTip = toolTip

  const toolTipRepresentation = exportSystemEnumerationDeprecatedToPreview(
    context,
    undefined,
    element.toolTipRepresentation,
    "ToolTipRepresentation"
  )
  if (toolTipRepresentation !== undefined) result.ToolTipRepresentation = toolTipRepresentation

  const verticalAlign = exportSystemEnumerationDeprecatedToPreview(
    context,
    undefined,
    element.verticalAlign,
    "VerticalAlign"
  )
  if (verticalAlign !== undefined) result.VerticalAlign = verticalAlign

  const verticalAlignInGroup = exportSystemEnumerationDeprecatedToPreview(
    context,
    undefined,
    element.verticalAlignInGroup,
    "VerticalAlign"
  )
  if (verticalAlignInGroup !== undefined) result.VerticalAlignInGroup = verticalAlignInGroup

  if (element.visible !== undefined) result.Visible = element.visible

  const warningOnEdit = exportI8nTextToPreview(context, undefined, element.warningOnEdit)
  if (warningOnEdit !== undefined) result.WarningOnEdit = warningOnEdit

  const warningOnEditRepresentation = exportSystemEnumerationDeprecatedToPreview(
    context,
    undefined,
    element.warningOnEditRepresentation,
    "WarningOnEditRepresentation"
  )
  if (warningOnEditRepresentation !== undefined) result.WarningOnEditRepresentation = warningOnEditRepresentation

  return result
}

registerMetadata("ExportToPreview", "LabelField", exportLabelFieldToPreview as ExportToPreviewFn)
