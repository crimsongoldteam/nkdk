import { importChoiceListFromXML } from "~/packages/core/metadata/commonObjects/choiceList/importFromXML"
import { importColorFromXML } from "~/packages/core/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/packages/core/metadata/commonObjects/font/importFromXML"
import { importI8nTextFromXML } from "~/packages/core/metadata/commonObjects/i8nText/importFromXML"
import { importPictureFromXML } from "~/packages/core/metadata/commonObjects/pictures/importFromXML"
import { importTypeDescriptionFromXML } from "~/packages/core/metadata/commonObjects/typeDescription/importFromXML"
import { importTypeLinkFromXML } from "~/packages/core/metadata/commonObjects/typeLink/importFromXML"
import { importUserVisibleFromXML } from "~/packages/core/metadata/commonObjects/userVisible/importFromXML"
import { importChoiceParameterLinksFromXML } from "~/packages/core/metadata/commonObjects/сhoiceParameterLinks/importFromXML"
import { Context } from "~/packages/core/metadata/context/types"
import { importFormFieldFromXML } from "~/packages/core/metadata/forms/elements/formField/importFromXML"
import { InputField, InputFieldXML } from "~/packages/core/metadata/forms/elements/inputField/types"
import { importEventsFromXML } from "~/packages/core/metadata/forms/events/importFromXML"
import { compactObject } from "~/packages/core/metadata/helpers/compactObject"
import { registerMetadata } from "~/packages/core/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/packages/core/metadata/metadataFactory/types"

export const importInputFieldFromXML = (context: Context, xml: InputFieldXML | undefined): InputField | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importFormFieldFromXML(context, xml)!,
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
    availableTypes: importTypeDescriptionFromXML(context, xml.AvailableTypes),
    backColor: importColorFromXML(context, xml.BackColor),
    borderColor: importColorFromXML(context, xml.BorderColor),
    choiceButton: xml.ChoiceButton,
    choiceButtonPicture: importPictureFromXML(context, xml.ChoiceButtonPicture),
    choiceButtonRepresentation: xml.ChoiceButtonRepresentation,
    choiceFoldersAndItems: xml.ChoiceFoldersAndItems,
    choiceForm: xml.ChoiceForm,
    choiceHistoryOnInput: xml.ChoiceHistoryOnInput,
    choiceList: importChoiceListFromXML(context, xml.ChoiceList),
    choiceListButton: xml.ChoiceListButton,
    choiceListHeight: xml.ChoiceListHeight,
    choiceParameterLinks: importChoiceParameterLinksFromXML(context, xml.ChoiceParameterLinks),
    choiceParameters: importChoiceParameterLinksFromXML(context, xml.ChoiceParameters),
    chooseType: xml.ChooseType,
    clearButton: xml.ClearButton,
    createButton: xml.CreateButton,
    dropListButton: xml.DropListButton,
    dropListWidth: xml.DropListWidth,
    editFormat: importI8nTextFromXML(context, xml.EditFormat),
    editText: xml.EditText,
    editTextUpdate: xml.EditTextUpdate,
    extendedEdit: xml.ExtendedEdit,
    font: importFontFromXML(context, xml.Font),
    format: importI8nTextFromXML(context, xml.Format),
    height: xml.Height,
    heightControlVariant: xml.HeightControlVariant,
    horizontalStretch: xml.HorizontalStretch,
    incompleteChoiceMode: xml.IncompleteChoiceMode,
    inputHint: importI8nTextFromXML(context, xml.InputHint),
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
    multipleValuesBackColor: importColorFromXML(context, xml.MultipleValuesBackColor),
    multipleValuesExtendedEdit: xml.MultipleValuesExtendedEdit,
    multipleValuesFont: importFontFromXML(context, xml.MultipleValuesFont),
    multipleValuesHyperlink: xml.MultipleValuesHyperlink,
    multipleValuesPicture: importPictureFromXML(context, xml.MultipleValuesPicture),
    multipleValuesTextColor: importColorFromXML(context, xml.MultipleValuesTextColor),
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
    textColor: importColorFromXML(context, xml.TextColor),
    textEdit: xml.TextEdit,
    typeDomainEnabled: xml.TypeDomainEnabled,
    typeLink: importTypeLinkFromXML(context, xml.TypeLink),
    userVisible: importUserVisibleFromXML(context, xml.UserVisible),
    verticalStretch: xml.VerticalStretch,
    width: xml.Width,
    wrap: xml.Wrap,
    events: importEventsFromXML(context, xml.Events),
  })
}

registerMetadata("ImportFromXML", "InputField", importInputFieldFromXML)
