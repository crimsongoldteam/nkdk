// import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
// import { exportFontToEnterprise } from "~/metadata/commonObjects/font/exportToEnterprise"
// import { exportI8nTextToEnterprise } from "~/metadata/commonObjects/i8nText/exportToEnterprise"
// import { exportPictureToEnterprise } from "~/metadata/commonObjects/picture/exportToEnterprise"
// import { ConfigurationContext } from "~/metadata/context/types"
// import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
// import { ExportToEnterpriseFn } from "~/metadata/metadataFactory/types"
// import { exportSystemEnumerationDeprecatedToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
// import { getAttributeName } from "../../preview/getAttributeName"
// import { PropertyRule } from "../calendarField/rules"
// import { LabelField, LabelFieldEnterprise } from "./types"

// const exportBorderToEnterprise = (element: LabelField["border"]): LabelFieldEnterprise["Border"] => {
//   if (!element) return undefined
//   return {
//     type: "border",
//     borderType: element.controlBorderType,
//     width: element.width,
//   }
// }

// export const exportLabelFieldToEnterprise = (
//   context: ConfigurationContext,
//   _rule: PropertyRule<any>,
//   element: LabelField
// ): LabelFieldEnterprise => {
//   const result: LabelFieldEnterprise = {
//     itemType: "FormField",
//     Name: element.name,
//     Type: exportSystemEnumerationDeprecatedToEnterprise(context, undefined, "LabelField", "FormFieldType")!,
//   }

//   if (element.autoCellHeight !== undefined) result.AutoCellHeight = element.autoCellHeight

//   if (element.autoMaxHeight !== undefined) result.AutoMaxHeight = element.autoMaxHeight

//   if (element.autoMaxWidth !== undefined) result.AutoMaxWidth = element.autoMaxWidth

//   const backColor = exportColorToEnterprise(context, undefined, element.backColor)
//   if (backColor !== undefined) result.BackColor = backColor

//   const border = exportBorderToEnterprise(element.border)
//   if (border !== undefined) result.Border = border

//   const borderColor = exportColorToEnterprise(context, undefined, element.borderColor)
//   if (borderColor !== undefined) result.BorderColor = borderColor

//   if (element.font !== undefined) result.Font = exportFontToEnterprise(context, undefined, element.font)

//   const format = exportI8nTextToEnterprise(context, undefined, element.format)
//   if (format !== undefined) result.Format = format

//   if (element.height !== undefined) result.Height = element.height

//   if (element.horizontalStretch !== undefined) result.HorizontalStretch = element.horizontalStretch

//   if (element.hyperlink !== undefined) result.Hyperlink = element.hyperlink

//   if (element.markNegatives !== undefined) result.MarkNegatives = element.markNegatives

//   if (element.maxHeight !== undefined) result.MaxHeight = element.maxHeight

//   if (element.maxWidth !== undefined) result.MaxWidth = element.maxWidth

//   if (element.passwordMode !== undefined) result.PasswordMode = element.passwordMode

//   const textColor = exportColorToEnterprise(context, undefined, element.textColor)
//   if (textColor !== undefined) result.TextColor = textColor

//   if (element.verticalStretch !== undefined) result.VerticalStretch = element.verticalStretch

//   if (element.width !== undefined) result.Width = element.width

//   if (element.autoCellHeight !== undefined) result.AutoCellHeight = element.autoCellHeight

//   if (element.cellHyperlink !== undefined) result.CellHyperlink = element.cellHyperlink

//   const dataPath = getAttributeName(context, element.dataPath)
//   if (dataPath !== undefined) result.DataPath = dataPath

//   if (element.defaultItem !== undefined) result.DefaultItem = element.defaultItem

//   const displayImportance = exportSystemEnumerationDeprecatedToEnterprise(
//     context,
//     undefined,
//     element.displayImportance,
//     "DisplayImportance"
//   )
//   if (displayImportance !== undefined) result.DisplayImportance = displayImportance

//   const editMode = exportSystemEnumerationDeprecatedToEnterprise(context, undefined, element.editMode, "ColumnEditMode")
//   if (editMode !== undefined) result.EditMode = editMode

//   if (element.enabled !== undefined) result.Enabled = element.enabled

//   const fixingInTable = exportSystemEnumerationDeprecatedToEnterprise(
//     context,
//     undefined,
//     element.fixingInTable,
//     "FixingInTable"
//   )
//   if (fixingInTable !== undefined) result.FixingInTable = fixingInTable

//   const footerBackColor = exportColorToEnterprise(context, undefined, element.footerBackColor)
//   if (footerBackColor !== undefined) result.FooterBackColor = footerBackColor

//   const footerDataPath = getAttributeName(context, element.footerDataPath)
//   if (footerDataPath !== undefined) result.FooterDataPath = footerDataPath

//   const footerFont = exportFontToEnterprise(context, undefined, element.footerFont)
//   if (footerFont !== undefined) result.FooterFont = footerFont

//   const footerHorizontalAlign = exportSystemEnumerationDeprecatedToEnterprise(
//     context,
//     undefined,
//     element.footerHorizontalAlign,
//     "HorizontalAlign"
//   )
//   if (footerHorizontalAlign !== undefined) result.FooterHorizontalAlign = footerHorizontalAlign

//   const footerPicture = exportPictureToEnterprise(context, undefined, element.footerPicture)
//   if (footerPicture !== undefined) result.FooterPicture = footerPicture

//   const footerText = exportI8nTextToEnterprise(context, undefined, element.footerText)
//   if (footerText !== undefined) result.FooterText = footerText

//   const footerTextColor = exportColorToEnterprise(context, undefined, element.footerTextColor)
//   if (footerTextColor !== undefined) result.FooterTextColor = footerTextColor

//   const headerHorizontalAlign = exportSystemEnumerationDeprecatedToEnterprise(
//     context,
//     undefined,
//     element.headerHorizontalAlign,
//     "HorizontalAlign"
//   )
//   if (headerHorizontalAlign !== undefined) result.HeaderHorizontalAlign = headerHorizontalAlign

//   const headerPicture = exportPictureToEnterprise(context, undefined, element.headerPicture)
//   if (headerPicture !== undefined) result.HeaderPicture = headerPicture

//   const horizontalAlign = exportSystemEnumerationDeprecatedToEnterprise(
//     context,
//     undefined,
//     element.horizontalAlign,
//     "HorizontalAlign"
//   )
//   if (horizontalAlign !== undefined) result.HorizontalAlign = horizontalAlign

//   const horizontalAlignInGroup = exportSystemEnumerationDeprecatedToEnterprise(
//     context,
//     undefined,
//     element.horizontalAlignInGroup,
//     "HorizontalAlign"
//   )
//   if (horizontalAlignInGroup !== undefined) result.HorizontalAlignInGroup = horizontalAlignInGroup

//   if (element.readOnly !== undefined) result.ReadOnly = element.readOnly

//   if (element.showInFooter !== undefined) result.ShowInFooter = element.showInFooter

//   if (element.showInHeader !== undefined) result.ShowInHeader = element.showInHeader

//   if (element.skipOnInput !== undefined) result.SkipOnInput = element.skipOnInput

//   const title = exportI8nTextToEnterprise(context, undefined, element.title)
//   if (title !== undefined) result.Title = title

//   const titleBackColor = exportColorToEnterprise(context, undefined, element.titleBackColor)
//   if (titleBackColor !== undefined) result.TitleBackColor = titleBackColor

//   const titleFont = exportFontToEnterprise(context, undefined, element.titleFont)
//   if (titleFont !== undefined) result.TitleFont = titleFont

//   if (element.titleHeight !== undefined) result.TitleHeight = element.titleHeight

//   const titleLocation = exportSystemEnumerationDeprecatedToEnterprise(
//     context,
//     undefined,
//     element.titleLocation,
//     "FormItemTitleLocation"
//   )
//   if (titleLocation !== undefined) result.TitleLocation = titleLocation

//   const titleTextColor = exportColorToEnterprise(context, undefined, element.titleTextColor)
//   if (titleTextColor !== undefined) result.TitleTextColor = titleTextColor

//   const toolTip = exportI8nTextToEnterprise(context, undefined, element.toolTip)
//   if (toolTip !== undefined) result.ToolTip = toolTip

//   const toolTipRepresentation = exportSystemEnumerationDeprecatedToEnterprise(
//     context,
//     undefined,
//     element.toolTipRepresentation,
//     "ToolTipRepresentation"
//   )
//   if (toolTipRepresentation !== undefined) result.ToolTipRepresentation = toolTipRepresentation

//   const verticalAlign = exportSystemEnumerationDeprecatedToEnterprise(
//     context,
//     undefined,
//     element.verticalAlign,
//     "VerticalAlign"
//   )
//   if (verticalAlign !== undefined) result.VerticalAlign = verticalAlign

//   const verticalAlignInGroup = exportSystemEnumerationDeprecatedToEnterprise(
//     context,
//     undefined,
//     element.verticalAlignInGroup,
//     "VerticalAlign"
//   )
//   if (verticalAlignInGroup !== undefined) result.VerticalAlignInGroup = verticalAlignInGroup

//   if (element.visible !== undefined) result.Visible = element.visible

//   const warningOnEdit = exportI8nTextToEnterprise(context, undefined, element.warningOnEdit)
//   if (warningOnEdit !== undefined) result.WarningOnEdit = warningOnEdit

//   const warningOnEditRepresentation = exportSystemEnumerationDeprecatedToEnterprise(
//     context,
//     undefined,
//     element.warningOnEditRepresentation,
//     "WarningOnEditRepresentation"
//   )
//   if (warningOnEditRepresentation !== undefined) result.WarningOnEditRepresentation = warningOnEditRepresentation

//   return result
// }

// registerMetadata("ExportToEnterprise", "LabelField", exportLabelFieldToEnterprise as ExportToEnterpriseFn)
