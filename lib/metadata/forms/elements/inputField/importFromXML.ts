import { importChoiceListFromXML } from "~/lib/metadata/commonObjects/choiceList/importFromXML"
import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importFromXML"
import { importPictureFromXML } from "~/lib/metadata/commonObjects/pictures/importFromXML"
import { importTypeDescriptionFromXML } from "~/lib/metadata/commonObjects/typeDescription/importFromXML"
import { importTypeLinkFromXML } from "~/lib/metadata/commonObjects/typeLink/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { importChoiceParameterLinksFromXML } from "~/lib/metadata/commonObjects/сhoiceParameterLinks/importFromXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { importFormFieldFromXML } from "~/lib/metadata/forms/elements/formField/importFromXML"
import { InputField, InputFieldXML } from "~/lib/metadata/forms/elements/inputField/types"
import { importEventsFromXML } from "~/lib/metadata/forms/events/importFromXML"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/lib/metadata/metadataFactory/types"

export const importInputFieldFromXML = (
  configurationSettings: ConfigurationSettings,
  xml: InputFieldXML | undefined
): InputField | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importFormFieldFromXML(configurationSettings, xml)!,
    elementType: FormElementType.InputField,

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
    availableTypes: importTypeDescriptionFromXML(configurationSettings, xml.AvailableTypes),
    backColor: importColorFromXML(configurationSettings, xml.BackColor),
    borderColor: importColorFromXML(configurationSettings, xml.BorderColor),
    choiceButton: xml.ChoiceButton,
    choiceButtonPicture: importPictureFromXML(configurationSettings, xml.ChoiceButtonPicture),
    choiceButtonRepresentation: xml.ChoiceButtonRepresentation,
    choiceFoldersAndItems: xml.ChoiceFoldersAndItems,
    choiceForm: xml.ChoiceForm,
    choiceHistoryOnInput: xml.ChoiceHistoryOnInput,
    choiceList: importChoiceListFromXML(configurationSettings, xml.ChoiceList),
    choiceListButton: xml.ChoiceListButton,
    choiceListHeight: xml.ChoiceListHeight,
    choiceParameterLinks: importChoiceParameterLinksFromXML(configurationSettings, xml.ChoiceParameterLinks),
    choiceParameters: importChoiceParameterLinksFromXML(configurationSettings, xml.ChoiceParameters),
    chooseType: xml.ChooseType,
    clearButton: xml.ClearButton,
    createButton: xml.CreateButton,
    dropListButton: xml.DropListButton,
    dropListWidth: xml.DropListWidth,
    editFormat: importI8nTextFromXML(configurationSettings, xml.EditFormat),
    editText: xml.EditText,
    editTextUpdate: xml.EditTextUpdate,
    extendedEdit: xml.ExtendedEdit,
    font: importFontFromXML(configurationSettings, xml.Font),
    format: importI8nTextFromXML(configurationSettings, xml.Format),
    height: xml.Height,
    heightControlVariant: xml.HeightControlVariant,
    horizontalStretch: xml.HorizontalStretch,
    incompleteChoiceMode: xml.IncompleteChoiceMode,
    inputHint: importI8nTextFromXML(configurationSettings, xml.InputHint),
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
    multipleValuesBackColor: importColorFromXML(configurationSettings, xml.MultipleValuesBackColor),
    multipleValuesExtendedEdit: xml.MultipleValuesExtendedEdit,
    multipleValuesFont: importFontFromXML(configurationSettings, xml.MultipleValuesFont),
    multipleValuesHyperlink: xml.MultipleValuesHyperlink,
    multipleValuesPicture: importPictureFromXML(configurationSettings, xml.MultipleValuesPicture),
    multipleValuesTextColor: importColorFromXML(configurationSettings, xml.MultipleValuesTextColor),
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
    textColor: importColorFromXML(configurationSettings, xml.TextColor),
    textEdit: xml.TextEdit,
    typeDomainEnabled: xml.TypeDomainEnabled,
    typeLink: importTypeLinkFromXML(configurationSettings, xml.TypeLink),
    userVisible: importUserVisibleFromXML(configurationSettings, xml.UserVisible),
    verticalStretch: xml.VerticalStretch,
    width: xml.Width,
    wrap: xml.Wrap,
    events: importEventsFromXML(configurationSettings, xml.Events),
  })
}

registerMetadata("ImportFromXML", "InputField", importInputFieldFromXML)
