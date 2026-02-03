import { importColorFromXML } from "~/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/metadata/commonObjects/font/importFromXML"
import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/importFromXML"
import { importMetadataValueFromXMLAsPrimitive } from "~/metadata/commonObjects/metadataValue/importFromXML"
import { importPictureFromXML } from "~/metadata/commonObjects/picture/importFromXML"
import { importTypeDescriptionFromXML } from "~/metadata/commonObjects/typeDescription/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { importBaseElementFromXML } from "~/metadata/forms/elements/baseElement/importFromXML"
import { importContextMenuFromXML } from "~/metadata/forms/elements/contextMenu/importFromXML"
import { importExtendedTooltipFromXML } from "~/metadata/forms/elements/extendedTooltip/importFromXML"
import { FormattedDocumentField } from "~/metadata/forms/elements/formattedDocumentField/types"
import { importEventsFromXML } from "~/metadata/forms/events/importFromXML"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType, ImportFromXMLFn, ToXMLType } from "~/metadata/metadataFactory/types"
import { PropertyRule } from "../calendarField/rules"

export function importFormattedDocumentFieldFromXML<To extends FormattedDocumentField | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: ToXMLType<To> | undefined
): To {
  if (xml === undefined) return undefined as To

  const baseFields = importBaseElementFromXML(context, undefined, xml)

  const result: FormattedDocumentField = {
    ...baseFields,
    elementType: FormElementType.FormattedDocumentField,
  }

  if (xml.AutoCellHeight !== undefined) result.autoCellHeight = xml.AutoCellHeight

  if (xml.CellHyperlink !== undefined) result.cellHyperlink = xml.CellHyperlink

  const contextMenu = importContextMenuFromXML(context, undefined, xml.ContextMenu)
  if (contextMenu !== undefined) result.contextMenu = contextMenu

  if (xml.DataPath !== undefined) result.dataPath = xml.DataPath

  if (xml.DefaultItem !== undefined) result.defaultItem = xml.DefaultItem

  if (xml._DisplayImportance !== undefined) result.displayImportance = xml._DisplayImportance

  if (xml.EditMode !== undefined) result.editMode = xml.EditMode

  if (xml.Enabled !== undefined) result.enabled = xml.Enabled

  const extendedTooltip = importExtendedTooltipFromXML(context, undefined, xml.ExtendedTooltip)
  if (extendedTooltip !== undefined) result.extendedTooltip = extendedTooltip

  if (xml.FixingInTable !== undefined) result.fixingInTable = xml.FixingInTable

  const footerBackColor = importColorFromXML(context, undefined, xml.FooterBackColor)
  if (footerBackColor !== undefined) result.footerBackColor = footerBackColor

  if (xml.FooterDataPath !== undefined) result.footerDataPath = xml.FooterDataPath

  const footerFont = importFontFromXML(context, undefined, xml.FooterFont)
  if (footerFont !== undefined) result.footerFont = footerFont

  if (xml.FooterHorizontalAlign !== undefined) result.footerHorizontalAlign = xml.FooterHorizontalAlign

  const footerPicture = importPictureFromXML(context, undefined, xml.FooterPicture)
  if (footerPicture !== undefined) result.footerPicture = footerPicture

  const footerText = importI8nTextFromXML(context, undefined, xml.FooterText)
  if (footerText !== undefined) result.footerText = footerText

  const footerTextColor = importColorFromXML(context, undefined, xml.FooterTextColor)
  if (footerTextColor !== undefined) result.footerTextColor = footerTextColor

  if (xml.HeaderHorizontalAlign !== undefined) result.headerHorizontalAlign = xml.HeaderHorizontalAlign

  const headerPicture = importPictureFromXML(context, undefined, xml.HeaderPicture)
  if (headerPicture !== undefined) result.headerPicture = headerPicture

  if (xml.HorizontalAlign !== undefined) result.horizontalAlign = xml.HorizontalAlign

  if (xml.GroupHorizontalAlign !== undefined) result.horizontalAlignInGroup = xml.GroupHorizontalAlign

  if (xml.ReadOnly !== undefined) result.readOnly = xml.ReadOnly

  if (xml.Shortcut !== undefined) result.shortcut = xml.Shortcut

  if (xml.ShowInFooter !== undefined) result.showInFooter = xml.ShowInFooter

  if (xml.ShowInHeader !== undefined) result.showInHeader = xml.ShowInHeader

  if (xml.SkipOnInput !== undefined) result.skipOnInput = xml.SkipOnInput

  const table = importMetadataValueFromXMLAsPrimitive(context, undefined, xml.AssociatedTableElementId, "string")
  if (table !== undefined) result.table = table

  const title = importI8nTextFromXML(context, undefined, xml.Title)
  if (title !== undefined) result.title = title

  const titleBackColor = importColorFromXML(context, undefined, xml.TitleBackColor)
  if (titleBackColor !== undefined) result.titleBackColor = titleBackColor

  const titleFont = importFontFromXML(context, undefined, xml.TitleFont)
  if (titleFont !== undefined) result.titleFont = titleFont

  if (xml.TitleHeight !== undefined) result.titleHeight = xml.TitleHeight

  if (xml.TitleLocation !== undefined) result.titleLocation = xml.TitleLocation

  const titleTextColor = importColorFromXML(context, undefined, xml.TitleTextColor)
  if (titleTextColor !== undefined) result.titleTextColor = titleTextColor

  const toolTip = importI8nTextFromXML(context, undefined, xml.ToolTip)
  if (toolTip !== undefined) result.toolTip = toolTip

  if (xml.ToolTipRepresentation !== undefined) result.toolTipRepresentation = xml.ToolTipRepresentation

  if (xml.Type !== undefined) result.type = xml.Type

  const typeRestriction = importTypeDescriptionFromXML(context, undefined, xml.TypeRestriction)
  if (typeRestriction !== undefined) result.typeRestriction = typeRestriction

  const userVisible = importUserVisibleFromXML(context, undefined, xml.UserVisible)
  if (userVisible !== undefined) result.userVisible = userVisible

  if (xml.VerticalAlign !== undefined) result.verticalAlign = xml.VerticalAlign

  if (xml.GroupVerticalAlign !== undefined) result.verticalAlignInGroup = xml.GroupVerticalAlign

  if (xml.Visible !== undefined) result.visible = xml.Visible

  const warningOnEdit = importI8nTextFromXML(context, undefined, xml.WarningOnEdit)
  if (warningOnEdit !== undefined) result.warningOnEdit = warningOnEdit

  if (xml.WarningOnEditRepresentation !== undefined)
    result.warningOnEditRepresentation = xml.WarningOnEditRepresentation

  const events = importEventsFromXML(context, undefined, xml.Events)
  if (events !== undefined) result.events = events

  if (xml.AutoMaxHeight !== undefined) result.autoMaxHeight = xml.AutoMaxHeight

  if (xml.AutoMaxWidth !== undefined) result.autoMaxWidth = xml.AutoMaxWidth

  const backColor = importColorFromXML(context, undefined, xml.BackColor)
  if (backColor !== undefined) result.backColor = backColor

  const borderColor = importColorFromXML(context, undefined, xml.BorderColor)
  if (borderColor !== undefined) result.borderColor = borderColor

  const font = importFontFromXML(context, undefined, xml.Font)
  if (font !== undefined) result.font = font

  if (xml.Height !== undefined) result.height = xml.Height

  if (xml.HorizontalStretch !== undefined) result.horizontalStretch = xml.HorizontalStretch

  if (xml.MaxHeight !== undefined) result.maxHeight = xml.MaxHeight

  if (xml.MaxWidth !== undefined) result.maxWidth = xml.MaxWidth

  if (xml.Output !== undefined) result.output = xml.Output

  if (xml.SelectedText !== undefined) result.selectedText = xml.SelectedText

  const textColor = importColorFromXML(context, undefined, xml.TextColor)
  if (textColor !== undefined) result.textColor = textColor

  if (xml.VerticalStretch !== undefined) result.verticalStretch = xml.VerticalStretch

  if (xml.Width !== undefined) result.width = xml.Width

  return result as To
}

registerMetadata("ImportFromXML", "FormattedDocumentField", importFormattedDocumentFieldFromXML as ImportFromXMLFn)
