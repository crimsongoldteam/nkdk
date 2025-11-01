import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportI8nTextToXML"
import { exportTypeDescriptionToXML } from "~/lib/metadata/commonObjects/typeDescription/exportToXML"
import { exportPictureToXML } from "~/lib/metadata/commonObjects/pictures/exportToXML"
import { exportChoiceListToXML } from "~/lib/metadata/commonObjects/choiceList/exportToXML"
import { exportTypeLinkToXML } from "~/lib/metadata/commonObjects/typeLink/exportToXML"
import { exportChoiceParameterLinksToXML } from "~/lib/metadata/commonObjects/сhoiceParameterLinks/exportToXML"
import { exportFormFieldToXML } from "../formField/exportToXML"
import { TInputFieldXML, TInputField } from "./types"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { ZElementType } from "../types"
import { sortObjectByKeys } from "~/lib/xml/export/sortObjectKeys"

const ORDER = ["DataPath", "Visible", "UserVisible", "Enabled", "ReadOnly", "SkipOnInput", "Title", "TitleTextColor", "TitleFont", "TitleLocation", "TitleHeight", "ToolTip", "ToolTipRepresentation", "WarningOnEditRepresentation", "WarningOnEdit", "Shortcut", "HorizontalAlign", "GroupHorizontalAlign", "GroupVerticalAlign", "OnMainServerUnavalableBehavior", "Width", "AutoMaxWidth", "MaxWidth", "Height", "AutoMaxHeight", "MaxHeight", "HorizontalStretch", "VerticalStretch", "Wrap", "PasswordMode", "MultiLine", "ExtendedEdit", "DropListButton", "ChoiceButton", "ClearButton", "SpinButton", "OpenButton", "CreateButton", "Mask", "ListChoiceMode", "ExtendedEditMultipleValues", "AutoChoiceIncomplete", "QuickChoice", "ChoiceFoldersAndItems", "AutoMarkIncomplete", "ChooseType", "IncompleteChoiceMode", "TextEdit", "EditTextUpdate", "ChoiceButtonPicture", "ChoiceList", "ChoiceListHeight", "DropListWidth", "TextColor", "BackColor", "BorderColor", "Font", "TypeLink", "HeightControlVariant", "AutoShowClearButtonMode", "AutoShowOpenButtonMode", "AutoCorrectionOnTextInput", "SpellCheckingOnTextInput", "AutoCapitalizationOnTextInput", "SpecialTextInputMode", "AutofillHint", "OnScreenKeyboardReturnKeyText", "InputHint", "ChoiceHistoryOnInput", "ContextMenu", "ExtendedTooltip", "Events"]

export const exportInputFieldToXML = (data: TInputField | undefined): TInputFieldXML | undefined => {
  if (!data) return undefined

  const base = exportFormFieldToXML(data)
  if (!base) return undefined
   
  return sortObjectByKeys<TInputFieldXML>( {
    ...base,
    AllowInputEmptyMultipleValues: data.allowInputEmptyMultipleValues,
    AllowMultipleValuesDuplicates: data.allowMultipleValuesDuplicates,
    AutoCapitalizationOnTextInput: data.autoCapitalizationOnTextInput,
    AutoChoiceIncomplete: data.autoChoiceIncomplete,
    AutoCorrectionOnTextInput: data.autoCorrectionOnTextInput,
    AutoFillHint: data.autoFillHint,
    AutoMarkIncomplete: data.autoMarkIncomplete,
    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    AutoShowClearButton: data.autoShowClearButton,
    AutoShowOpenButton: data.autoShowOpenButton,
    AvailableTypes: exportTypeDescriptionToXML(data.availableTypes),
    BackColor: exportColorToXML(data.backColor),
    BorderColor: exportColorToXML(data.borderColor),
    ChoiceButton: data.choiceButton,
    ChoiceButtonPicture: exportPictureToXML(data.choiceButtonPicture),
    ChoiceButtonRepresentation: data.choiceButtonRepresentation,
    ChoiceFoldersAndItems: data.choiceFoldersAndItems,
    ChoiceForm: data.choiceForm,
    ChoiceHistoryOnInput: data.choiceHistoryOnInput,
    ChoiceList: exportChoiceListToXML(data.choiceList),
    ChoiceListButton: data.choiceListButton,
    ChoiceListHeight: data.choiceListHeight,
    ChoiceParameterLinks: exportChoiceParameterLinksToXML(data.choiceParameterLinks),
    ChoiceParameters: exportChoiceParameterLinksToXML(data.choiceParameters),
    ChooseType: data.chooseType,
    ClearButton: data.clearButton,
    CreateButton: data.createButton,
    DropListButton: data.dropListButton,
    DropListWidth: data.dropListWidth,
    EditFormat: exportI8nTextToXML(data.editFormat),
    EditText: data.editText,
    EditTextUpdate: data.editTextUpdate,
    ExtendedEdit: data.extendedEdit,
    Font: exportFontToXML(data.font),
    Format: exportI8nTextToXML(data.format),
    Height: data.height,
    HeightControlVariant: data.heightControlVariant,
    HorizontalStretch: data.horizontalStretch,
    IncompleteChoiceMode: data.incompleteChoiceMode,
    InputHint: exportI8nTextToXML(data.inputHint),
    ListChoiceMode: data.listChoiceMode,
    MarkIncomplete: data.markIncomplete,
    MarkNegatives: data.markNegatives,
    Mask: data.mask,
    MaxHeight: data.maxHeight,
    MaxValue: data.maxValue,
    MaxWidth: data.maxWidth,
    MinValue: data.minValue,
    MultiLine: data.multiLine,
    MultipleValuePictureDataPath: data.multipleValuePictureDataPath,
    MultipleValuePictureShape: data.multipleValuePictureShape,
    MultipleValuePictureSize: data.multipleValuePictureSize,
    MultipleValuePresentationDataPath: data.multipleValuePresentationDataPath,
    MultipleValuesBackColor: exportColorToXML(data.multipleValuesBackColor),
    MultipleValuesExtendedEdit: data.multipleValuesExtendedEdit,
    MultipleValuesFont: exportFontToXML(data.multipleValuesFont),
    MultipleValuesHyperlink: data.multipleValuesHyperlink,
    MultipleValuesPicture: exportPictureToXML(data.multipleValuesPicture),
    MultipleValuesTextColor: exportColorToXML(data.multipleValuesTextColor),
    MultipleValueValueDataPath: data.multipleValueValueDataPath,
    OnScreenKeyboardReturnKeyText: data.onScreenKeyboardReturnKeyText,
    OpenButton: data.openButton,
    PasswordMode: data.passwordMode,
    QuickChoice: data.quickChoice,
    SelectedText: data.selectedText,
    ShowCheckBoxesInDropListWhenInputMultipleValues: data.showCheckBoxesInDropListWhenInputMultipleValues,
    SpecialTextInputMode: data.specialTextInputMode,
    SpellCheckingOnTextInput: data.spellCheckingOnTextInput,
    SpinButton: data.spinButton,
    TextColor: exportColorToXML(data.textColor),
    TextEdit: data.textEdit,
    TypeDomainEnabled: data.typeDomainEnabled,
    TypeLink: exportTypeLinkToXML(data.typeLink),
    VerticalStretch: data.verticalStretch,
    Width: data.width,
    Wrap: data.wrap,
  }, ORDER)
}

registerExport(ZElementType.enum.InputField, exportInputFieldToXML)