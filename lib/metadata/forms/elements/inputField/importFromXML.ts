import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importTypeDescriptionFromXML } from "~/lib/metadata/commonObjects/typeDescription/importFromXML"
import { importPictureFromXML } from "~/lib/metadata/commonObjects/pictures/importFromXML"
import { importChoiceListFromXML } from "~/lib/metadata/commonObjects/choiceList/importFromXML"
import { importTypeLinkFromXML } from "~/lib/metadata/commonObjects/typeLink/importFromXML"
import { importChoiceParameterLinksFromXML } from "~/lib/metadata/commonObjects/сhoiceParameterLinks/importFromXML"
import { importFormFieldFromXML } from "../formField/importFromXML"
import { TInputFieldXML, TInputField } from "./types"
import { ZElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"

export const importInputFieldFromXML = (xml: TInputFieldXML | undefined): TInputField | undefined => {
  if (!xml) return undefined

  const base = importFormFieldFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    elementType: ZElementType.enum.InputField,
    allowInputEmptyMultipleValues: xml.AllowInputEmptyMultipleValues,
    allowMultipleValuesDuplicates: xml.AllowMultipleValuesDuplicates,
    autoCapitalizationOnTextInput: xml.AutoCapitalizationOnTextInput,
    autoChoiceIncomplete: xml.AutoChoiceIncomplete,
    autoCorrectionOnTextInput: xml.AutoCorrectionOnTextInput,
    autoFillHint: xml.AutoFillHint,
    autoMarkIncomplete: xml.AutoMarkIncomplete,
    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    autoShowClearButton: xml.AutoShowClearButton,
    autoShowOpenButton: xml.AutoShowOpenButton,
    availableTypes: importTypeDescriptionFromXML(xml.AvailableTypes),
    backColor: importColorFromXML(xml.BackColor),
    borderColor: importColorFromXML(xml.BorderColor),
    choiceButton: xml.ChoiceButton,
    choiceButtonPicture: importPictureFromXML(xml.ChoiceButtonPicture),
    choiceButtonRepresentation: xml.ChoiceButtonRepresentation,
    choiceFoldersAndItems: xml.ChoiceFoldersAndItems,
    choiceForm: xml.ChoiceForm,
    choiceHistoryOnInput: xml.ChoiceHistoryOnInput,
    choiceList: importChoiceListFromXML(xml.ChoiceList),
    choiceListButton: xml.ChoiceListButton,
    choiceListHeight: xml.ChoiceListHeight,
    choiceParameterLinks: importChoiceParameterLinksFromXML(xml.ChoiceParameterLinks),
    choiceParameters: importChoiceParameterLinksFromXML(xml.ChoiceParameters),
    chooseType: xml.ChooseType,
    clearButton: xml.ClearButton,
    createButton: xml.CreateButton,
    dropListButton: xml.DropListButton,
    dropListWidth: xml.DropListWidth,
    editFormat: xml.EditFormat,
    editText: xml.EditText,
    editTextUpdate: xml.EditTextUpdate,
    extendedEdit: xml.ExtendedEdit,
    font: importFontFromXML(xml.Font),
    format: xml.Format,
    height: xml.Height,
    heightControlVariant: xml.HeightControlVariant,
    horizontalStretch: xml.HorizontalStretch,
    incompleteChoiceMode: xml.IncompleteChoiceMode,
    inputHint: xml.InputHint,
    listChoiceMode: xml.ListChoiceMode,
    markIncomplete: xml.MarkIncomplete,
    markNegatives: xml.MarkNegatives,
    mask: xml.Mask,
    maxHeight: xml.MaxHeight,
    maxValue: xml.MaxValue,
    maxWidth: xml.MaxWidth,
    minValue: xml.MinValue,
    multiLine: xml.MultiLine,
    multipleValuePictureDataPath: xml.MultipleValuePictureDataPath,
    multipleValuePictureShape: xml.MultipleValuePictureShape,
    multipleValuePictureSize: xml.MultipleValuePictureSize,
    multipleValuePresentationDataPath: xml.MultipleValuePresentationDataPath,
    multipleValuesBackColor: importColorFromXML(xml.MultipleValuesBackColor),
    multipleValuesExtendedEdit: xml.MultipleValuesExtendedEdit,
    multipleValuesFont: importFontFromXML(xml.MultipleValuesFont),
    multipleValuesHyperlink: xml.MultipleValuesHyperlink,
    multipleValuesPicture: importPictureFromXML(xml.MultipleValuesPicture),
    multipleValuesTextColor: importColorFromXML(xml.MultipleValuesTextColor),
    multipleValueValueDataPath: xml.MultipleValueValueDataPath,
    onScreenKeyboardReturnKeyText: xml.OnScreenKeyboardReturnKeyText,
    openButton: xml.OpenButton,
    passwordMode: xml.PasswordMode,
    quickChoice: xml.QuickChoice,
    selectedText: xml.SelectedText,
    showCheckBoxesInDropListWhenInputMultipleValues: xml.ShowCheckBoxesInDropListWhenInputMultipleValues,
    specialTextInputMode: xml.SpecialTextInputMode,
    spellCheckingOnTextInput: xml.SpellCheckingOnTextInput,
    spinButton: xml.SpinButton,
    textColor: importColorFromXML(xml.TextColor),
    textEdit: xml.TextEdit,
    typeDomainEnabled: xml.TypeDomainEnabled,
    typeLink: importTypeLinkFromXML(xml.TypeLink),
    verticalStretch: xml.VerticalStretch,
    width: xml.Width,
    wrap: xml.Wrap,
  }
}

registerImport(ZElementType.enum.InputField, importInputFieldFromXML)