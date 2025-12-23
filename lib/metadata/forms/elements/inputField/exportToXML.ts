import { exportChoiceListToXML } from "~/lib/metadata/commonObjects/choiceList/exportToXML"
import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportToXML"
import { exportPictureToXML } from "~/lib/metadata/commonObjects/pictures/exportToXML"
import { exportTypeDescriptionToXML } from "~/lib/metadata/commonObjects/typeDescription/exportToXML"
import { exportTypeLinkToXML } from "~/lib/metadata/commonObjects/typeLink/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { exportChoiceParameterLinksToXML } from "~/lib/metadata/commonObjects/сhoiceParameterLinks/exportToXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { exportFormFieldToXML } from "~/lib/metadata/forms/elements/formField/exportToXML"
import { InputField, InputFieldXML } from "~/lib/metadata/forms/elements/inputField/types"
import { exportEventsToXML } from "~/lib/metadata/forms/events/exportToXML"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"

export const exportInputFieldToXML = (
  configurationSettings: ConfigurationSettings, data: InputField | undefined
): InputFieldXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormFieldToXML(configurationSettings, data)!,

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
    AvailableTypes: exportTypeDescriptionToXML(configurationSettings, data.availableTypes),
    BackColor: exportColorToXML(configurationSettings, data.backColor),
    BorderColor: exportColorToXML(configurationSettings, data.borderColor),
    ChoiceButton: data.choiceButton,
    ChoiceButtonPicture: exportPictureToXML(configurationSettings, data.choiceButtonPicture),
    ChoiceButtonRepresentation: data.choiceButtonRepresentation,
    ChoiceFoldersAndItems: data.choiceFoldersAndItems,
    ChoiceForm: data.choiceForm,
    ChoiceHistoryOnInput: data.choiceHistoryOnInput,
    ChoiceList: exportChoiceListToXML(configurationSettings, data.choiceList),
    ChoiceListButton: data.choiceListButton,
    ChoiceListHeight: data.choiceListHeight,
    ChoiceParameterLinks: exportChoiceParameterLinksToXML(configurationSettings, data.choiceParameterLinks),
    ChoiceParameters: exportChoiceParameterLinksToXML(configurationSettings, data.choiceParameters),
    ChooseType: data.chooseType,
    ClearButton: data.clearButton,
    CreateButton: data.createButton,
    DropListButton: data.dropListButton,
    DropListWidth: data.dropListWidth,
    EditFormat: exportI8nTextToXML(configurationSettings, data.editFormat),
    EditText: data.editText,
    EditTextUpdate: data.editTextUpdate,
    ExtendedEdit: data.extendedEdit,
    Font: exportFontToXML(configurationSettings, data.font),
    Format: exportI8nTextToXML(configurationSettings, data.format),
    Height: data.height,
    HeightControlVariant: data.heightControlVariant,
    HorizontalStretch: data.horizontalStretch,
    IncompleteChoiceMode: data.incompleteChoiceMode,
    InputHint: exportI8nTextToXML(configurationSettings, data.inputHint),
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
    MultipleValuesBackColor: exportColorToXML(configurationSettings, data.multipleValuesBackColor),
    MultipleValuesExtendedEdit: data.multipleValuesExtendedEdit,
    MultipleValuesFont: exportFontToXML(configurationSettings, data.multipleValuesFont),
    MultipleValuesHyperlink: data.multipleValuesHyperlink,
    MultipleValuesPicture: exportPictureToXML(configurationSettings, data.multipleValuesPicture),
    MultipleValuesTextColor: exportColorToXML(configurationSettings, data.multipleValuesTextColor),
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
    TextColor: exportColorToXML(configurationSettings, data.textColor),
    TextEdit: data.textEdit,
    TypeDomainEnabled: data.typeDomainEnabled,
    TypeLink: exportTypeLinkToXML(configurationSettings, data.typeLink),
    UserVisible: exportUserVisibleToXML(configurationSettings, data.userVisible),
    VerticalStretch: data.verticalStretch,
    Width: data.width,
    Wrap: data.wrap,
    Events: exportEventsToXML(configurationSettings, data.events),
  })
}

registerMetadata("ExportToXML", "InputField", exportInputFieldToXML)
