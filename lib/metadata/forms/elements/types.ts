import { z } from "zod"

enum ElementType {
  BaseElement = "БазовыйЭлемент",
  Form = "УправляемаяФорма",
  Button = "Кнопка",
  ButtonGroup = "ГруппаКнопок",
  CalendarField = "ПолеКалендаря",
  ChartField = "ПолеДиаграммы",
  CheckBoxField = "ПолеФлажок",
  ColumnGroup = "ГруппаКолонок",
  CommandBar = "КоманднаяПанель",
  DendrogramField = "ПолеДендрограммы",
  FormattedDocumentField = "ПолеФорматированногоДокумента",
  Table = "ТаблицаФормы",
  GanttChartField = "ПолеДиаграммыГанта",
  GeographicalSchemaField = "ПолеГеографическойСхемы",
  GraphicalSchemaField = "ПолеГрафическойСхемы",
  HTMLDocumentField = "ПолеHTMLДокумента",
  InputField = "ПолеВвода",
  LabelDecoration = "Надпись",
  LabelField = "ПолеНадписи",
  Page = "Страница",
  Pages = "Страницы",
  PdfDocumentField = "ПолеPDFДокумента",
  PeriodField = "ПолеПериода",
  PictureDecoration = "Рисунок",
  PictureField = "ПолеРисунка",
  PlannerField = "ПолеПланировщика",
  Popup = "ВсплывающаяПодсказка",
  ProgressBarField = "ПолеИндикатора",
  RadioButtonField = "ПолеПереключателя",
  SearchControlAddition = "ДобавлениеПоисковоКонтроля",
  SearchStringAddition = "ДобавлениеСтрокиПоиска",
  SpreadSheetDocumentField = "ПолеТабличногоДокумента",
  TextDocumentField = "ПолеТекстовогоДокумента",
  TrackBarField = "ПолеПолосыПрокрутки",
  UsualGroup = "Группа",
  ViewStatusAddition = "ДобавлениеПросмотраСостояния",
  ClientApplicationForm = "УправляемаяФорма",
  FormDecoration = "ДекорацияФормы",
  FormField = "ПолеФормы",
  FormItemAddition = "ДополнениеЭлементаФормы",
  FormGroup = "ГруппаФормы",
}

export const ZElementType = z.enum(
  Object.keys(ElementType) as [TElementType, ...TElementType[]]
)
export const ZElementTypeEnterprise = z.enum(
  Object.values(ElementType) as [
    TElementTypeEnterprise,
    ...TElementTypeEnterprise[],
  ]
)

export type TElementType = keyof typeof ElementType
export type TElementTypeEnterprise = `${ElementType}`
