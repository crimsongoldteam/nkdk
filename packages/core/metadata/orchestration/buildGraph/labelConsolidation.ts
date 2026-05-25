export const FORM_ELEMENT_LABEL = "FormElement"
export const METADATA_OBJECT_LABEL = "MetadataObject"
export const GRAPH_STUB_LABEL = "GraphStub"

const UNKNOWN_LABEL = "Unknown"

export interface ConsolidatedGraphLabel {
  label: string
  kind?: string
}

const FORM_ELEMENT_TYPES = new Set([
  "AutoCommandBar",
  "Button",
  "ButtonGroup",
  "CalendarField",
  "ChartField",
  "CheckBoxField",
  "ColumnGroup",
  "CommandBar",
  "CommandBarButton",
  "ContextMenu",
  "DendrogramField",
  "ExtendedTooltip",
  "FormattedDocumentField",
  "GanttChartField",
  "GeographicalSchemaField",
  "GraphicalSchemaField",
  "HTMLDocumentField",
  "InputField",
  "LabelDecoration",
  "LabelField",
  "Page",
  "Pages",
  "PDFDocumentField",
  "PeriodField",
  "PictureDecoration",
  "PictureField",
  "PlannerField",
  "Popup",
  "ProgressBarField",
  "RadioButtonField",
  "SearchControlAddition",
  "SearchStringAddition",
  "SingleSearchControlAddition",
  "SingleSearchStringAddition",
  "SingleViewStatusAddition",
  "SpreadSheetDocumentField",
  "Table",
  "TableCheckBoxField",
  "TableInputField",
  "TableLabelField",
  "TablePictureField",
  "TextDocumentField",
  "TrackBarField",
  "UsualGroup",
  "ViewStatusAddition",
])

const METADATA_OBJECT_TYPES = new Set([
  "MetadataAccountingRegister",
  "MetadataAccumulationRegister",
  "MetadataBot",
  "MetadataBusinessProcess",
  "MetadataCalculationRegister",
  "MetadataCatalog",
  "MetadataChartOfAccounts",
  "MetadataChartOfCalculationTypes",
  "MetadataChartOfCharacteristicTypes",
  "MetadataCommand",
  "MetadataCommandGroup",
  "MetadataCommonAttribute",
  "MetadataCommonForm",
  "MetadataCommonPicture",
  "MetadataCommonTemplate",
  "MetadataConstant",
  "MetadataDataProcessor",
  "MetadataDefinedType",
  "MetadataDocument",
  "MetadataDocumentJournal",
  "MetadataDocumentNumerator",
  "MetadataEnumeration",
  "MetadataEventSubscription",
  "MetadataExchangePlan",
  "MetadataFilterCriterion",
  "MetadataFunctionalOption",
  "MetadataFunctionalOptionsParameter",
  "MetadataHTTPService",
  "MetadataInformationRegister",
  "MetadataIntegrationService",
  "MetadataLanguage",
  "MetadataReport",
  "MetadataRole",
  "MetadataScheduledJob",
  "MetadataSequence",
  "MetadataSessionParameter",
  "MetadataSettingsStorage",
  "MetadataStyle",
  "MetadataStyleItem",
  "MetadataSubsystem",
  "MetadataTask",
  "MetadataWebService",
  "MetadataWSReference",
])

export const consolidateGraphLabel = (
  rawItemType: string | undefined,
  hasFilePath: boolean,
): ConsolidatedGraphLabel => {
  if (rawItemType === undefined) {
    return { label: hasFilePath ? UNKNOWN_LABEL : GRAPH_STUB_LABEL }
  }

  if (FORM_ELEMENT_TYPES.has(rawItemType)) {
    return { label: FORM_ELEMENT_LABEL, kind: rawItemType }
  }

  if (METADATA_OBJECT_TYPES.has(rawItemType)) {
    return { label: METADATA_OBJECT_LABEL, kind: rawItemType }
  }

  return { label: rawItemType }
}
