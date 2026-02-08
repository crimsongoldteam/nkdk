import { ConfigurationContext } from "../context/types"
import { AllChildItem, TypedElement } from "../forms/collections/childItems/types"
import { BaseElement } from "../forms/elements/baseElement/types"
import { Button, ButtonTypedEnterprise } from "../forms/elements/button/types"
import { ButtonGroup, ButtonGroupTypedEnterprise } from "../forms/elements/buttonGroup/types"
import { CheckBoxField, CheckBoxFieldTypedEnterprise } from "../forms/elements/checkBoxField/types"
import { ColumnGroup, ColumnGroupTypedEnterprise } from "../forms/elements/columnGroup/types"
import { InputField, InputFieldTypedEnterprise } from "../forms/elements/inputField/types"
import { LabelField, LabelFieldTypedEnterprise } from "../forms/elements/labelField/types"
import { PictureField, PictureFieldTypedEnterprise } from "../forms/elements/pictureField/types"
import { Popup, PopupTypedEnterprise } from "../forms/elements/popup/types"
import { IFormatElementResult } from "../forms/format/types"
import { TypeRules } from "./rules"

// // #region type associations

// export type ToXMLType<T extends BaseElement | undefined> = T extends undefined
//   ? undefined
//   : TypeRules<NonNullable<T>>["XML"]

export type ElementXML = {
  _name: string
  _id: string
  [key: string]: any
}

export type ToPartialEnterpriseType<T> = T extends undefined
  ? undefined
  : "PartialEnterprise" extends keyof TypeRules<NonNullable<T>>
    ? TypeRules<NonNullable<T>>["PartialEnterprise"]
    : never

export type ToTypedEnterpriseType<T extends TypedElement> = T extends Button
  ? ButtonTypedEnterprise
  : T extends ButtonGroup
    ? ButtonGroupTypedEnterprise
    : T extends Popup
      ? PopupTypedEnterprise
      : T extends CheckBoxField
        ? CheckBoxFieldTypedEnterprise
        : T extends ColumnGroup
          ? ColumnGroupTypedEnterprise
          : T extends InputField
            ? InputFieldTypedEnterprise
            : T extends LabelField
              ? LabelFieldTypedEnterprise
              : T extends PictureField
                ? PictureFieldTypedEnterprise
                : never

export type ToPreviewType<T> = T extends undefined
  ? undefined
  : "Preview" extends keyof TypeRules<NonNullable<T>>
    ? TypeRules<NonNullable<T>>["Preview"]
    : never

// // #endregion

// #region functions

export type ImportFromXMLFn = <To extends AllChildItem | undefined>(
  context: ConfigurationContext,
  data: ElementXML | undefined
) => To

export type ImportTypedFromEnterpriseFn = <To extends TypedElement>(
  context: ConfigurationContext,
  data: ToTypedEnterpriseType<To>,
  name: string
) => To

export type ImportPartialFromEnterpriseFn = (
  context: ConfigurationContext,
  source: Object,
  data: Object | undefined
) => Object | undefined

export type ExportToXMLFn = (context: ConfigurationContext, data?: any) => any

export type ExportPartialToEnterpriseFn = <From extends BaseElement | undefined>(
  context: ConfigurationContext,
  data: From
) => ToPartialEnterpriseType<From>

export type ExportTypedToEnterpriseFn = <From extends TypedElement>(
  context: ConfigurationContext,
  data: From
) => ToTypedEnterpriseType<From>

export type ExportToStructureFn = <From extends BaseElement>(
  context: ConfigurationContext,
  data: From
) => IFormatElementResult

export type ExportToStructureContentFn = <From extends BaseElement>(
  context: ConfigurationContext,
  data: From
) => IFormatElementResult

export type ExportToPreviewFn = <From extends BaseElement>(
  context: ConfigurationContext,
  data: From
) => NonNullable<ToPreviewType<From>>

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
  | ["ExportToPreview", ExportToPreviewFn]

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
  FormDecoration: "ДекорацияФормы",
  FormField: "ПолеФормы",
  FormGroup: "ГруппаФормы",
  SearchControlAddition: "УправлениеПоиском",
  SearchStringAddition: "ОтображениеСтрокиПоиска",
  AutoCommandBar: "АвтоКоманднаяПанель",
  ViewStatusAddition: "СостояниеПросмотра",
  ContextMenu: "КонтекстноеМеню",
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
