import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importTypeDescriptionFromXML } from "~/lib/metadata/commonObjects/typeDescription/importFromXML"
import { importPictureFromXML } from "~/lib/metadata/commonObjects/pictures/importFromXML"
import { importChoiceListFromXML } from "~/lib/metadata/commonObjects/choiceList/importFromXML"
import { importTypeLinkFromXML } from "~/lib/metadata/commonObjects/typeLink/importFromXML"
import { importChoiceParameterLinksFromXML } from "~/lib/metadata/commonObjects/сhoiceParameterLinks/importFromXML"
import { importFormFieldFromXML } from "../formField/importFromXML"
import { TInputFieldXML, TInputField } from "./types"

export const importInputFieldFromXML = (xml: TInputFieldXML | undefined): TInputField | undefined => {
  if (!xml) return undefined 

  const base = importFormFieldFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    autoChoiceIncomplete: xml.AutoChoiceIncomplete,
    autoCapitalizationOnTextInput: xml.AutoCapitalizationOnTextInput,
    autoCorrectionOnTextInput: xml.AutoCorrectionOnTextInput,
    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    autoMarkIncomplete: xml.AutoMarkIncomplete,
    autoShowOpenButton: xml.AutoShowOpenButton,
    autoShowClearButton: xml.AutoShowClearButton,
    wrap: xml.Wrap,
    quickChoice: xml.QuickChoice,
    heightControlVariant: xml.HeightControlVariant,
    chooseType: xml.ChooseType,
    choiceFoldersAndItems: xml.ChoiceFoldersAndItems,
    selectedText: xml.SelectedText,
    markNegatives: xml.MarkNegatives,
    height: xml.Height,
    choiceListHeight: xml.ChoiceListHeight,
    multipleValuesHyperlink: xml.MultipleValuesHyperlink,
    availableTypes: importTypeDescriptionFromXML(xml.AvailableTypes),
    choiceHistoryOnInput: xml.ChoiceHistoryOnInput,
    choiceButtonPicture: importPictureFromXML(xml.ChoiceButtonPicture),
    multipleValuesPicture: importPictureFromXML(xml.MultipleValuesPicture),
    choiceButton: xml.ChoiceButton,
    dropListButton: xml.DropListButton,
    openButton: xml.OpenButton,
    clearButton: xml.ClearButton,
    spinButton: xml.SpinButton,
    createButton: xml.CreateButton,
    choiceListButton: xml.ChoiceListButton,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    maxValue: xml.MaxValue,
    mask: xml.Mask,
    minValue: xml.MinValue,
    multiLine: xml.MultiLine,
    editTextUpdate: xml.EditTextUpdate,
    markIncomplete: xml.MarkIncomplete,
    showCheckBoxesInDropListWhenInputMultipleValues: xml.ShowCheckBoxesInDropListWhenInputMultipleValues,
    choiceButtonRepresentation: xml.ChoiceButtonRepresentation,
    choiceParameters: importChoiceParameterLinksFromXML(xml.ChoiceParameters),
    autoFillHint: xml.AutoFillHint,
    inputHint: xml.InputHint,
    spellCheckingOnTextInput: xml.SpellCheckingOnTextInput,
    multipleValueValueDataPath: xml.MultipleValueValueDataPath,
    multipleValuePictureDataPath: xml.MultipleValuePictureDataPath,
    multipleValuePresentationDataPath: xml.MultipleValuePresentationDataPath,
    multipleValuePictureSize: xml.MultipleValuePictureSize,
    allowInputEmptyMultipleValues: xml.AllowInputEmptyMultipleValues,
    allowMultipleValuesDuplicates: xml.AllowMultipleValuesDuplicates,
    typeDomainEnabled: xml.TypeDomainEnabled,
    verticalStretch: xml.VerticalStretch,
    horizontalStretch: xml.HorizontalStretch,
    extendedEdit: xml.ExtendedEdit,
    multipleValuesExtendedEdit: xml.MultipleValuesExtendedEdit,
    textEdit: xml.TextEdit,
    listChoiceMode: xml.ListChoiceMode,
    incompleteChoiceMode: xml.IncompleteChoiceMode,
    passwordMode: xml.PasswordMode,
    choiceParameterLinks: importChoiceParameterLinksFromXML(xml.ChoiceParameterLinks),
    typeLink: importTypeLinkFromXML(xml.TypeLink),
    specialTextInputMode: xml.SpecialTextInputMode,
    choiceList: importChoiceListFromXML(xml.ChoiceList),
    onScreenKeyboardReturnKeyText: xml.OnScreenKeyboardReturnKeyText,
    editText: xml.EditText,
    multipleValuePictureShape: xml.MultipleValuePictureShape,
    choiceForm: xml.ChoiceForm,
    format: xml.Format,
    editFormat: xml.EditFormat,
    borderColor: importColorFromXML(xml.BorderColor),
    textColor: importColorFromXML(xml.TextColor),
    multipleValuesTextColor: importColorFromXML(xml.MultipleValuesTextColor),
    backColor: importColorFromXML(xml.BackColor),
    multipleValuesBackColor: importColorFromXML(xml.MultipleValuesBackColor),
    width: xml.Width,
    dropListWidth: xml.DropListWidth,
    font: importFontFromXML(xml.Font),
    multipleValuesFont: importFontFromXML(xml.MultipleValuesFont),
  }
}