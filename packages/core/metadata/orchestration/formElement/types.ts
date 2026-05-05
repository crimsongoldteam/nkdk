import { FormButtonType, FormDecorationType, FormFieldType, FormGroupType } from "~/metadata/systemEnumerations/types"
import { MetadataItemRule, ToYAML } from ".."
import { MetadataItemType, MetadataItemTypeRegistry, ToMetadata, ToTypedYAML } from "../metadataItem/registry"

//#region FormElementType

export const CollectableElementTypeToYAML = {
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

export type SingleElementType = Extract<
  MetadataItemType,
  | "SingleSearchControlAddition"
  | "SingleSearchStringAddition"
  | "ViewStatusAddition"
  | "ContextMenu"
  | "ExtendedTooltip"
  | "AutoCommandBar"
>

export type CollectableElementType = Extract<MetadataItemType, keyof typeof CollectableElementTypeToYAML>

export type ElementType = CollectableElementType | SingleElementType

export type CollectableElement = ToMetadata<CollectableElementType>

//#endregion

//#region ElementRule

export interface ElementRule extends Omit<MetadataItemRule, "itemType"> {
  itemType: ElementType
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

export type TypedFormElementType = {
  [K in MetadataItemType]: MetadataItemTypeRegistry[K] extends { yamlTyped: unknown } ? K : never
}[MetadataItemType]

export type TypedFormElementTypeYAML = {
  [K in MetadataItemType]: MetadataItemTypeRegistry[K] extends { yamlTyped: unknown } ? ToYAML<K> : never
}[MetadataItemType]

export type TypedFormElement = ToMetadata<TypedFormElementType>

export type TypedFormElementYAML = ToTypedYAML<TypedFormElementType>

//#endregion
