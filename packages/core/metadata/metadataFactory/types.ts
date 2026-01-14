import { ConfigurationContext } from "../context/types"
import { BaseElement } from "../forms/elements/baseElement/types"
import { ImportExportReturn } from "../forms/elements/types"
import { IFormatElementResult } from "../forms/format/types"
import { TypeRules } from "./rules"

// #region type associations

export type ToXMLType<T> = T extends undefined
  ? undefined
  : Extract<
      TypeRules,
      { XML: any; Element: T; PartialEnterprise: any; TypedEnterprise: any; EnterpriseName: any }
    >["XML"]

export type ToPartialEnterpriseType<T> = Extract<
  TypeRules,
  { XML: any; Element: T; PartialEnterprise: any; TypedEnterprise: any; EnterpriseName: any }
>["PartialEnterprise"]

export type ToTypedEnterpriseType<T> = T extends undefined
  ? undefined
  : Extract<
      TypeRules,
      { XML: any; Element: T; PartialEnterprise: any; TypedEnterprise: any; EnterpriseName: any }
    >["TypedEnterprise"]

// #endregion

// #region functions

export type ImportFromXMLFn = <To extends BaseElement | undefined>(
  context: ConfigurationContext,
  data: ToXMLType<To>
) => ImportExportReturn<ToXMLType<To>, To>

export type ImportTypedFromEnterpriseFn = <To extends BaseElement | undefined>(
  context: ConfigurationContext,
  data: ToTypedEnterpriseType<To>,
  name: string
) => ImportExportReturn<ToTypedEnterpriseType<To>, To>

export type ImportPartialFromEnterpriseFn = <To extends BaseElement>(
  context: ConfigurationContext,
  source: To,
  data: ToPartialEnterpriseType<To> | undefined
) => To

export type ExportToXMLFn = <From extends BaseElement | undefined>(
  context: ConfigurationContext,
  data: From
) => ImportExportReturn<From, ToXMLType<From>>

export type ExportPartialToEnterpriseFn = <From extends BaseElement | undefined>(
  context: ConfigurationContext,
  data: From
) => ImportExportReturn<From, ToPartialEnterpriseType<From>>

export type ExportTypedToEnterpriseFn = <From extends BaseElement | undefined>(
  context: ConfigurationContext,
  data: From
  // name: string
) => ImportExportReturn<From, ToTypedEnterpriseType<From>>

export type ExportToStructureFn = <From extends BaseElement>(
  context: ConfigurationContext,
  data: From
) => IFormatElementResult

export type ExportToStructureContentFn = <From extends BaseElement>(
  context: ConfigurationContext,
  data: From
) => IFormatElementResult

// #endregion

type fnPairs =
  | ["ExportToXML", ExportToXMLFn]
  | ["ExportPartialToEnterprise", ExportPartialToEnterpriseFn]
  | ["ExportTypedToEnterprise", ExportTypedToEnterpriseFn]
  | ["ImportFromXML", ImportFromXMLFn]
  | ["ImportPartialFromEnterprise", ImportPartialFromEnterpriseFn]
  | ["ImportTypedFromEnterprise", ImportTypedFromEnterpriseFn]
  | ["ExportToStructure", ExportToStructureFn]
  | ["ExportToStructureContent", ExportToStructureContentFn]

export type ItemOperationType = fnPairs extends infer T ? (T extends [infer Op, any] ? Op : never) : never

export type OperationFunction<Type extends ItemOperationType> = Extract<fnPairs, [Type, any]>[1]

// #region FormElementType

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
  PdfDocumentField: "ПолеPDFДокумента",
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
  FormDecoration: "ДекорацияФормы",
  FormField: "ПолеФормы",
  FormGroup: "ГруппаФормы",
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

export const importFormElementTypeFromEnterprise = (
  _context: ConfigurationContext,
  data: FormElementTypeEnterprise
): FormElementType => {
  return FormElementTypeFromEnterprise[data]
}

export const exportFormElementTypeToEnterprise = (
  _context: ConfigurationContext,
  element: FormElementType
): FormElementTypeEnterprise => {
  return FormElementTypeToEnterprise[element]
}

// #endregion
