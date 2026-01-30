import { importChoiceListFromXML } from "~/metadata/commonObjects/choiceList/importFromXML"
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
import { RadioButtonField } from "~/metadata/forms/elements/radioButtonField/types"
import { importEventsFromXML } from "~/metadata/forms/events/importFromXML"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType, ImportFromXMLFn, ToXMLType } from "~/metadata/metadataFactory/types"

export function importRadioButtonFieldFromXML<To extends RadioButtonField | undefined>(
  context: ConfigurationContext,
  xml: ToXMLType<To> | undefined
): To {
  if (xml === undefined) return undefined as To
  const baseFields = importBaseElementFromXML(context, xml)

  const result: RadioButtonField = {
    ...baseFields,
    elementType: FormElementType.RadioButtonField,
  }

  if (xml.AutoCellHeight !== undefined) result.autoCellHeight = xml.AutoCellHeight

  if (xml.CellHyperlink !== undefined) result.cellHyperlink = xml.CellHyperlink

  const contextMenu = importContextMenuFromXML(context, xml.ContextMenu)
  if (contextMenu !== undefined) result.contextMenu = contextMenu

  if (xml.DataPath !== undefined) result.dataPath = xml.DataPath

  if (xml.DefaultItem !== undefined) result.defaultItem = xml.DefaultItem

  if (xml._DisplayImportance !== undefined) result.displayImportance = xml._DisplayImportance

  if (xml.EditMode !== undefined) result.editMode = xml.EditMode

  if (xml.Enabled !== undefined) result.enabled = xml.Enabled

  const extendedTooltip = importExtendedTooltipFromXML(context, xml.ExtendedTooltip)
  if (extendedTooltip !== undefined) result.extendedTooltip = extendedTooltip

  if (xml.FixingInTable !== undefined) result.fixingInTable = xml.FixingInTable

  const footerBackColor = importColorFromXML(context, xml.FooterBackColor)
  if (footerBackColor !== undefined) result.footerBackColor = footerBackColor

  if (xml.FooterDataPath !== undefined) result.footerDataPath = xml.FooterDataPath

  const footerFont = importFontFromXML(context, xml.FooterFont)
  if (footerFont !== undefined) result.footerFont = footerFont

  if (xml.FooterHorizontalAlign !== undefined) result.footerHorizontalAlign = xml.FooterHorizontalAlign

  const footerPicture = importPictureFromXML(context, xml.FooterPicture)
  if (footerPicture !== undefined) result.footerPicture = footerPicture

  const footerText = importI8nTextFromXML(context, xml.FooterText)
  if (footerText !== undefined) result.footerText = footerText

  const footerTextColor = importColorFromXML(context, xml.FooterTextColor)
  if (footerTextColor !== undefined) result.footerTextColor = footerTextColor

  if (xml.HeaderHorizontalAlign !== undefined) result.headerHorizontalAlign = xml.HeaderHorizontalAlign

  const headerPicture = importPictureFromXML(context, xml.HeaderPicture)
  if (headerPicture !== undefined) result.headerPicture = headerPicture

  if (xml.HorizontalAlign !== undefined) result.horizontalAlign = xml.HorizontalAlign

  if (xml.GroupHorizontalAlign !== undefined) result.horizontalAlignInGroup = xml.GroupHorizontalAlign

  if (xml.ReadOnly !== undefined) result.readOnly = xml.ReadOnly

  if (xml.Shortcut !== undefined) result.shortcut = xml.Shortcut

  if (xml.ShowInFooter !== undefined) result.showInFooter = xml.ShowInFooter

  if (xml.ShowInHeader !== undefined) result.showInHeader = xml.ShowInHeader

  if (xml.SkipOnInput !== undefined) result.skipOnInput = xml.SkipOnInput

  const table = importMetadataValueFromXMLAsPrimitive(context, xml.AssociatedTableElementId, "string")
  if (table !== undefined) result.table = table

  const title = importI8nTextFromXML(context, xml.Title)
  if (title !== undefined) result.title = title

  const titleBackColor = importColorFromXML(context, xml.TitleBackColor)
  if (titleBackColor !== undefined) result.titleBackColor = titleBackColor

  const titleFont = importFontFromXML(context, xml.TitleFont)
  if (titleFont !== undefined) result.titleFont = titleFont

  if (xml.TitleHeight !== undefined) result.titleHeight = xml.TitleHeight

  if (xml.TitleLocation !== undefined) result.titleLocation = xml.TitleLocation

  const titleTextColor = importColorFromXML(context, xml.TitleTextColor)
  if (titleTextColor !== undefined) result.titleTextColor = titleTextColor

  const toolTip = importI8nTextFromXML(context, xml.ToolTip)
  if (toolTip !== undefined) result.toolTip = toolTip

  if (xml.ToolTipRepresentation !== undefined) result.toolTipRepresentation = xml.ToolTipRepresentation

  if (xml.Type !== undefined) result.type = xml.Type

  const typeRestriction = importTypeDescriptionFromXML(context, xml.TypeRestriction)
  if (typeRestriction !== undefined) result.typeRestriction = typeRestriction

  const userVisible = importUserVisibleFromXML(context, xml.UserVisible)
  if (userVisible !== undefined) result.userVisible = userVisible

  if (xml.VerticalAlign !== undefined) result.verticalAlign = xml.VerticalAlign

  if (xml.GroupVerticalAlign !== undefined) result.verticalAlignInGroup = xml.GroupVerticalAlign

  if (xml.Visible !== undefined) result.visible = xml.Visible

  const warningOnEdit = importI8nTextFromXML(context, xml.WarningOnEdit)
  if (warningOnEdit !== undefined) result.warningOnEdit = warningOnEdit

  if (xml.WarningOnEditRepresentation !== undefined)
    result.warningOnEditRepresentation = xml.WarningOnEditRepresentation

  const events = importEventsFromXML(context, xml.Events)
  if (events !== undefined) result.events = events

  const backColor = importColorFromXML(context, xml.BackColor)
  if (backColor !== undefined) result.backColor = backColor

  const borderColor = importColorFromXML(context, xml.BorderColor)
  if (borderColor !== undefined) result.borderColor = borderColor

  const choiceList = importChoiceListFromXML(context, xml.ChoiceList)
  if (choiceList !== undefined) result.choiceList = choiceList

  if (xml.ColumnsCount !== undefined) result.columnsCount = xml.ColumnsCount

  if (xml.EqualColumnsWidth !== undefined) result.equalColumnsWidth = xml.EqualColumnsWidth

  const font = importFontFromXML(context, xml.Font)
  if (font !== undefined) result.font = font

  if (xml.ItemHeight !== undefined) result.itemHeight = xml.ItemHeight

  if (xml.ItemTitleHeight !== undefined) result.itemTitleHeight = xml.ItemTitleHeight

  if (xml.ItemWidth !== undefined) result.itemWidth = xml.ItemWidth

  if (xml.RadioButtonType !== undefined) result.radioButtonType = xml.RadioButtonType

  const textColor = importColorFromXML(context, xml.TextColor)
  if (textColor !== undefined) result.textColor = textColor

  return result as To
}

registerMetadata("ImportFromXML", "RadioButtonField", importRadioButtonFieldFromXML as ImportFromXMLFn)
