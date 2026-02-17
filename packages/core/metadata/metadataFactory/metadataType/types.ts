import { createIdentityMapping, createReverseMapping, IdentityMappingType } from "../mapping"

export const FormElementTypeToYAML = {
  Button: "Кнопка",
  ButtonGroup: "ГруппаКнопок",
  CalendarField: "ПолеКалендаря",
  ChartField: "ПолеДиаграммы",
  CheckBoxField: "ПолеФлажок",
  ColumnGroup: "ГруппаКолонок",
  CommandBar: "КоманднаяПанель",
  DendrogramField: "ПолеДендрограммы",
  FormattedDocumentField: "ПолеФорматированногоДокумента",
  Table: "ТаблицаФормы",
  GanttChartField: "ПолеДиаграммыГанта",
  GeographicalSchemaField: "ПолеГеографическойСхемы",
  GraphicalSchemaField: "ПолеГрафическойСхемы",
  HTMLDocumentField: "ПолеHTMLДокумента",
  InputField: "ПолеВвода",
  LabelDecoration: "Надпись",
  LabelField: "ПолеНадписи",
  Page: "Страница",
  Pages: "Страницы",
  PDFDocumentField: "ПолеPDFДокумента",
  PeriodField: "ПолеПериода",
  PictureDecoration: "Рисунок",
  PictureField: "ПолеРисунка",
  PlannerField: "ПолеПланировщика",
  Popup: "Подменю",
  ProgressBarField: "ПолеИндикатора",
  RadioButtonField: "ПолеПереключателя",
  SpreadSheetDocumentField: "ПолеТабличногоДокумента",
  TextDocumentField: "ПолеТекстовогоДокумента",
  TrackBarField: "ПолеПолосыПрокрутки",
  UsualGroup: "Группа",
  SearchControlAddition: "УправлениеПоиском",
  SearchStringAddition: "ОтображениеСтрокиПоиска",
} as const

export const SingleFormElementTypeToYAML = {
  SingleSearchControlAddition: "SingleSearchControlAddition",
  SingleSearchStringAddition: "SingleSearchStringAddition",
  AutoCommandBar: "AutoCommandBar",
  ViewStatusAddition: "ViewStatusAddition",
  ContextMenu: "ContextMenu",
  ExtendedTooltip: "ExtendedTooltip",
} as const

// #region FormElementType

export const FormElementTypeFromYAML = createReverseMapping(FormElementTypeToYAML)

export const CollectionFormElementType = createIdentityMapping(FormElementTypeToYAML)
export type CollectionFormElementType = IdentityMappingType<typeof FormElementTypeToYAML>

export const FormElementTypeYAML = createIdentityMapping(FormElementTypeFromYAML)
export type FormElementTypeYAML = IdentityMappingType<typeof FormElementTypeFromYAML>

// #endregion

// #region SingleFormElementType

export const SingleFormElementType = createIdentityMapping(SingleFormElementTypeToYAML)
export type SingleFormElementType = IdentityMappingType<typeof SingleFormElementTypeToYAML>

// #endregion

// #region AllFormElementType

export type FormElementType = CollectionFormElementType | SingleFormElementType

// #endregion

export type MetadataType =
  | FormElementType
  | "FormAttribute"
  | "ClientApplicationForm"
  | "FormAttributeColumn"
  | "CommandInterface"
  | "CommandInterfaceItem"
