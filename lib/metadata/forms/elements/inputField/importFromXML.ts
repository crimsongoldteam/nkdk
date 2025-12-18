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
  xml: InputFieldXML | undefined,
  configurationSettings: ConfigurationSettings
): InputField | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importFormFieldFromXML(xml, configurationSettings)!,
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
    availableTypes: importTypeDescriptionFromXML(xml.AvailableTypes, configurationSettings),
    backColor: importColorFromXML(xml.BackColor, configurationSettings),
    borderColor: importColorFromXML(xml.BorderColor, configurationSettings),
    choiceButton: xml.ChoiceButton,
    choiceButtonPicture: importPictureFromXML(xml.ChoiceButtonPicture, configurationSettings),
    choiceButtonRepresentation: xml.ChoiceButtonRepresentation,
    choiceFoldersAndItems: xml.ChoiceFoldersAndItems,
    choiceForm: xml.ChoiceForm,
    choiceHistoryOnInput: xml.ChoiceHistoryOnInput,
    choiceList: importChoiceListFromXML(xml.ChoiceList, configurationSettings),
    choiceListButton: xml.ChoiceListButton,
    choiceListHeight: xml.ChoiceListHeight,
    choiceParameterLinks: importChoiceParameterLinksFromXML(xml.ChoiceParameterLinks, configurationSettings),
    choiceParameters: importChoiceParameterLinksFromXML(xml.ChoiceParameters, configurationSettings),
    chooseType: xml.ChooseType,
    clearButton: xml.ClearButton,
    createButton: xml.CreateButton,
    dropListButton: xml.DropListButton,
    dropListWidth: xml.DropListWidth,
    editFormat: importI8nTextFromXML(xml.EditFormat, configurationSettings),
    editText: xml.EditText,
    editTextUpdate: xml.EditTextUpdate,
    extendedEdit: xml.ExtendedEdit,
    font: importFontFromXML(xml.Font, configurationSettings),
    format: importI8nTextFromXML(xml.Format, configurationSettings),
    height: xml.Height,
    heightControlVariant: xml.HeightControlVariant,
    horizontalStretch: xml.HorizontalStretch,
    incompleteChoiceMode: xml.IncompleteChoiceMode,
    inputHint: importI8nTextFromXML(xml.InputHint, configurationSettings),
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
    multipleValuesBackColor: importColorFromXML(xml.MultipleValuesBackColor, configurationSettings),
    multipleValuesExtendedEdit: xml.MultipleValuesExtendedEdit,
    multipleValuesFont: importFontFromXML(xml.MultipleValuesFont, configurationSettings),
    multipleValuesHyperlink: xml.MultipleValuesHyperlink,
    multipleValuesPicture: importPictureFromXML(xml.MultipleValuesPicture, configurationSettings),
    multipleValuesTextColor: importColorFromXML(xml.MultipleValuesTextColor, configurationSettings),
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
    textColor: importColorFromXML(xml.TextColor, configurationSettings),
    textEdit: xml.TextEdit,
    typeDomainEnabled: xml.TypeDomainEnabled,
    typeLink: importTypeLinkFromXML(xml.TypeLink, configurationSettings),
    userVisible: importUserVisibleFromXML(xml.UserVisible, configurationSettings),
    verticalStretch: xml.VerticalStretch,
    width: xml.Width,
    wrap: xml.Wrap,
    events: importEventsFromXML(xml.Events, configurationSettings),
  })
}

registerMetadata("ImportFromXML", "InputField", importInputFieldFromXML)
