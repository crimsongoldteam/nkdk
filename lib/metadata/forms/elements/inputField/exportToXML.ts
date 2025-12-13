import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportToXML"
import { exportTypeDescriptionToXML } from "~/lib/metadata/commonObjects/typeDescription/exportToXML"
import { exportPictureToXML } from "~/lib/metadata/commonObjects/pictures/exportToXML"
import { exportBorderToXML } from "~/lib/metadata/commonObjects/border/exportToXML"
import { exportChildItemsToXML } from "../childItems/exportToXML"
import { exportChoiceListToXML } from "~/lib/metadata/commonObjects/choiceList/exportToXML"
import { exportTypeLinkToXML } from "~/lib/metadata/commonObjects/typeLink/exportToXML"
import { exportChoiceParameterLinksToXML } from "~/lib/metadata/commonObjects/сhoiceParameterLinks/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { exportCommandSetToXML } from "~/lib/metadata/forms/commandSet/exportToXML"
import { exportEventsToXML } from "~/lib/metadata/forms/events/exportToXML"
import { exportCommandBarToXML } from "../commandBar/exportToXML"
import { exportTableToXML } from "../table/exportToXML"
import { exportFormDecorationToXML } from "../formDecoration/exportToXML"
import { exportFormItemAdditionToXML } from "../formItemAddition/exportToXML"
import { exportSearchStringAdditionToXML } from "~/lib/metadata/forms/elements/searchStringAddition/exportToXML"
import { exportViewStatusAdditionToXML } from "~/lib/metadata/forms/elements/viewStatusAddition/exportToXML"
import { exportSearchControlAdditionToXML } from "~/lib/metadata/forms/elements/searchControlAddition/exportToXML"
import { InputField, InputFieldXML } from "./types"
import { FormField, FormFieldXML } from "./types"
import { HTMLDocumentField, HTMLDocumentFieldXML } from "./types"
import { PdfDocumentField, PdfDocumentFieldXML } from "./types"
import { CalendarField, CalendarFieldXML } from "./types"
import { ChartField, ChartFieldXML } from "./types"
import { CheckBoxField, CheckBoxFieldXML } from "./types"
import { DendrogramField, DendrogramFieldXML } from "./types"
import { FormattedDocumentField, FormattedDocumentFieldXML } from "./types"
import { GanttChartField, GanttChartFieldXML } from "./types"
import { GeographicalSchemaField, GeographicalSchemaFieldXML } from "./types"
import { GraphicalSchemaField, GraphicalSchemaFieldXML } from "./types"
import { LabelField, LabelFieldXML } from "./types"
import { PeriodField, PeriodFieldXML } from "./types"
import { PictureField, PictureFieldXML } from "./types"
import { PlannerField, PlannerFieldXML } from "./types"
import { ProgressBarField, ProgressBarFieldXML } from "./types"
import { RadioButtonField, RadioButtonFieldXML } from "./types"
import { SpreadSheetDocumentField, SpreadSheetDocumentFieldXML } from "./types"
import { TextDocumentField, TextDocumentFieldXML } from "./types"
import { TrackBarField, TrackBarFieldXML } from "./types"
import { FormGroup, FormGroupXML } from "./types"
import { ButtonGroup, ButtonGroupXML } from "./types"
import { CommandBar, CommandBarXML } from "./types"
import { ColumnGroup, ColumnGroupXML } from "./types"
import { Page, PageXML } from "./types"
import { Popup, PopupXML } from "./types"
import { UsualGroup, UsualGroupXML } from "./types"
import { Pages, PagesXML } from "./types"
import { FormDecoration, FormDecorationXML } from "./types"
import { LabelDecoration, LabelDecorationXML } from "./types"
import { PictureDecoration, PictureDecorationXML } from "./types"
import { Table, TableXML } from "./types"
import { FormItemAddition, FormItemAdditionXML } from "./types"
import { SearchControlAddition, SearchControlAdditionXML } from "./types"
import { SearchStringAddition, SearchStringAdditionXML } from "./types"
import { ViewStatusAddition, ViewStatusAdditionXML } from "./types"
import { Button, ButtonXML } from "./types"
import { registerImport } from "~/lib/xml/import/importerFactory"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { FormElementType } from "../types"
import { exportFormFieldToXML } from "../formField/exportToXML"

export const exportInputFieldToXML = (data: InputField | undefined): InputFieldXML | undefined => {
    if (!data) return undefined
     
    return {
...exportFormFieldToXML(data)!,

    AutoCellHeight: data.autoCellHeight,
    CellHyperlink: data.cellHyperlink,
    ContextMenu: exportCommandBarToXML(data.contextMenu),
    DataPath: data.dataPath,
    DefaultItem: data.defaultItem,
    _DisplayImportance: data.displayImportance,
    EditMode: data.editMode,
    Enabled: data.enabled,
    ExtendedTooltip: exportFormDecorationToXML(data.extendedTooltip),
    FixingInTable: data.fixingInTable,
    FooterBackColor: exportColorToXML(data.footerBackColor),
    FooterDataPath: data.footerDataPath,
    FooterFont: exportFontToXML(data.footerFont),
    FooterHorizontalAlign: data.footerHorizontalAlign,
    FooterPicture: exportPictureToXML(data.footerPicture),
    FooterText: exportI8nTextToXML(data.footerText),
    FooterTextColor: exportColorToXML(data.footerTextColor),
    HeaderHorizontalAlign: data.headerHorizontalAlign,
    HeaderPicture: exportPictureToXML(data.headerPicture),
    HorizontalAlign: data.horizontalAlign,
    HorizontalAlignInGroup: data.horizontalAlignInGroup,
    ReadOnly: data.readOnly,
    Shortcut: data.shortcut,
    ShowInFooter: data.showInFooter,
    ShowInHeader: data.showInHeader,
    SkipOnInput: data.skipOnInput,
    Table: exportTableToXML(data.table),
    Title: exportI8nTextToXML(data.title),
    TitleBackColor: exportColorToXML(data.titleBackColor),
    TitleFont: exportFontToXML(data.titleFont),
    TitleHeight: data.titleHeight,
    TitleLocation: data.titleLocation,
    TitleTextColor: exportColorToXML(data.titleTextColor),
    ToolTip: exportI8nTextToXML(data.toolTip),
    ToolTipRepresentation: data.toolTipRepresentation,
    Type: data.type,
    TypeRestriction: exportTypeDescriptionToXML(data.typeRestriction),
    UserVisible: exportUserVisibleToXML(data.userVisible),
    VerticalAlign: data.verticalAlign,
    VerticalAlignInGroup: data.verticalAlignInGroup,
    Visible: data.visible,
    WarningOnEdit: exportI8nTextToXML(data.warningOnEdit),
    WarningOnEditRepresentation: data.warningOnEditRepresentation,
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
    Events: exportEventsToXML(data.events),
  }
}

registerExport(FormElementType.InputField, exportInputFieldToXML)