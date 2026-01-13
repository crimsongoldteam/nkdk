import { ConfigurationContext } from "../context/types"
import { BaseElement, BaseElementXML } from "../forms/elements/baseElement/types"
import { ImportExportReturn } from "../forms/elements/types"
import { IFormatElementResult } from "../forms/format/types"
import { TypeRules } from "./rules"

// #region type associations

export type FromXMLType<T> = Extract<
  TypeRules,
  { XML: T; Element: any; PartialEnterprise: any; TypedEnterprise: any; EnterpriseName: any }
>["Element"]

export type ToXMLType<T> = Extract<
  TypeRules,
  { XML: any; Element: T; PartialEnterprise: any; TypedEnterprise: any; EnterpriseName: any }
>["XML"]

export type FromPartialEnterpriseType<T> = Extract<
  TypeRules,
  { XML: any; Element: any; PartialEnterprise: T; TypedEnterprise: any; EnterpriseName: any }
>["Element"]

export type FromTypedEnterpriseType<T> = Extract<
  TypeRules,
  { XML: any; Element: any; PartialEnterprise: any; TypedEnterprise: T; EnterpriseName: any }
>["Element"]

export type ToPartialEnterpriseType<T> = Extract<
  TypeRules,
  { XML: any; Element: T; PartialEnterprise: any; TypedEnterprise: any; EnterpriseName: any }
>["PartialEnterprise"]

export type ToTypedEnterpriseType<T> = Extract<
  TypeRules,
  { XML: any; Element: T; PartialEnterprise: any; TypedEnterprise: any; EnterpriseName: any }
>["TypedEnterprise"]

// #endregion

// #region functions

export type ImportFromXMLFn = <From extends BaseElementXML | undefined>(
  context: ConfigurationContext,
  data: From
) => ImportExportReturn<From, FromXMLType<From>>

export type ExportToXMLFn = <From extends BaseElement | undefined>(
  context: ConfigurationContext,
  data: From
) => ImportExportReturn<From, ToXMLType<From>>

export type ImportTypedFromEnterpriseFn = <From extends BaseElement | undefined>(
  context: ConfigurationContext,
  data: From,
  name: string
) => ImportExportReturn<From, ToTypedEnterpriseType<From>>

export type ImportPartialFromEnterpriseFn = <From extends BaseElement | undefined>(
  context: ConfigurationContext,
  data: From
) => ImportExportReturn<From, ToPartialEnterpriseType<From>>

export type ExportPartialToEnterpriseFn = <From extends BaseElement | undefined>(
  context: ConfigurationContext,
  data: From
) => ImportExportReturn<From, ToPartialEnterpriseType<From>>

export type ExportTypedToEnterpriseFn = <From extends BaseElement | undefined>(
  context: ConfigurationContext,
  data: From,
  name: string
) => ImportExportReturn<From, ToTypedEnterpriseType<From>>

export type ExportToStructureFn = <From extends BaseElement | undefined>(
  context: ConfigurationContext,
  data: From
) => IFormatElementResult

export type ExportToStructureContentFn = <From extends BaseElement | undefined>(
  context: ConfigurationContext,
  data: From
) => IFormatElementResult

// #endregion

// type d2 = d
// // Преобразование обычного типа в XML тип
// export type ToXMLType<T> = Extract<ElementToXMLPairs, [T, any]>[1]

// // Вспомогательные типы для извлечения Element типа из PartialEnterprise или TypedEnterprise
// type PartialEnterpriseToElementPairs = {
//   [K in keyof TypeRules]: [TypeRules[K]["PartialEnterprise"], TypeRules[K]["Element"]]
// }[keyof TypeRules]

// type TypedEnterpriseToElementPairs = {
//   [K in keyof TypeRules]: [TypeRules[K]["TypedEnterprise"], TypeRules[K]["Element"]]
// }[keyof TypeRules]

// // Преобразование PartialEnterprise типа в Element тип
// export type PartialFromEnterpriseType<T> = Extract<PartialEnterpriseToElementPairs, [T, any]>[1]

// // Преобразование TypedEnterprise типа в Element тип
// export type TypedFromEnterpriseType<T> = Extract<TypedEnterpriseToElementPairs, [T, any]>[1]

// /**
//  * Маппинг типов элементов форм на их Enterprise названия
//  * Создан на основе TypePairs.EnterpriseName
//  * Дополнительные элементы, которых нет в TypePairs, добавляются отдельно
//  */
// export const FormElementTypeToEnterprise = {
//   ...enterpriseNameMap,
//   // Дополнительные элементы, которых нет в TypePairs
//   Form: "УправляемаяФорма",
//   ClientApplicationForm: "УправляемаяФорма",
//   FormItemAddition: "ДополнениеЭлементаФормы",
// } as const

// export const FormElementTypeFromEnterprise = Object.fromEntries(
//   Object.entries(FormElementTypeToEnterprise).map(([key, value]) => [value, key])
// ) as {
//   [V in (typeof FormElementTypeToEnterprise)[keyof typeof FormElementTypeToEnterprise]]: {
//     [K in keyof typeof FormElementTypeToEnterprise]: (typeof FormElementTypeToEnterprise)[K] extends V ? K : never
//   }[keyof typeof FormElementTypeToEnterprise]
// }

// export const FormElementType = Object.fromEntries(
//   Object.keys(FormElementTypeToEnterprise).map((key) => [key, key])
// ) as {
//   [K in keyof typeof FormElementTypeToEnterprise]: K
// }

// export type FormElementType = (typeof FormElementType)[keyof typeof FormElementType]

// export const FormElementTypeEnterprise = Object.fromEntries(
//   Object.keys(FormElementTypeFromEnterprise).map((key) => [key, key])
// ) as {
//   [K in keyof typeof FormElementTypeFromEnterprise]: K
// }

// export type FormElementTypeEnterprise = (typeof FormElementTypeEnterprise)[keyof typeof FormElementTypeEnterprise]

// export const importFormElementTypeFromEnterprise = (
//   _context: ConfigurationContext,
//   data: FormElementTypeEnterprise
// ): FormElementType => {
//   return FormElementTypeFromEnterprise[data]
// }

// export const exportFormElementTypeToEnterprise = (
//   _context: ConfigurationContext,
//   element: FormElementType
// ): FormElementTypeEnterprise => {
//   return FormElementTypeToEnterprise[element]
// }

// /**
//  * Типы функций для операций импорта/экспорта элементов форм
//  */

// /**
//  * Функция импорта элемента из XML формата
//  * @template From - XML тип элемента
//  * @template To - Обычный тип элемента (автоматически выводится из From)
//  */
// export type ImportFromXMLFn = <
//   From extends BaseElementXML | undefined,
//   To extends FromXMLType<From> = FromXMLType<From>,
// >(
//   context: ConfigurationContext,
//   data: From
// ) => ImportExportReturn<From, To>

// /**
//  * Функция экспорта элемента в XML формат
//  * @template From - Обычный тип элемента
//  * @template To - XML тип элемента (автоматически выводится из From)
//  */
// export type ExportToXMLFn = <From extends BaseElement | undefined, To extends ToXMLType<From> = ToXMLType<From>>(
//   context: ConfigurationContext,
//   data: From
// ) => ImportExportReturn<From, To>

// /**
//  * Функция экспорта элемента в Partial Enterprise формат
//  * @template From - Обычный тип элемента
//  * @template To - Partial Enterprise тип элемента (автоматически выводится из From)
//  */
// export type ExportPartialToEnterpriseFn = <
//   From extends BaseElement | undefined,
//   To extends PartialFromEnterpriseType<From> extends never
//     ? BaseElementPropsEnterprise
//     : Extract<PartialEnterpriseToElementPairs, [any, From]>[0] extends never
//       ? BaseElementPropsEnterprise
//       : Extract<PartialEnterpriseToElementPairs, [any, From]>[0],
// >(
//   context: ConfigurationContext,
//   data: From
// ) => ImportExportReturn<From, To>

// /**
//  * Функция импорта элемента из Partial Enterprise формата
//  * @template From - Partial Enterprise тип элемента
//  * @template To - Обычный тип элемента (автоматически выводится из From)
//  */
// export type ImportPartialFromEnterpriseFn = <
//   From extends BaseElementPropsEnterprise | undefined,
//   To extends PartialFromEnterpriseType<From> | undefined,
// >(
//   context: ConfigurationContext,
//   source: To | undefined,
//   data: From
// ) => ImportExportReturn<From, To>

// /**
//  * Функция импорта элемента из Typed Enterprise формата
//  * @template From - Typed Enterprise тип элемента
//  * @template To - Обычный тип элемента (автоматически выводится из From)
//  */
// export type ImportTypedFromEnterpriseFn = <
//   From extends BaseElementPropsEnterprise | undefined,
//   To extends TypedFromEnterpriseType<From> | undefined,
// >(
//   context: ConfigurationContext,
//   data: From,
//   name: string
// ) => ImportExportReturn<From, To>

// /**
//  * Функция экспорта элемента в Typed Enterprise формат
//  * @template From - Обычный тип элемента
//  * @template To - Typed Enterprise тип элемента (автоматически выводится из From)
//  */
// export type ExportTypedToEnterpriseFn<
//   From extends BaseElement | undefined = BaseElement | undefined,
//   To extends BaseElementPropsEnterprise | undefined = BaseElementPropsEnterprise | undefined,
// > = (context: ConfigurationContext, data: From, name: string) => ImportExportReturn<From, To>

// /**
//  * Функция экспорта элемента в структурированный формат (для форматирования)
//  * @template From - Обычный тип элемента
//  */
// export type ExportToStructureFn = <From extends BaseElement | undefined>(
//   context: ConfigurationContext,
//   data: From
// ) => IFormatElementResult

// /**
//  * Функция экспорта содержимого элемента в структурированный формат
//  * @template From - Обычный тип элемента
//  */
// export type ExportToStructureContentFn = <From extends BaseElement | undefined>(
//   context: ConfigurationContext,
//   data: From
// ) => IFormatElementResult

// /**
//  * Пары [название операции, тип функции] для маппинга операций
//  */
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

export type FormElementType = TypeRules extends infer T ? (T extends { name: infer E } ? E : never) : never
