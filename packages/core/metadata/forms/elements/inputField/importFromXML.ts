import { importChoiceListFromXML } from "~/metadata/commonObjects/choiceList/importFromXML"
import { importColorFromXML } from "~/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/metadata/commonObjects/font/importFromXML"
import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/importFromXML"
import { importMetadataValueFromXMLAsPrimitive } from "~/metadata/commonObjects/metadataValue/importFromXML"
import { importPictureFromXML } from "~/metadata/commonObjects/picture/importFromXML"
import { importTypeDescriptionFromXML } from "~/metadata/commonObjects/typeDescription/importFromXML"
import { importTypeLinkFromXML } from "~/metadata/commonObjects/typeLink/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { importChoiceParameterLinksFromXML } from "~/metadata/commonObjects/сhoiceParameterLinks/importFromXML"
import { importChoiceParametersFromXML } from "~/metadata/commonObjects/сhoiceParameters/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { importBaseElementFromXML } from "~/metadata/forms/elements/baseElement/importFromXML"
import { importContextMenuFromXML } from "~/metadata/forms/elements/contextMenu/importFromXML"
import { importExtendedTooltipFromXML } from "~/metadata/forms/elements/extendedTooltip/importFromXML"
import { InputField } from "~/metadata/forms/elements/inputField/types"
import { importEventsFromXML } from "~/metadata/forms/events/importFromXML"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType, ImportFromXMLFn, ToXMLType } from "~/metadata/metadataFactory/types"
import { PropertyRule } from "../calendarField/rules"

export function importInputFieldFromXML<To extends InputField | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: ToXMLType<To> | undefined
): To {
  if (xml === undefined) return undefined as To

  const baseFields = importBaseElementFromXML(context, undefined, xml)
  const result: InputField = {
    ...baseFields,
    elementType: FormElementType.InputField,
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

  const table = importMetadataValueFromXMLAsPrimitive(context, xml.AssociatedTableElementId, "string")
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

  if (xml.VerticalAlign !== undefined) result.verticalAlign = xml.VerticalAlign

  if (xml.GroupVerticalAlign !== undefined) result.verticalAlignInGroup = xml.GroupVerticalAlign

  if (xml.Visible !== undefined) result.visible = xml.Visible

  const warningOnEdit = importI8nTextFromXML(context, undefined, xml.WarningOnEdit)
  if (warningOnEdit !== undefined) result.warningOnEdit = warningOnEdit

  if (xml.WarningOnEditRepresentation !== undefined)
    result.warningOnEditRepresentation = xml.WarningOnEditRepresentation

  if (xml.AllowInputEmptyMultipleValues !== undefined)
    result.allowInputEmptyMultipleValues = xml.AllowInputEmptyMultipleValues

  if (xml.AllowMultipleValuesDuplicates !== undefined)
    result.allowMultipleValuesDuplicates = xml.AllowMultipleValuesDuplicates

  if (xml.AutoCapitalizationOnTextInput !== undefined)
    result.autoCapitalizationOnTextInput = xml.AutoCapitalizationOnTextInput

  if (xml.AutoChoiceIncomplete !== undefined) result.autoChoiceIncomplete = xml.AutoChoiceIncomplete

  if (xml.AutoCorrectionOnTextInput !== undefined) result.autoCorrectionOnTextInput = xml.AutoCorrectionOnTextInput

  if (xml.AutoFillHint !== undefined) result.autoFillHint = xml.AutoFillHint

  if (xml.AutoMarkIncomplete !== undefined) result.autoMarkIncomplete = xml.AutoMarkIncomplete

  if (xml.AutoMaxHeight !== undefined) result.autoMaxHeight = xml.AutoMaxHeight

  if (xml.AutoMaxWidth !== undefined) result.autoMaxWidth = xml.AutoMaxWidth

  if (xml.AutoShowClearButtonMode !== undefined) result.autoShowClearButton = xml.AutoShowClearButtonMode

  if (xml.AutoShowOpenButton !== undefined) result.autoShowOpenButton = xml.AutoShowOpenButton

  const availableTypes = importTypeDescriptionFromXML(context, undefined, xml.AvailableTypes)
  if (availableTypes !== undefined) result.availableTypes = availableTypes

  const backColor = importColorFromXML(context, undefined, xml.BackColor)
  if (backColor !== undefined) result.backColor = backColor

  const borderColor = importColorFromXML(context, undefined, xml.BorderColor)
  if (borderColor !== undefined) result.borderColor = borderColor

  if (xml.ChoiceButton !== undefined) result.choiceButton = xml.ChoiceButton

  const choiceButtonPicture = importPictureFromXML(context, undefined, xml.ChoiceButtonPicture)
  if (choiceButtonPicture !== undefined) result.choiceButtonPicture = choiceButtonPicture

  if (xml.ChoiceButtonRepresentation !== undefined) result.choiceButtonRepresentation = xml.ChoiceButtonRepresentation

  if (xml.ChoiceFoldersAndItems !== undefined) result.choiceFoldersAndItems = xml.ChoiceFoldersAndItems

  if (xml.ChoiceForm !== undefined) result.choiceForm = xml.ChoiceForm

  if (xml.ChoiceHistoryOnInput !== undefined) result.choiceHistoryOnInput = xml.ChoiceHistoryOnInput

  const choiceList = importChoiceListFromXML(context, undefined, xml.ChoiceList)
  if (choiceList !== undefined) result.choiceList = choiceList

  if (xml.ChoiceListButton !== undefined) result.choiceListButton = xml.ChoiceListButton

  if (xml.ChoiceListHeight !== undefined) result.choiceListHeight = xml.ChoiceListHeight

  const choiceParameterLinks = importChoiceParameterLinksFromXML(context, undefined, xml.ChoiceParameterLinks)
  if (choiceParameterLinks !== undefined) result.choiceParameterLinks = choiceParameterLinks

  const choiceParameters = importChoiceParametersFromXML(context, undefined, xml.ChoiceParameters)
  if (choiceParameters !== undefined) result.choiceParameters = choiceParameters

  if (xml.ChooseType !== undefined) result.chooseType = xml.ChooseType

  if (xml.ClearButton !== undefined) result.clearButton = xml.ClearButton

  if (xml.CreateButton !== undefined) result.createButton = xml.CreateButton

  if (xml.DropListButton !== undefined) result.dropListButton = xml.DropListButton

  if (xml.DropListWidth !== undefined) result.dropListWidth = xml.DropListWidth

  const editFormat = importI8nTextFromXML(context, undefined, xml.EditFormat)
  if (editFormat !== undefined) result.editFormat = editFormat

  if (xml.EditText !== undefined) result.editText = xml.EditText

  if (xml.EditTextUpdate !== undefined) result.editTextUpdate = xml.EditTextUpdate

  if (xml.ExtendedEdit !== undefined) result.extendedEdit = xml.ExtendedEdit

  if (xml.ExtendedEditMultipleValues !== undefined) result.multipleValuesExtendedEdit = xml.ExtendedEditMultipleValues

  const font = importFontFromXML(context, undefined, xml.Font)
  if (font !== undefined) result.font = font

  const format = importI8nTextFromXML(context, undefined, xml.Format)
  if (format !== undefined) result.format = format

  if (xml.Height !== undefined) result.height = xml.Height

  if (xml.HeightControlVariant !== undefined) result.heightControlVariant = xml.HeightControlVariant

  if (xml.HorizontalStretch !== undefined) result.horizontalStretch = xml.HorizontalStretch

  if (xml.IncompleteChoiceMode !== undefined) result.incompleteChoiceMode = xml.IncompleteChoiceMode

  const inputHint = importI8nTextFromXML(context, undefined, xml.InputHint)
  if (inputHint !== undefined) result.inputHint = inputHint

  if (xml.ListChoiceMode !== undefined) result.listChoiceMode = xml.ListChoiceMode

  if (xml.MarkIncomplete !== undefined) result.markIncomplete = xml.MarkIncomplete

  if (xml.MarkNegatives !== undefined) result.markNegatives = xml.MarkNegatives

  if (xml.Mask !== undefined) result.mask = String(xml.Mask)

  if (xml.MaxHeight !== undefined) result.maxHeight = xml.MaxHeight

  if (xml.MaxValue !== undefined) result.maxValue = xml.MaxValue

  if (xml.MaxWidth !== undefined) result.maxWidth = xml.MaxWidth

  if (xml.MinValue !== undefined) result.minValue = xml.MinValue

  if (xml.MultiLine !== undefined) result.multiLine = xml.MultiLine

  if (xml.MultipleValuePictureDataPath !== undefined)
    result.multipleValuePictureDataPath = xml.MultipleValuePictureDataPath

  if (xml.MultipleValuePictureShape !== undefined) result.multipleValuePictureShape = xml.MultipleValuePictureShape

  if (xml.MultipleValuePictureSize !== undefined) result.multipleValuePictureSize = xml.MultipleValuePictureSize

  if (xml.MultipleValuePresentationDataPath !== undefined)
    result.multipleValuePresentationDataPath = xml.MultipleValuePresentationDataPath

  const multipleValuesBackColor = importColorFromXML(context, undefined, xml.MultipleValuesBackColor)
  if (multipleValuesBackColor !== undefined) result.multipleValuesBackColor = multipleValuesBackColor

  const multipleValuesFont = importFontFromXML(context, undefined, xml.MultipleValuesFont)
  if (multipleValuesFont !== undefined) result.multipleValuesFont = multipleValuesFont

  if (xml.MultipleValuesHyperlink !== undefined) result.multipleValuesHyperlink = xml.MultipleValuesHyperlink

  const multipleValuesPicture = importPictureFromXML(context, undefined, xml.MultipleValuesPicture)
  if (multipleValuesPicture !== undefined) result.multipleValuesPicture = multipleValuesPicture

  const multipleValuesTextColor = importColorFromXML(context, undefined, xml.MultipleValuesTextColor)
  if (multipleValuesTextColor !== undefined) result.multipleValuesTextColor = multipleValuesTextColor

  if (xml.MultipleValueValueDataPath !== undefined) result.multipleValueValueDataPath = xml.MultipleValueValueDataPath

  if (xml.OnScreenKeyboardReturnKeyText !== undefined)
    result.onScreenKeyboardReturnKeyText = xml.OnScreenKeyboardReturnKeyText

  if (xml.OpenButton !== undefined) result.openButton = xml.OpenButton

  if (xml.PasswordMode !== undefined) result.passwordMode = xml.PasswordMode

  if (xml.QuickChoice !== undefined) result.quickChoice = xml.QuickChoice

  // if (xml.SelectedText !== undefined) result.selectedText = xml.SelectedText

  if (xml.ShowCheckBoxesInDropListWhenInputMultipleValues !== undefined)
    result.showCheckBoxesInDropListWhenInputMultipleValues = xml.ShowCheckBoxesInDropListWhenInputMultipleValues

  if (xml.SpecialTextInputMode !== undefined) result.specialTextInputMode = xml.SpecialTextInputMode

  if (xml.SpellCheckingOnTextInput !== undefined) result.spellCheckingOnTextInput = xml.SpellCheckingOnTextInput

  if (xml.SpinButton !== undefined) result.spinButton = xml.SpinButton

  const textColor = importColorFromXML(context, undefined, xml.TextColor)
  if (textColor !== undefined) result.textColor = textColor

  if (xml.TextEdit !== undefined) result.textEdit = xml.TextEdit

  if (xml.TypeDomainEnabled !== undefined) result.typeDomainEnabled = xml.TypeDomainEnabled

  const typeLink = importTypeLinkFromXML(context, undefined, xml.TypeLink)
  if (typeLink !== undefined) result.typeLink = typeLink

  const userVisible = importUserVisibleFromXML(context, undefined, xml.UserVisible)
  if (userVisible !== undefined) result.userVisible = userVisible

  if (xml.VerticalStretch !== undefined) result.verticalStretch = xml.VerticalStretch

  if (xml.Width !== undefined) result.width = xml.Width

  if (xml.Wrap !== undefined) result.wrap = xml.Wrap

  const events = importEventsFromXML(context, undefined, xml.Events)
  if (events !== undefined) result.events = events

  return result as To
}

registerMetadata("ImportFromXML", "InputField", importInputFieldFromXML as ImportFromXMLFn)
