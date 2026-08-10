import { defineMetadataRules } from "../../ruleRuntime/definition"
import { emptyMetadataRules } from "../../ruleRuntime/definition/testSupport"

export const formElementTypeToYAML = {
  Button: "Кнопка",
  CommandBarButton: "КнопкаКоманднойПанели",
  ButtonGroup: "ГруппаКнопок",
  CalendarField: "ПолеКалендаря",
  ChartField: "ПолеДиаграммы",
  CheckBoxField: "ПолеФлажок",
  TableCheckBoxField: "ПолеФлажок",
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
  TableInputField: "ПолеВвода",
  LabelDecoration: "Надпись",
  LabelField: "ПолеНадписи",
  TableLabelField: "ПолеНадписи",
  Page: "Страница",
  Pages: "Страницы",
  PDFDocumentField: "ПолеPDFДокумента",
  PeriodField: "ПолеПериода",
  PictureDecoration: "Рисунок",
  PictureField: "ПолеРисунка",
  TablePictureField: "ПолеРисунка",
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
  ViewStatusAddition: "ОтображениеСостоянияПросмотра",
} as const

type RegisteredFormElementTypeMap = typeof formElementTypeToYAML

declare module "../../ruleRuntime/formElement/types" {
  interface FormElementTypeMap extends RegisteredFormElementTypeMap {}
  interface SingleFormElementTypeMap {
    SingleSearchControlAddition: true
    SingleSearchStringAddition: true
    SingleViewStatusAddition: true
    ContextMenu: true
    ExtendedTooltip: true
    AutoCommandBar: true
  }
}

export const formElementCatalogRules = defineMetadataRules({
  ...emptyMetadataRules,
  formElementKinds: formElementTypeToYAML,
})
