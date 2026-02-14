export const FormElementTypeToEnterprise = {
  BaseElement: "БазовыйЭлемент",
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
  SingleSearchControlAddition: "ОдиночноеУправлениеПоиском",
  SearchStringAddition: "ОтображениеСтрокиПоиска",
  SingleSearchStringAddition: "ОдиночноеОтображениеСтрокиПоиска",
  AutoCommandBar: "АвтоКоманднаяПанель",
  ViewStatusAddition: "СостояниеПросмотра",
  ContextMenu: "КонтекстноеМеню",
  ExtendedTooltip: "РасширеннаяПодсказка",
} as const

export const FormElementTypeFromEnterprise = Object.fromEntries(
  Object.entries(FormElementTypeToEnterprise).map(([key, value]) => [value, key])
) as {
  [V in (typeof FormElementTypeToEnterprise)[keyof typeof FormElementTypeToEnterprise]]: {
    [K in keyof typeof FormElementTypeToEnterprise]: (typeof FormElementTypeToEnterprise)[K] extends V ? K : never
  }[keyof typeof FormElementTypeToEnterprise]
}

export const FormElementType = Object.fromEntries(
  Object.keys(FormElementTypeToEnterprise).map((key) => [key, key])
) as {
  [K in keyof typeof FormElementTypeToEnterprise]: K
}

export type FormElementType = (typeof FormElementType)[keyof typeof FormElementType]

export const FormElementTypeEnterprise = Object.fromEntries(
  Object.keys(FormElementTypeFromEnterprise).map((key) => [key, key])
) as {
  [K in keyof typeof FormElementTypeFromEnterprise]: K
}

export type FormElementTypeEnterprise = (typeof FormElementTypeEnterprise)[keyof typeof FormElementTypeEnterprise]

export type MetadataType = FormElementType
