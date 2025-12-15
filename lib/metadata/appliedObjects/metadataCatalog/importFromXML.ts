import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importFromXML"
import { importTypeDescriptionFromXML } from "~/lib/metadata/commonObjects/typeDescription/importFromXML"
import { importPictureFromXML } from "~/lib/metadata/commonObjects/pictures/importFromXML"
import { importBorderFromXML } from "~/lib/metadata/commonObjects/border/importFromXML"
import { importChildItemsFromXML } from "../childItems/importFromXML"
import { importChoiceListFromXML } from "~/lib/metadata/commonObjects/choiceList/importFromXML"
import { importTypeLinkFromXML } from "~/lib/metadata/commonObjects/typeLink/importFromXML"
import { importChoiceParameterLinksFromXML } from "~/lib/metadata/commonObjects/сhoiceParameterLinks/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { importCommandSetFromXML } from "~/lib/metadata/forms/commandSet/importFromXML"
import { importIndexFieldsFromXML } from "~/lib/metadata/commonObjects/indexField/importFromXML"
import { importEventsFromXML } from "~/lib/metadata/forms/events/importFromXML"
import { importCommandBarFromXML } from "../commandBar/importFromXML"
import { importTableFromXML } from "../table/importFromXML"
import { importFormDecorationFromXML } from "../formDecoration/importFromXML"
import { importFormItemAdditionFromXML } from "../formItemAddition/importFromXML"
import { importSearchStringAdditionFromXML } from "~/lib/metadata/forms/elements/searchStringAddition/importFromXML"
import { importViewStatusAdditionFromXML } from "~/lib/metadata/forms/elements/viewStatusAddition/importFromXML"
import { importSearchControlAdditionFromXML } from "~/lib/metadata/forms/elements/searchControlAddition/importFromXML"
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

export const importMetadataCatalogFromXML = (xml: MetadataCatalogXML | undefined): MetadataCatalog | undefined => {
  if (!xml) return undefined
   
  return {
elementType: FormElementType.MetadataCatalog,

    additionalIndexes: xml.AdditionalIndexes,
    attributes: xml.Attributes,
    autonumbering: xml.Autonumbering,
    auxiliaryChoiceForm: xml.AuxiliaryChoiceForm,
    auxiliaryFolderChoiceForm: xml.AuxiliaryFolderChoiceForm,
    auxiliaryFolderForm: xml.AuxiliaryFolderForm,
    auxiliaryListForm: xml.AuxiliaryListForm,
    auxiliaryObjectForm: xml.AuxiliaryObjectForm,
    basedOn: xml.BasedOn,
    characteristics: xml.Characteristics,
    checkUnique: xml.CheckUnique,
    choiceDataGetModeOnInputByString: xml.ChoiceDataGetModeOnInputByString,
    choiceHistoryOnInput: xml.ChoiceHistoryOnInput,
    choiceMode: xml.ChoiceMode,
    codeAllowedLength: xml.CodeAllowedLength,
    codeLength: xml.CodeLength,
    codeSeries: xml.CodeSeries,
    codeType: xml.CodeType,
    commands: xml.Commands,
    comment: xml.Comment,
    createOnInput: xml.CreateOnInput,
    dataHistory: xml.DataHistory,
    dataLockControlMode: xml.DataLockControlMode,
    dataLockFields: xml.DataLockFields,
    defaultChoiceForm: xml.DefaultChoiceForm,
    defaultFolderChoiceForm: xml.DefaultFolderChoiceForm,
    defaultFolderForm: xml.DefaultFolderForm,
    defaultListForm: xml.DefaultListForm,
    defaultObjectForm: xml.DefaultObjectForm,
    defaultPresentation: xml.DefaultPresentation,
    descriptionLength: xml.DescriptionLength,
    editType: xml.EditType,
    executeAfterWriteDataHistoryVersionProcessing: xml.ExecuteAfterWriteDataHistoryVersionProcessing,
    explanation: xml.Explanation,
    extendedConfigurationObject: xml.ExtendedConfigurationObject,
    extendedListPresentation: xml.ExtendedListPresentation,
    extendedObjectPresentation: xml.ExtendedObjectPresentation,
    foldersOnTop: xml.FoldersOnTop,
    forms: xml.Forms,
    fullTextSearch: xml.FullTextSearch,
    fullTextSearchOnInputByString: xml.FullTextSearchOnInputByString,
    help: xml.Help,
    hierarchical: xml.Hierarchical,
    hierarchyType: xml.HierarchyType,
    includeHelpInContents: xml.IncludeHelpInContents,
    inputByString: xml.InputByString,
    levelCount: xml.LevelCount,
    limitLevelCount: xml.LimitLevelCount,
    listPresentation: xml.ListPresentation,
    managerModule: xml.ManagerModule,
    objectBelonging: xml.ObjectBelonging,
    objectModule: xml.ObjectModule,
    objectPresentation: xml.ObjectPresentation,
    owners: xml.Owners,
    predefined: xml.Predefined,
    predefinedDataUpdate: xml.PredefinedDataUpdate,
    quickChoice: xml.QuickChoice,
    searchStringModeOnInputByString: xml.SearchStringModeOnInputByString,
    standardAttributes: xml.StandardAttributes,
    subordinationUse: xml.SubordinationUse,
    synonym: xml.Synonym,
    tabularSections: xml.TabularSections,
    templates: xml.Templates,
    updateDataHistoryImmediatelyAfterWrite: xml.UpdateDataHistoryImmediatelyAfterWrite,
    useStandardCommands: xml.UseStandardCommands,
  }
}

registerImport(FormElementType.MetadataCatalog, importMetadataCatalogFromXML)