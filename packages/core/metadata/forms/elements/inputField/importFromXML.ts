import { importChoiceListFromXML } from "~/metadata/commonObjects/choiceList/importFromXML"
import { importColorFromXML } from "~/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/metadata/commonObjects/font/importFromXML"
import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/importFromXML"
import { importPictureFromXML } from "~/metadata/commonObjects/picture/importFromXML"
import { importTypeDescriptionFromXML } from "~/metadata/commonObjects/typeDescription/importFromXML"
import { importTypeLinkFromXML } from "~/metadata/commonObjects/typeLink/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { importChoiceParameterLinksFromXML } from "~/metadata/commonObjects/сhoiceParameterLinks/importFromXML"
import { importChoiceParametersFromXML } from "~/metadata/commonObjects/сhoiceParameters/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { importFormFieldFromXML } from "~/metadata/forms/elements/formField/importFromXML"
import { InputField, InputFieldXML } from "~/metadata/forms/elements/inputField/types"
import { importEventsFromXML } from "~/metadata/forms/events/importFromXML"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { importExtendedTooltipFromXML } from "../extendedTooltip/importFromXML"

export const importInputFieldFromXML = (
  context: ConfigurationContext,
  xml: InputFieldXML | undefined
): InputField | undefined => {
  if (!xml) return undefined

  const baseFields = importFormFieldFromXML(context, xml)
  if (!baseFields) return undefined

  const { elementType: _, ...restFields } = baseFields

  const result: InputField = {
    elementType: FormElementType.InputField,
    ...restFields,
  }

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

  if (xml.AutoShowClearButton !== undefined) result.autoShowClearButton = xml.AutoShowClearButton

  if (xml.AutoShowOpenButton !== undefined) result.autoShowOpenButton = xml.AutoShowOpenButton

  const availableTypes = importTypeDescriptionFromXML(context, xml.AvailableTypes)
  if (availableTypes !== undefined) result.availableTypes = availableTypes

  const backColor = importColorFromXML(context, xml.BackColor)
  if (backColor !== undefined) result.backColor = backColor

  const borderColor = importColorFromXML(context, xml.BorderColor)
  if (borderColor !== undefined) result.borderColor = borderColor

  if (xml.ChoiceButton !== undefined) result.choiceButton = xml.ChoiceButton

  const choiceButtonPicture = importPictureFromXML(context, xml.ChoiceButtonPicture)
  if (choiceButtonPicture !== undefined) result.choiceButtonPicture = choiceButtonPicture

  if (xml.ChoiceButtonRepresentation !== undefined) result.choiceButtonRepresentation = xml.ChoiceButtonRepresentation

  if (xml.ChoiceFoldersAndItems !== undefined) result.choiceFoldersAndItems = xml.ChoiceFoldersAndItems

  if (xml.ChoiceForm !== undefined) result.choiceForm = xml.ChoiceForm

  if (xml.ChoiceHistoryOnInput !== undefined) result.choiceHistoryOnInput = xml.ChoiceHistoryOnInput

  const choiceList = importChoiceListFromXML(context, xml.ChoiceList)
  if (choiceList !== undefined) result.choiceList = choiceList

  if (xml.ChoiceListButton !== undefined) result.choiceListButton = xml.ChoiceListButton

  if (xml.ChoiceListHeight !== undefined) result.choiceListHeight = xml.ChoiceListHeight

  const choiceParameterLinks = importChoiceParameterLinksFromXML(context, xml.ChoiceParameterLinks)
  if (choiceParameterLinks !== undefined) result.choiceParameterLinks = choiceParameterLinks

  const choiceParameters = importChoiceParametersFromXML(context, xml.ChoiceParameters)
  if (choiceParameters !== undefined) result.choiceParameters = choiceParameters

  if (xml.ChooseType !== undefined) result.chooseType = xml.ChooseType

  if (xml.ClearButton !== undefined) result.clearButton = xml.ClearButton

  if (xml.CreateButton !== undefined) result.createButton = xml.CreateButton

  if (xml.DropListButton !== undefined) result.dropListButton = xml.DropListButton

  if (xml.DropListWidth !== undefined) result.dropListWidth = xml.DropListWidth

  const editFormat = importI8nTextFromXML(context, xml.EditFormat)
  if (editFormat !== undefined) result.editFormat = editFormat

  if (xml.EditText !== undefined) result.editText = xml.EditText

  if (xml.EditTextUpdate !== undefined) result.editTextUpdate = xml.EditTextUpdate

  if (xml.ExtendedEdit !== undefined) result.extendedEdit = xml.ExtendedEdit

  const extendedTooltip = importExtendedTooltipFromXML(context, xml.ExtendedTooltip, result)
  if (extendedTooltip !== undefined) result.extendedTooltip = extendedTooltip

  const font = importFontFromXML(context, xml.Font)
  if (font !== undefined) result.font = font

  const format = importI8nTextFromXML(context, xml.Format)
  if (format !== undefined) result.format = format

  if (xml.Height !== undefined) result.height = xml.Height

  if (xml.HeightControlVariant !== undefined) result.heightControlVariant = xml.HeightControlVariant

  if (xml.HorizontalStretch !== undefined) result.horizontalStretch = xml.HorizontalStretch

  if (xml.IncompleteChoiceMode !== undefined) result.incompleteChoiceMode = xml.IncompleteChoiceMode

  const inputHint = importI8nTextFromXML(context, xml.InputHint)
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

  const multipleValuesBackColor = importColorFromXML(context, xml.MultipleValuesBackColor)
  if (multipleValuesBackColor !== undefined) result.multipleValuesBackColor = multipleValuesBackColor

  if (xml.MultipleValuesExtendedEdit !== undefined) result.multipleValuesExtendedEdit = xml.MultipleValuesExtendedEdit

  const multipleValuesFont = importFontFromXML(context, xml.MultipleValuesFont)
  if (multipleValuesFont !== undefined) result.multipleValuesFont = multipleValuesFont

  if (xml.MultipleValuesHyperlink !== undefined) result.multipleValuesHyperlink = xml.MultipleValuesHyperlink

  const multipleValuesPicture = importPictureFromXML(context, xml.MultipleValuesPicture)
  if (multipleValuesPicture !== undefined) result.multipleValuesPicture = multipleValuesPicture

  const multipleValuesTextColor = importColorFromXML(context, xml.MultipleValuesTextColor)
  if (multipleValuesTextColor !== undefined) result.multipleValuesTextColor = multipleValuesTextColor

  if (xml.MultipleValueValueDataPath !== undefined) result.multipleValueValueDataPath = xml.MultipleValueValueDataPath

  if (xml.OnScreenKeyboardReturnKeyText !== undefined)
    result.onScreenKeyboardReturnKeyText = xml.OnScreenKeyboardReturnKeyText

  if (xml.OpenButton !== undefined) result.openButton = xml.OpenButton

  if (xml.PasswordMode !== undefined) result.passwordMode = xml.PasswordMode

  if (xml.QuickChoice !== undefined) result.quickChoice = xml.QuickChoice

  if (xml.SelectedText !== undefined) result.selectedText = xml.SelectedText

  if (xml.ShowCheckBoxesInDropListWhenInputMultipleValues !== undefined)
    result.showCheckBoxesInDropListWhenInputMultipleValues = xml.ShowCheckBoxesInDropListWhenInputMultipleValues

  if (xml.SpecialTextInputMode !== undefined) result.specialTextInputMode = xml.SpecialTextInputMode

  if (xml.SpellCheckingOnTextInput !== undefined) result.spellCheckingOnTextInput = xml.SpellCheckingOnTextInput

  if (xml.SpinButton !== undefined) result.spinButton = xml.SpinButton

  const textColor = importColorFromXML(context, xml.TextColor)
  if (textColor !== undefined) result.textColor = textColor

  if (xml.TextEdit !== undefined) result.textEdit = xml.TextEdit

  if (xml.TypeDomainEnabled !== undefined) result.typeDomainEnabled = xml.TypeDomainEnabled

  const typeLink = importTypeLinkFromXML(context, xml.TypeLink)
  if (typeLink !== undefined) result.typeLink = typeLink

  const userVisible = importUserVisibleFromXML(context, xml.UserVisible)
  if (userVisible !== undefined) result.userVisible = userVisible

  if (xml.VerticalStretch !== undefined) result.verticalStretch = xml.VerticalStretch

  if (xml.Width !== undefined) result.width = xml.Width

  if (xml.Wrap !== undefined) result.wrap = xml.Wrap

  const events = importEventsFromXML(context, xml.Events)
  if (events !== undefined) result.events = events

  return result
}

registerMetadata("ImportFromXML", "InputField", importInputFieldFromXML)
