import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportTypeDescriptionToXML } from "~/lib/metadata/commonObjects/typeDescription/exportToXML"
import { exportPictureToXML } from "~/lib/metadata/commonObjects/pictures/exportToXML"
import { exportChoiceListToXML } from "~/lib/metadata/commonObjects/choiceList/exportToXML"
import { exportTypeLinkToXML } from "~/lib/metadata/commonObjects/typeLink/exportToXML"
import { exportChoiceParameterLinksToXML } from "~/lib/metadata/commonObjects/сhoiceParameterLinks/exportToXML"
import { exportFormFieldToXML } from "../formField/exportToXML"
import { TInputFieldXML, TInputField } from "./types"

export const exportInputFieldToXML = (data: TInputField | undefined): TInputFieldXML | undefined => {
  if (!data) return undefined

  const base = exportFormFieldToXML(data)
  if (!base) return undefined
   
  return {
    ...base,
    AutoChoiceIncomplete: data.autoChoiceIncomplete,
    AutoCapitalizationOnTextInput: data.autoCapitalizationOnTextInput,
    AutoCorrectionOnTextInput: data.autoCorrectionOnTextInput,
    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    AutoMarkIncomplete: data.autoMarkIncomplete,
    AutoShowOpenButton: data.autoShowOpenButton,
    AutoShowClearButton: data.autoShowClearButton,
    Wrap: data.wrap,
    QuickChoice: data.quickChoice,
    HeightControlVariant: data.heightControlVariant,
    ChooseType: data.chooseType,
    ChoiceFoldersAndItems: data.choiceFoldersAndItems,
    SelectedText: data.selectedText,
    MarkNegatives: data.markNegatives,
    Height: data.height,
    ChoiceListHeight: data.choiceListHeight,
    MultipleValuesHyperlink: data.multipleValuesHyperlink,
    AvailableTypes: exportTypeDescriptionToXML(data.availableTypes),
    ChoiceHistoryOnInput: data.choiceHistoryOnInput,
    ChoiceButtonPicture: exportPictureToXML(data.choiceButtonPicture),
    MultipleValuesPicture: exportPictureToXML(data.multipleValuesPicture),
    ChoiceButton: data.choiceButton,
    DropListButton: data.dropListButton,
    OpenButton: data.openButton,
    ClearButton: data.clearButton,
    SpinButton: data.spinButton,
    CreateButton: data.createButton,
    ChoiceListButton: data.choiceListButton,
    MaxHeight: data.maxHeight,
    MaxWidth: data.maxWidth,
    MaxValue: data.maxValue,
    Mask: data.mask,
    MinValue: data.minValue,
    MultiLine: data.multiLine,
    EditTextUpdate: data.editTextUpdate,
    MarkIncomplete: data.markIncomplete,
    ShowCheckBoxesInDropListWhenInputMultipleValues: data.showCheckBoxesInDropListWhenInputMultipleValues,
    ChoiceButtonRepresentation: data.choiceButtonRepresentation,
    ChoiceParameters: exportChoiceParameterLinksToXML(data.choiceParameters),
    AutoFillHint: data.autoFillHint,
    InputHint: data.inputHint,
    SpellCheckingOnTextInput: data.spellCheckingOnTextInput,
    MultipleValueValueDataPath: data.multipleValueValueDataPath,
    MultipleValuePictureDataPath: data.multipleValuePictureDataPath,
    MultipleValuePresentationDataPath: data.multipleValuePresentationDataPath,
    MultipleValuePictureSize: data.multipleValuePictureSize,
    AllowInputEmptyMultipleValues: data.allowInputEmptyMultipleValues,
    AllowMultipleValuesDuplicates: data.allowMultipleValuesDuplicates,
    TypeDomainEnabled: data.typeDomainEnabled,
    VerticalStretch: data.verticalStretch,
    HorizontalStretch: data.horizontalStretch,
    ExtendedEdit: data.extendedEdit,
    MultipleValuesExtendedEdit: data.multipleValuesExtendedEdit,
    TextEdit: data.textEdit,
    ListChoiceMode: data.listChoiceMode,
    IncompleteChoiceMode: data.incompleteChoiceMode,
    PasswordMode: data.passwordMode,
    ChoiceParameterLinks: exportChoiceParameterLinksToXML(data.choiceParameterLinks),
    TypeLink: exportTypeLinkToXML(data.typeLink),
    SpecialTextInputMode: data.specialTextInputMode,
    ChoiceList: exportChoiceListToXML(data.choiceList),
    OnScreenKeyboardReturnKeyText: data.onScreenKeyboardReturnKeyText,
    EditText: data.editText,
    MultipleValuePictureShape: data.multipleValuePictureShape,
    ChoiceForm: data.choiceForm,
    Format: data.format,
    EditFormat: data.editFormat,
    BorderColor: exportColorToXML(data.borderColor),
    TextColor: exportColorToXML(data.textColor),
    MultipleValuesTextColor: exportColorToXML(data.multipleValuesTextColor),
    BackColor: exportColorToXML(data.backColor),
    MultipleValuesBackColor: exportColorToXML(data.multipleValuesBackColor),
    Width: data.width,
    DropListWidth: data.dropListWidth,
    Font: exportFontToXML(data.font),
    MultipleValuesFont: exportFontToXML(data.multipleValuesFont),
  }
}