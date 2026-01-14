import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML } from "~/metadata/commonObjects/i8nText/exportToXML"
import { exportPictureToXML } from "~/metadata/commonObjects/picture/exportToXML"
import { exportTypeDescriptionToXML } from "~/metadata/commonObjects/typeDescription/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportElementPropsToXML } from "~/metadata/forms/elements/baseElement/exportToXML"
import { exportContextMenuToXML } from "~/metadata/forms/elements/contextMenu/exportToXML"
import { HTMLDocumentField, HTMLDocumentFieldXML } from "~/metadata/forms/elements/htmlDocumentField/types"
import { exportTableToXML } from "~/metadata/forms/elements/table/exportToXML"
import { exportEventsToXML } from "~/metadata/forms/events/exportToXML"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ToXMLType } from "~/metadata/metadataFactory/types"
import { exportExtendedTooltipToXML } from "../extendedTooltip/exportToXML"

export function exportHTMLDocumentFieldToXML<From extends HTMLDocumentField | undefined>(
  context: ConfigurationContext,
  data: From
): ToXMLType<From> {
  if (data === undefined) return undefined as ToXMLType<From>

  const baseFields = exportElementPropsToXML(context, data)

  const result: HTMLDocumentFieldXML = {
    ...baseFields,
    ContextMenu: exportContextMenuToXML(context, data.contextMenu, data),
    ExtendedTooltip: exportExtendedTooltipToXML(context, data.extendedTooltip, data),
  }

  if (data.autoCellHeight !== undefined) result.AutoCellHeight = data.autoCellHeight

  if (data.cellHyperlink !== undefined) result.CellHyperlink = data.cellHyperlink

  if (data.dataPath !== undefined) result.DataPath = data.dataPath

  if (data.defaultItem !== undefined) result.DefaultItem = data.defaultItem

  if (data.displayImportance !== undefined) result._DisplayImportance = data.displayImportance

  if (data.editMode !== undefined) result.EditMode = data.editMode

  if (data.enabled !== undefined) result.Enabled = data.enabled

  if (data.fixingInTable !== undefined) result.FixingInTable = data.fixingInTable

  const footerBackColor = exportColorToXML(context, data.footerBackColor)
  if (footerBackColor !== undefined) result.FooterBackColor = footerBackColor

  if (data.footerDataPath !== undefined) result.FooterDataPath = data.footerDataPath

  const footerFont = exportFontToXML(context, data.footerFont)
  if (footerFont !== undefined) result.FooterFont = footerFont

  if (data.footerHorizontalAlign !== undefined) result.FooterHorizontalAlign = data.footerHorizontalAlign

  const footerPicture = exportPictureToXML(context, data.footerPicture)
  if (footerPicture !== undefined) result.FooterPicture = footerPicture

  const footerText = exportI8nTextToXML(context, data.footerText)
  if (footerText !== undefined) result.FooterText = footerText

  const footerTextColor = exportColorToXML(context, data.footerTextColor)
  if (footerTextColor !== undefined) result.FooterTextColor = footerTextColor

  if (data.headerHorizontalAlign !== undefined) result.HeaderHorizontalAlign = data.headerHorizontalAlign

  const headerPicture = exportPictureToXML(context, data.headerPicture)
  if (headerPicture !== undefined) result.HeaderPicture = headerPicture

  if (data.horizontalAlign !== undefined) result.HorizontalAlign = data.horizontalAlign

  if (data.horizontalAlignInGroup !== undefined) result.HorizontalAlignInGroup = data.horizontalAlignInGroup

  if (data.readOnly !== undefined) result.ReadOnly = data.readOnly

  if (data.shortcut !== undefined) result.Shortcut = data.shortcut

  if (data.showInFooter !== undefined) result.ShowInFooter = data.showInFooter

  if (data.showInHeader !== undefined) result.ShowInHeader = data.showInHeader

  if (data.skipOnInput !== undefined) result.SkipOnInput = data.skipOnInput

  const table = exportTableToXML(context, data.table)
  if (table !== undefined) result.Table = table

  const title = exportI8nTextToXML(context, data.title)
  if (title !== undefined) result.Title = title

  const titleBackColor = exportColorToXML(context, data.titleBackColor)
  if (titleBackColor !== undefined) result.TitleBackColor = titleBackColor

  const titleFont = exportFontToXML(context, data.titleFont)
  if (titleFont !== undefined) result.TitleFont = titleFont

  if (data.titleHeight !== undefined) result.TitleHeight = data.titleHeight

  if (data.titleLocation !== undefined) result.TitleLocation = data.titleLocation

  const titleTextColor = exportColorToXML(context, data.titleTextColor)
  if (titleTextColor !== undefined) result.TitleTextColor = titleTextColor

  const toolTip = exportI8nTextToXML(context, data.toolTip)
  if (toolTip !== undefined) result.ToolTip = toolTip

  if (data.toolTipRepresentation !== undefined) result.ToolTipRepresentation = data.toolTipRepresentation

  if (data.type !== undefined) result.Type = data.type

  const typeRestriction = exportTypeDescriptionToXML(context, data.typeRestriction)
  if (typeRestriction !== undefined) result.TypeRestriction = typeRestriction

  const userVisible = exportUserVisibleToXML(context, data.userVisible)
  if (userVisible !== undefined) result.UserVisible = userVisible

  if (data.verticalAlign !== undefined) result.VerticalAlign = data.verticalAlign

  if (data.verticalAlignInGroup !== undefined) result.VerticalAlignInGroup = data.verticalAlignInGroup

  if (data.visible !== undefined) result.Visible = data.visible

  const warningOnEdit = exportI8nTextToXML(context, data.warningOnEdit)
  if (warningOnEdit !== undefined) result.WarningOnEdit = warningOnEdit

  if (data.warningOnEditRepresentation !== undefined)
    result.WarningOnEditRepresentation = data.warningOnEditRepresentation

  const events = exportEventsToXML(context, data.events)
  if (events !== undefined) result.Events = events

  if (data.autoMaxHeight !== undefined) result.AutoMaxHeight = data.autoMaxHeight

  if (data.autoMaxWidth !== undefined) result.AutoMaxWidth = data.autoMaxWidth

  const borderColor = exportColorToXML(context, data.borderColor)
  if (borderColor !== undefined) result.BorderColor = borderColor

  if (data.height !== undefined) result.Height = data.height

  if (data.horizontalStretch !== undefined) result.HorizontalStretch = data.horizontalStretch

  if (data.maxHeight !== undefined) result.MaxHeight = data.maxHeight

  if (data.maxWidth !== undefined) result.MaxWidth = data.maxWidth

  if (data.output !== undefined) result.Output = data.output

  if (data.userAgentInformation !== undefined) result.UserAgentInformation = data.userAgentInformation

  if (data.verticalStretch !== undefined) result.VerticalStretch = data.verticalStretch

  if (data.width !== undefined) result.Width = data.width

  return sortObject(result) as ToXMLType<From>
}

registerMetadata("ExportToXML", "HTMLDocumentField", exportHTMLDocumentFieldToXML)
