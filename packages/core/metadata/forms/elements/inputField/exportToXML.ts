import { exportChoiceListToXML } from "~/packages/core/metadata/commonObjects/choiceList/exportToXML"
import { exportColorToXML } from "~/packages/core/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/packages/core/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML } from "~/packages/core/metadata/commonObjects/i8nText/exportToXML"
import { exportPictureToXML } from "~/packages/core/metadata/commonObjects/pictures/exportToXML"
import { exportTypeDescriptionToXML } from "~/packages/core/metadata/commonObjects/typeDescription/exportToXML"
import { exportTypeLinkToXML } from "~/packages/core/metadata/commonObjects/typeLink/exportToXML"
import { exportUserVisibleToXML } from "~/packages/core/metadata/commonObjects/userVisible/exportToXML"
import { exportChoiceParameterLinksToXML } from "~/packages/core/metadata/commonObjects/сhoiceParameterLinks/exportToXML"
import { Context } from "~/packages/core/metadata/context/types"
import { exportFormFieldToXML } from "~/packages/core/metadata/forms/elements/formField/exportToXML"
import { InputField, InputFieldXML } from "~/packages/core/metadata/forms/elements/inputField/types"
import { exportEventsToXML } from "~/packages/core/metadata/forms/events/exportToXML"
import { compactObject } from "~/packages/core/metadata/helpers/compactObject"
import { registerMetadata } from "~/packages/core/metadata/metadataFactory/metadataFactory"

export const exportInputFieldToXML = (context: Context, data: InputField | undefined): InputFieldXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormFieldToXML(context, data)!,

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
    AvailableTypes: exportTypeDescriptionToXML(context, data.availableTypes),
    BackColor: exportColorToXML(context, data.backColor),
    BorderColor: exportColorToXML(context, data.borderColor),
    ChoiceButton: data.choiceButton,
    ChoiceButtonPicture: exportPictureToXML(context, data.choiceButtonPicture),
    ChoiceButtonRepresentation: data.choiceButtonRepresentation,
    ChoiceFoldersAndItems: data.choiceFoldersAndItems,
    ChoiceForm: data.choiceForm,
    ChoiceHistoryOnInput: data.choiceHistoryOnInput,
    ChoiceList: exportChoiceListToXML(context, data.choiceList),
    ChoiceListButton: data.choiceListButton,
    ChoiceListHeight: data.choiceListHeight,
    ChoiceParameterLinks: exportChoiceParameterLinksToXML(context, data.choiceParameterLinks),
    ChoiceParameters: exportChoiceParameterLinksToXML(context, data.choiceParameters),
    ChooseType: data.chooseType,
    ClearButton: data.clearButton,
    CreateButton: data.createButton,
    DropListButton: data.dropListButton,
    DropListWidth: data.dropListWidth,
    EditFormat: exportI8nTextToXML(context, data.editFormat),
    EditText: data.editText,
    EditTextUpdate: data.editTextUpdate,
    ExtendedEdit: data.extendedEdit,
    Font: exportFontToXML(context, data.font),
    Format: exportI8nTextToXML(context, data.format),
    Height: data.height,
    HeightControlVariant: data.heightControlVariant,
    HorizontalStretch: data.horizontalStretch,
    IncompleteChoiceMode: data.incompleteChoiceMode,
    InputHint: exportI8nTextToXML(context, data.inputHint),
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
    MultipleValuesBackColor: exportColorToXML(context, data.multipleValuesBackColor),
    MultipleValuesExtendedEdit: data.multipleValuesExtendedEdit,
    MultipleValuesFont: exportFontToXML(context, data.multipleValuesFont),
    MultipleValuesHyperlink: data.multipleValuesHyperlink,
    MultipleValuesPicture: exportPictureToXML(context, data.multipleValuesPicture),
    MultipleValuesTextColor: exportColorToXML(context, data.multipleValuesTextColor),
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
    TextColor: exportColorToXML(context, data.textColor),
    TextEdit: data.textEdit,
    TypeDomainEnabled: data.typeDomainEnabled,
    TypeLink: exportTypeLinkToXML(context, data.typeLink),
    UserVisible: exportUserVisibleToXML(context, data.userVisible),
    VerticalStretch: data.verticalStretch,
    Width: data.width,
    Wrap: data.wrap,
    Events: exportEventsToXML(context, data.events),
  })
}

registerMetadata("ExportToXML", "InputField", exportInputFieldToXML)
