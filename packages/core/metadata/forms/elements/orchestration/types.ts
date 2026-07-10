import type {
  FormButtonType,
  FormDecorationType,
  FormFieldType,
  FormGroupType,
} from "../../../systemEnumerations/types"
import { ToYAML } from "../../../orchestration/metadataItem/registry"
import type { MetadataItemRule } from "../../../orchestration/property/types"

//#region FormElementType

export const CollectableElementTypeToYAML = {
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

export const CollectableElementTypeFromYAML = Object.fromEntries(
  Object.entries(CollectableElementTypeToYAML).map(([key, value]) => [value, key])
) as Record<CollectableElementToYAML<CollectableElementType>, CollectableElementType>

export type CollectableElementToYAML<T extends CollectableElementType> = (typeof CollectableElementTypeToYAML)[T]

export type CollectableElementFromYAML<D extends CollectableElementToYAML<CollectableElementType>> = {
  [K in CollectableElementType]: CollectableElementToYAML<K> extends D
    ? D extends CollectableElementToYAML<K>
      ? K
      : never
    : never
}[CollectableElementType]

export type SingleElementType =
  | "SingleSearchControlAddition"
  | "SingleSearchStringAddition"
  | "SingleViewStatusAddition"
  | "ContextMenu"
  | "ExtendedTooltip"
  | "AutoCommandBar"

export type CollectableElementType = keyof typeof CollectableElementTypeToYAML

export type ElementType = CollectableElementType | SingleElementType

export type CollectableElement = {
  itemType: CollectableElementType
  name: string
  [key: string]: any
}

//#endregion

//#region ElementRule

export interface ElementRule extends Omit<MetadataItemRule, "itemType"> {
  itemType: ElementType
  xmlTag?: string
  enterpriseField: "FormField" | "FormDecoration" | "FormTable" | "FormGroup" | "FormButton"
  enterpriseFieldType:
    | `FormFieldType.${FormFieldType}`
    | `FormButtonType.${FormButtonType}`
    | `FormGroupType.${FormGroupType}`
    | `FormDecorationType.${FormDecorationType}`
    | "None"
  alwaysExportToXML?: true
}

//#endregion

//#region ElementXML

export interface ElementXMLWithoutId {
  _name: string
  [key: string]: any
}
export type ElementXML = ElementXMLWithoutId & { _id: string }

//#endregion

//#region TypedFormElement

export type TypedFormElementType = CollectableElementType

export type TypedFormElementTypeYAML = ToYAML<TypedFormElementType>

export type TypedFormElement = {
  itemType: TypedFormElementType
  name: string
  [key: string]: any
}

export type TypedFormElementYAML = ToYAML<TypedFormElementType>

//#endregion
