import { ConfigurationContext } from "~/metadata/context/types"
import { exportColorToPreview } from "~/metadata/commonObjects/color/exportToPreview"
import { exportFontToPreview } from "~/metadata/commonObjects/font/exportToPreview"
import { exportI8nTextToPreview } from "~/metadata/commonObjects/i8nText/exportToPreview"
import { exportPictureToPreview } from "~/metadata/commonObjects/picture/exportToPreview"
import { exportSystemEnumerationToPreview } from "~/metadata/systemEnumerations/exportToPreview"
import { InputField, InputFieldPreview } from "./types"

export const exportInputFieldToPreview = (
  context: ConfigurationContext,
  element: InputField
): InputFieldPreview => {
  return {
    ElementType: "InputField",
    Name: element.name,
    AllowInputEmptyMultipleValues: element.allowInputEmptyMultipleValues,
    AllowMultipleValuesDuplicates: element.allowMultipleValuesDuplicates,
    AutoCapitalizationOnTextInput: exportSystemEnumerationToPreview(
      context,
      element.autoCapitalizationOnTextInput,
      "AutoCapitalizationOnTextInput"
    ),
    AutoChoiceIncomplete: element.autoChoiceIncomplete,
    AutoCorrectionOnTextInput: exportSystemEnumerationToPreview(
      context,
      element.autoCorrectionOnTextInput,
      "AutoCorrectionOnTextInput"
    ),
    AutoFillHint: exportSystemEnumerationToPreview(context, element.autoFillHint, "InputFieldAutofillHint"),
    AutoMarkIncomplete: element.autoMarkIncomplete,
    AutoMaxHeight: element.autoMaxHeight,
    AutoMaxWidth: element.autoMaxWidth,
    AutoShowClearButton: exportSystemEnumerationToPreview(
      context,
      element.autoShowClearButton,
      "AutoShowClearButtonMode"
    ),
    AutoShowOpenButton: exportSystemEnumerationToPreview(
      context,
      element.autoShowOpenButton,
      "AutoShowOpenButtonMode"
    ),
    BackColor: exportColorToPreview(context, element.backColor?.value, element.backColor?.type),
    BorderColor: exportColorToPreview(context, element.borderColor?.value, element.borderColor?.type),
    ChoiceButton: element.choiceButton,
    ChoiceButtonPicture: exportPictureToPreview(
      context,
      element.choiceButtonPicture?.ref as string,
      element.choiceButtonPicture?.type
    ),
    ChoiceButtonRepresentation: exportSystemEnumerationToPreview(
      context,
      element.choiceButtonRepresentation,
      "ChoiceButtonRepresentation"
    ),
    ChoiceFoldersAndItems: exportSystemEnumerationToPreview(
      context,
      element.choiceFoldersAndItems,
      "FoldersAndItems"
    ),
    ChoiceForm: element.choiceForm,
    ChoiceHistoryOnInput: exportSystemEnumerationToPreview(
      context,
      element.choiceHistoryOnInput,
      "ChoiceHistoryOnInput"
    ),
    ChoiceListButton: element.choiceListButton,
    ChoiceListHeight: element.choiceListHeight,
    ChooseType: element.chooseType,
    ClearButton: element.clearButton,
    CreateButton: element.createButton,
    DropListButton: element.dropListButton,
    DropListWidth: element.dropListWidth,
    EditFormat: exportI8nTextToPreview(context, element.editFormat),
    EditText: element.editText,
    EditTextUpdate: exportSystemEnumerationToPreview(context, element.editTextUpdate, "EditTextUpdate"),
    ExtendedEdit: element.extendedEdit,
    Font: exportFontToPreview(context, element.font),
    Format: exportI8nTextToPreview(context, element.format),
    Height: element.height,
    HeightControlVariant: exportSystemEnumerationToPreview(
      context,
      element.heightControlVariant,
      "HeightControlVariant"
    ),
    HorizontalStretch: element.horizontalStretch,
    IncompleteChoiceMode: exportSystemEnumerationToPreview(
      context,
      element.incompleteChoiceMode,
      "IncompleteChoiceMode"
    ),
    InputHint: exportI8nTextToPreview(context, element.inputHint),
    ListChoiceMode: element.listChoiceMode,
    MarkIncomplete: element.markIncomplete,
    MarkNegatives: element.markNegatives,
    Mask: element.mask,
    MaxHeight: element.maxHeight,
    MaxValue: element.maxValue,
    MaxWidth: element.maxWidth,
    MinValue: element.minValue,
    MultiLine: element.multiLine,
    MultipleValuePictureDataPath: element.multipleValuePictureDataPath,
    MultipleValuePictureShape: exportSystemEnumerationToPreview(
      context,
      element.multipleValuePictureShape,
      "MultipleValuePictureShape"
    ),
    MultipleValuePictureSize: exportSystemEnumerationToPreview(
      context,
      element.multipleValuePictureSize,
      "MultipleValuePictureSize"
    ),
    MultipleValuePresentationDataPath: element.multipleValuePresentationDataPath,
    MultipleValuesBackColor: exportColorToPreview(
      context,
      element.multipleValuesBackColor?.value,
      element.multipleValuesBackColor?.type
    ),
    MultipleValuesExtendedEdit: element.multipleValuesExtendedEdit,
    MultipleValuesFont: exportFontToPreview(context, element.multipleValuesFont),
    MultipleValuesHyperlink: element.multipleValuesHyperlink,
    MultipleValuesPicture: exportPictureToPreview(
      context,
      element.multipleValuesPicture?.ref as string,
      element.multipleValuesPicture?.type
    ),
    MultipleValuesTextColor: exportColorToPreview(
      context,
      element.multipleValuesTextColor?.value,
      element.multipleValuesTextColor?.type
    ),
    MultipleValueValueDataPath: element.multipleValueValueDataPath,
    OnScreenKeyboardReturnKeyText: exportSystemEnumerationToPreview(
      context,
      element.onScreenKeyboardReturnKeyText,
      "OnScreenKeyboardReturnKeyText"
    ),
    OpenButton: element.openButton,
    PasswordMode: element.passwordMode,
    QuickChoice: element.quickChoice,
    SelectedText: element.selectedText,
    ShowCheckBoxesInDropListWhenInputMultipleValues: element.showCheckBoxesInDropListWhenInputMultipleValues,
    SpecialTextInputMode: exportSystemEnumerationToPreview(
      context,
      element.specialTextInputMode,
      "SpecialTextInputMode"
    ),
    SpellCheckingOnTextInput: exportSystemEnumerationToPreview(
      context,
      element.spellCheckingOnTextInput,
      "SpellCheckingOnTextInput"
    ),
    SpinButton: element.spinButton,
    TextColor: exportColorToPreview(context, element.textColor?.value, element.textColor?.type),
    TextEdit: element.textEdit,
    TypeDomainEnabled: element.typeDomainEnabled,
    VerticalStretch: element.verticalStretch,
    Width: element.width,
    Wrap: element.wrap,
    AutoCellHeight: element.autoCellHeight,
    CellHyperlink: element.cellHyperlink,
    DataPath: element.dataPath,
    DefaultItem: element.defaultItem,
    DisplayImportance: exportSystemEnumerationToPreview(
      context,
      element.displayImportance,
      "DisplayImportance"
    ),
    EditMode: exportSystemEnumerationToPreview(context, element.editMode, "EditMode"),
    Enabled: element.enabled,
    FixingInTable: exportSystemEnumerationToPreview(context, element.fixingInTable, "FixingInTable"),
    FooterBackColor: exportColorToPreview(
      context,
      element.footerBackColor?.value,
      element.footerBackColor?.type
    ),
    FooterDataPath: element.footerDataPath,
    FooterFont: exportFontToPreview(context, element.footerFont),
    FooterHorizontalAlign: exportSystemEnumerationToPreview(
      context,
      element.footerHorizontalAlign,
      "HorizontalAlign"
    ),
    FooterPicture: exportPictureToPreview(
      context,
      element.footerPicture?.ref as string,
      element.footerPicture?.type
    ),
    FooterText: exportI8nTextToPreview(context, element.footerText),
    FooterTextColor: exportColorToPreview(
      context,
      element.footerTextColor?.value,
      element.footerTextColor?.type
    ),
    HeaderHorizontalAlign: exportSystemEnumerationToPreview(
      context,
      element.headerHorizontalAlign,
      "HorizontalAlign"
    ),
    HeaderPicture: exportPictureToPreview(
      context,
      element.headerPicture?.ref as string,
      element.headerPicture?.type
    ),
    HorizontalAlign: exportSystemEnumerationToPreview(
      context,
      element.horizontalAlign,
      "HorizontalAlign"
    ),
    HorizontalAlignInGroup: exportSystemEnumerationToPreview(
      context,
      element.horizontalAlignInGroup,
      "HorizontalAlign"
    ),
    ReadOnly: element.readOnly,
    ShowInFooter: element.showInFooter,
    ShowInHeader: element.showInHeader,
    SkipOnInput: element.skipOnInput,
    Title: exportI8nTextToPreview(context, element.title),
    TitleBackColor: exportColorToPreview(
      context,
      element.titleBackColor?.value,
      element.titleBackColor?.type
    ),
    TitleFont: exportFontToPreview(context, element.titleFont),
    TitleHeight: element.titleHeight,
    TitleLocation: exportSystemEnumerationToPreview(
      context,
      element.titleLocation,
      "TitleLocation"
    ),
    TitleTextColor: exportColorToPreview(
      context,
      element.titleTextColor?.value,
      element.titleTextColor?.type
    ),
    ToolTip: exportI8nTextToPreview(context, element.toolTip),
    ToolTipRepresentation: exportSystemEnumerationToPreview(
      context,
      element.toolTipRepresentation,
      "ToolTipRepresentation"
    ),
    VerticalAlign: exportSystemEnumerationToPreview(
      context,
      element.verticalAlign,
      "VerticalAlign"
    ),
    VerticalAlignInGroup: exportSystemEnumerationToPreview(
      context,
      element.verticalAlignInGroup,
      "VerticalAlign"
    ),
    Visible: element.visible,
    WarningOnEdit: exportI8nTextToPreview(context, element.warningOnEdit),
    WarningOnEditRepresentation: exportSystemEnumerationToPreview(
      context,
      element.warningOnEditRepresentation,
      "WarningOnEditRepresentation"
    ),
  }
}
