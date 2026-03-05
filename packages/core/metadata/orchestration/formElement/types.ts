import { FormButtonType, FormDecorationType, FormFieldType, FormGroupType } from "~/metadata/systemEnumerations/types"
import { MetadataItemRule, ToYAML } from ".."
import { MetadataItemType, MetadataItemTypeRegistry, ToMetadata, ToTypedYAML } from "../metadataItem/registry"

//#region FormElementType

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

export const FormElementTypeFromYAML = Object.fromEntries(
  Object.entries(FormElementTypeToYAML).map(([key, value]) => [value, key])
) as Record<FormElementTypeToYAMLType<FormElementType>, FormElementType>

export type FormElementTypeToYAMLType<T extends FormElementType> = (typeof FormElementTypeToYAML)[T]

export type FormElementTypeFromYAMLType<D extends FormElementTypeToYAMLType<FormElementType>> = {
  [K in FormElementType]: FormElementTypeToYAMLType<K> extends D
    ? D extends FormElementTypeToYAMLType<K>
      ? K
      : never
    : never
}[FormElementType]

export type SingleFormElementType = Extract<
  MetadataItemType,
  | "SingleSearchControlAddition"
  | "SingleSearchStringAddition"
  | "ViewStatusAddition"
  | "ContextMenu"
  | "ExtendedTooltip"
  | "AutoCommandBar"
>

export type FormElementType = Extract<MetadataItemType, keyof typeof FormElementTypeToYAML>

export type ExtendedFormElementType = FormElementType | SingleFormElementType

//#endregion

//#region ElementRule

export interface ElementRule extends Omit<MetadataItemRule, "itemType"> {
  itemType: ExtendedFormElementType
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

export interface ElementXML {
  _name: string
  _id: string
  [key: string]: any
}

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
