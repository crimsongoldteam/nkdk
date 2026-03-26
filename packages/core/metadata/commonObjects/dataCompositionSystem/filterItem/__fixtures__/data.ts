import type { FilterItemComparison, FilterItemComparisonYAML, FilterItemGroup, FilterItemGroupYAML } from "../types"

export const fullFilterItemComparison = {
  itemType: "FilterItemComparison",
  use: false,
  leftValue: "Реквизит1",
  comparisonType: "Equal",
  rightValue: { type: "boolean", value: true },
  presentation: { items: { ru: "Представление" } },
  application: "Items",
  viewMode: "QuickAccess",
  userSettingPresentation: "ТекстПредставленияНастройки",
} as const satisfies FilterItemComparison

export const fullFilterItemComparisonYAML = {
  Использование: "Ложь",
  ЛевоеЗначение: ".Реквизит1",
  ВидСравнения: "Равно",
  ПравоеЗначение: "Истина",
  Представление: "Представление",
  Применение: "Элементы",
  РежимОтображения: "БыстрыйДоступ",
  ПредставлениеПользовательскойНастройки: "ТекстПредставленияНастройки",
} as const satisfies Required<
  Omit<FilterItemComparisonYAML, "ВидСравнения" | "ИспользоватьПользовательскуюНастройку">
> & {
  ВидСравнения: "Равно"
}

export const fullFilterItemGroup = {
  itemType: "FilterItemGroup",
  use: false,
  groupType: "OrGroup",
  presentation: "ГруппаОтбора",
  application: "Items",
  viewMode: "QuickAccess",
  userSettingPresentation: "НастройкиГруппы",
} as const satisfies Required<Omit<FilterItemGroup, "id" | "items" | "userSettingID">>

export const fullFilterItemGroupYAML = {
  Использование: "Ложь",
  ТипГруппы: "ГруппаИли",
  Представление: "ГруппаОтбора",
  Применение: "Элементы",
  РежимОтображения: "БыстрыйДоступ",
  ПредставлениеПользовательскойНастройки: "НастройкиГруппы",
} as const satisfies Required<
  Omit<FilterItemGroupYAML, "Элементы" | "ИспользоватьПользовательскуюНастройку" | "РежимОтображения">
> & { РежимОтображения: "БыстрыйДоступ" }
