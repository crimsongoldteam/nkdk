import type { FilterItemComparison, FilterItemComparisonYAML, FilterItemGroup, FilterItemGroupYAML } from "../types"

export const fullFilterItemComparison = {
  itemType: "FilterItemComparison",
  use: false,
  leftValue: { type: "Field", value: "Ссылка" },
  comparisonType: "Equal",
  rightValue: { type: "DesignTimeValue", value: "Справочник.Справочник1.ПустаяСсылка" },
  presentation: { items: { ru: "Представление" } },
  viewMode: "Normal",
  userSettingID: true,
  userSettingPresentation: { items: { ru: "Пользовательское представление" } },
} as const satisfies FilterItemComparison

export const fullFilterItemComparisonYAML = {
  Использование: "Ложь",
  ЛевоеЗначение: ".Ссылка",
  ВидСравнения: "Равно",
  ПравоеЗначение: "Справочник.Справочник1.ПустаяСсылка",
  Представление: "Представление",
  ПредставлениеПользовательскойНастройки: "Пользовательское представление",
  РежимОтображения: "Обычный",
  ИспользоватьПользовательскуюНастройку: "Истина",
} as const satisfies Required<
  Omit<FilterItemComparisonYAML, "ВидСравнения" | "Применение">
> & {
  ВидСравнения: "Равно"
}

export const fullFilterItemGroup = {
  itemType: "FilterItemGroup",
  groupType: "OrGroup",
  presentation: { items: { ru: "Представление" } },
  viewMode: "Normal",
  userSettingID: true,
  userSettingPresentation: { items: { ru: "Пользовательское представление" } },
} as const satisfies Omit<FilterItemGroup, "id" | "items">

export const fullFilterItemGroupYAML = {
  ТипГруппы: "ГруппаИли",
  Представление: "Представление",
  ПредставлениеПользовательскойНастройки: "Пользовательское представление",
  РежимОтображения: "Обычный",
  ИспользоватьПользовательскуюНастройку: "Истина",
} as const satisfies Required<
  Omit<FilterItemGroupYAML, "Элементы" | "Использование" | "Применение">
>
