// Универсальные типы для маппинга метаданных
import {
  ReverseMapping,
  IdentityMapping,
  IdentityMappingType,
  createIdentityMapping,
  createReverseMapping,
} from "../mapping"

// Re-export for backward compatibility
export type { ReverseMapping, IdentityMapping, IdentityMappingType }
export { createIdentityMapping, createReverseMapping }

// --- FormElementType маппинги ---

export const FormElementTypeToEnterprise = {
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

export const SingleFormElementTypeToEnterprise = {
  SingleSearchControlAddition: "ОдиночноеУправлениеПоиском",
  SingleSearchStringAddition: "ОдиночноеОтображениеСтрокиПоиска",
  AutoCommandBar: "АвтоКоманднаяПанель",
  ViewStatusAddition: "СостояниеПросмотра",
  ContextMenu: "КонтекстноеМеню",
  ExtendedTooltip: "РасширеннаяПодсказка",
} as const

// Универсальные маппинги для FormElementTypeToEnterprise
export const FormElementTypeFromEnterprise = createReverseMapping(FormElementTypeToEnterprise)
export type FormElementTypeFromEnterprise = ReverseMapping<typeof FormElementTypeToEnterprise>

export const FormElementType = createIdentityMapping(FormElementTypeToEnterprise)
export type FormElementType = IdentityMappingType<typeof FormElementTypeToEnterprise>

export const FormElementTypeEnterprise = createIdentityMapping(FormElementTypeFromEnterprise)
export type FormElementTypeEnterprise = IdentityMappingType<typeof FormElementTypeFromEnterprise>

// Универсальные маппинги для SingleFormElementTypeToEnterprise
export const SingleFormElementTypeFromEnterprise = createReverseMapping(SingleFormElementTypeToEnterprise)
export type SingleFormElementTypeFromEnterprise = ReverseMapping<typeof SingleFormElementTypeToEnterprise>

export const SingleFormElementType = createIdentityMapping(SingleFormElementTypeToEnterprise)
export type SingleFormElementType = IdentityMappingType<typeof SingleFormElementTypeToEnterprise>

export const SingleFormElementTypeEnterprise = createIdentityMapping(SingleFormElementTypeFromEnterprise)
export type SingleFormElementTypeEnterprise = IdentityMappingType<typeof SingleFormElementTypeFromEnterprise>

export type MetadataType = FormElementType | SingleFormElementType
