import { exportChoiceListToXML } from "~/metadata/commonObjects/choiceList/exportToXML"
import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML } from "~/metadata/commonObjects/i8nText/exportToXML"
import { exportPictureToXML } from "~/metadata/commonObjects/picture/exportToXML"
import { exportTypeDescriptionToXML } from "~/metadata/commonObjects/typeDescription/exportToXML"
import { exportTypeLinkToXML } from "~/metadata/commonObjects/typeLink/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { exportChoiceParameterLinksToXML } from "~/metadata/commonObjects/сhoiceParameterLinks/exportToXML"
import { exportChoiceParametersToXML } from "~/metadata/commonObjects/сhoiceParameters/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportElementPropsToXML } from "~/metadata/forms/elements/baseElement/exportToXML"
import { exportContextMenuToXML } from "~/metadata/forms/elements/contextMenu/exportToXML"
import { InputField, InputFieldXML } from "~/metadata/forms/elements/inputField/types"
import { exportTableToXML } from "~/metadata/forms/elements/table/exportToXML"
import { exportEventsToXML } from "~/metadata/forms/events/exportToXML"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ToXMLType } from "~/metadata/metadataFactory/types"
import { exportExtendedTooltipToXML } from "../extendedTooltip/exportToXML"

export function exportInputFieldToXML<From extends InputField | undefined>(
  context: ConfigurationContext,
  data: From
): ToXMLType<From> {
  if (data === undefined) return undefined as ToXMLType<From>

  const baseFields = exportElementPropsToXML(context, data)

  const result: InputFieldXML = {
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

  if (data.allowInputEmptyMultipleValues !== undefined)
    result.AllowInputEmptyMultipleValues = data.allowInputEmptyMultipleValues

  if (data.allowMultipleValuesDuplicates !== undefined)
    result.AllowMultipleValuesDuplicates = data.allowMultipleValuesDuplicates

  if (data.autoCapitalizationOnTextInput !== undefined)
    result.AutoCapitalizationOnTextInput = data.autoCapitalizationOnTextInput

  if (data.autoChoiceIncomplete !== undefined) result.AutoChoiceIncomplete = data.autoChoiceIncomplete

  if (data.autoCorrectionOnTextInput !== undefined) result.AutoCorrectionOnTextInput = data.autoCorrectionOnTextInput

  if (data.autoFillHint !== undefined) result.AutoFillHint = data.autoFillHint

  if (data.autoMarkIncomplete !== undefined) result.AutoMarkIncomplete = data.autoMarkIncomplete

  if (data.autoMaxHeight !== undefined) result.AutoMaxHeight = data.autoMaxHeight

  if (data.autoMaxWidth !== undefined) result.AutoMaxWidth = data.autoMaxWidth

  if (data.autoShowClearButton !== undefined) result.AutoShowClearButton = data.autoShowClearButton

  if (data.autoShowOpenButton !== undefined) result.AutoShowOpenButton = data.autoShowOpenButton

  const availableTypes = exportTypeDescriptionToXML(context, data.availableTypes)
  if (availableTypes !== undefined) result.AvailableTypes = availableTypes

  const backColor = exportColorToXML(context, data.backColor)
  if (backColor !== undefined) result.BackColor = backColor

  const borderColor = exportColorToXML(context, data.borderColor)
  if (borderColor !== undefined) result.BorderColor = borderColor

  if (data.choiceButton !== undefined) result.ChoiceButton = data.choiceButton

  const choiceButtonPicture = exportPictureToXML(context, data.choiceButtonPicture)
  if (choiceButtonPicture !== undefined) result.ChoiceButtonPicture = choiceButtonPicture

  if (data.choiceButtonRepresentation !== undefined) result.ChoiceButtonRepresentation = data.choiceButtonRepresentation

  if (data.choiceFoldersAndItems !== undefined) result.ChoiceFoldersAndItems = data.choiceFoldersAndItems

  if (data.choiceForm !== undefined) result.ChoiceForm = data.choiceForm

  if (data.choiceHistoryOnInput !== undefined) result.ChoiceHistoryOnInput = data.choiceHistoryOnInput

  const choiceList = exportChoiceListToXML(context, data.choiceList)
  if (choiceList !== undefined) result.ChoiceList = choiceList

  if (data.choiceListButton !== undefined) result.ChoiceListButton = data.choiceListButton

  if (data.choiceListHeight !== undefined) result.ChoiceListHeight = data.choiceListHeight

  const choiceParameterLinks = exportChoiceParameterLinksToXML(context, data.choiceParameterLinks)
  if (choiceParameterLinks !== undefined) result.ChoiceParameterLinks = choiceParameterLinks

  const choiceParameters = exportChoiceParametersToXML(context, data.choiceParameters)
  if (choiceParameters !== undefined) result.ChoiceParameters = choiceParameters

  if (data.chooseType !== undefined) result.ChooseType = data.chooseType

  if (data.clearButton !== undefined) result.ClearButton = data.clearButton

  if (data.createButton !== undefined) result.CreateButton = data.createButton

  if (data.dropListButton !== undefined) result.DropListButton = data.dropListButton

  if (data.dropListWidth !== undefined) result.DropListWidth = data.dropListWidth

  const editFormat = exportI8nTextToXML(context, data.editFormat)
  if (editFormat !== undefined) result.EditFormat = editFormat

  if (data.editText !== undefined) result.EditText = data.editText

  if (data.editTextUpdate !== undefined) result.EditTextUpdate = data.editTextUpdate

  if (data.extendedEdit !== undefined) result.ExtendedEdit = data.extendedEdit

  const font = exportFontToXML(context, data.font)
  if (font !== undefined) result.Font = font

  const format = exportI8nTextToXML(context, data.format)
  if (format !== undefined) result.Format = format

  if (data.height !== undefined) result.Height = data.height

  if (data.heightControlVariant !== undefined) result.HeightControlVariant = data.heightControlVariant

  if (data.horizontalStretch !== undefined) result.HorizontalStretch = data.horizontalStretch

  if (data.incompleteChoiceMode !== undefined) result.IncompleteChoiceMode = data.incompleteChoiceMode

  const inputHint = exportI8nTextToXML(context, data.inputHint)
  if (inputHint !== undefined) result.InputHint = inputHint

  if (data.listChoiceMode !== undefined) result.ListChoiceMode = data.listChoiceMode

  if (data.markIncomplete !== undefined) result.MarkIncomplete = data.markIncomplete

  if (data.markNegatives !== undefined) result.MarkNegatives = data.markNegatives

  if (data.mask !== undefined) result.Mask = data.mask

  if (data.maxHeight !== undefined) result.MaxHeight = data.maxHeight

  if (data.maxValue !== undefined) result.MaxValue = data.maxValue

  if (data.maxWidth !== undefined) result.MaxWidth = data.maxWidth

  if (data.minValue !== undefined) result.MinValue = data.minValue

  if (data.multiLine !== undefined) result.MultiLine = data.multiLine

  if (data.multipleValuePictureDataPath !== undefined)
    result.MultipleValuePictureDataPath = data.multipleValuePictureDataPath

  if (data.multipleValuePictureShape !== undefined) result.MultipleValuePictureShape = data.multipleValuePictureShape

  if (data.multipleValuePictureSize !== undefined) result.MultipleValuePictureSize = data.multipleValuePictureSize

  if (data.multipleValuePresentationDataPath !== undefined)
    result.MultipleValuePresentationDataPath = data.multipleValuePresentationDataPath

  const multipleValuesBackColor = exportColorToXML(context, data.multipleValuesBackColor)
  if (multipleValuesBackColor !== undefined) result.MultipleValuesBackColor = multipleValuesBackColor

  if (data.multipleValuesExtendedEdit !== undefined) result.MultipleValuesExtendedEdit = data.multipleValuesExtendedEdit

  const multipleValuesFont = exportFontToXML(context, data.multipleValuesFont)
  if (multipleValuesFont !== undefined) result.MultipleValuesFont = multipleValuesFont

  if (data.multipleValuesHyperlink !== undefined) result.MultipleValuesHyperlink = data.multipleValuesHyperlink

  const multipleValuesPicture = exportPictureToXML(context, data.multipleValuesPicture)
  if (multipleValuesPicture !== undefined) result.MultipleValuesPicture = multipleValuesPicture

  const multipleValuesTextColor = exportColorToXML(context, data.multipleValuesTextColor)
  if (multipleValuesTextColor !== undefined) result.MultipleValuesTextColor = multipleValuesTextColor

  if (data.multipleValueValueDataPath !== undefined) result.MultipleValueValueDataPath = data.multipleValueValueDataPath

  if (data.onScreenKeyboardReturnKeyText !== undefined)
    result.OnScreenKeyboardReturnKeyText = data.onScreenKeyboardReturnKeyText

  if (data.openButton !== undefined) result.OpenButton = data.openButton

  if (data.passwordMode !== undefined) result.PasswordMode = data.passwordMode

  if (data.quickChoice !== undefined) result.QuickChoice = data.quickChoice

  if (data.selectedText !== undefined) result.SelectedText = data.selectedText

  if (data.showCheckBoxesInDropListWhenInputMultipleValues !== undefined)
    result.ShowCheckBoxesInDropListWhenInputMultipleValues = data.showCheckBoxesInDropListWhenInputMultipleValues

  if (data.specialTextInputMode !== undefined) result.SpecialTextInputMode = data.specialTextInputMode

  if (data.spellCheckingOnTextInput !== undefined) result.SpellCheckingOnTextInput = data.spellCheckingOnTextInput

  if (data.spinButton !== undefined) result.SpinButton = data.spinButton

  const textColor = exportColorToXML(context, data.textColor)
  if (textColor !== undefined) result.TextColor = textColor

  if (data.textEdit !== undefined) result.TextEdit = data.textEdit

  if (data.typeDomainEnabled !== undefined) result.TypeDomainEnabled = data.typeDomainEnabled

  const typeLink = exportTypeLinkToXML(context, data.typeLink)
  if (typeLink !== undefined) result.TypeLink = typeLink

  const userVisible = exportUserVisibleToXML(context, data.userVisible)
  if (userVisible !== undefined) result.UserVisible = userVisible

  if (data.verticalStretch !== undefined) result.VerticalStretch = data.verticalStretch

  if (data.width !== undefined) result.Width = data.width

  if (data.wrap !== undefined) result.Wrap = data.wrap

  const events = exportEventsToXML(context, data.events)
  if (events !== undefined) result.Events = events

  return sortObject(result) as ToXMLType<From>
}

registerMetadata("ExportToXML", "InputField", exportInputFieldToXML)
