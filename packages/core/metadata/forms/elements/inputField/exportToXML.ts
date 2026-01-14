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
import { exportFormFieldToXML } from "~/metadata/forms/elements/formField/exportToXML"
import { InputField, InputFieldXML } from "~/metadata/forms/elements/inputField/types"
import { exportEventsToXML } from "~/metadata/forms/events/exportToXML"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ToXMLType } from "~/metadata/metadataFactory/types"

export function exportInputFieldToXML<From extends InputField | undefined>(
  context: ConfigurationContext,
  data: From
): ToXMLType<From> {
  if (data === undefined) return undefined as ToXMLType<From>

  const baseFields = exportFormFieldToXML(context, data)
  if (!baseFields) return undefined

  const result: InputFieldXML = {
    ...baseFields,
  }

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
