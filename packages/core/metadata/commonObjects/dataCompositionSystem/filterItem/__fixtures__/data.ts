import type { FilterItemComparison, FilterItemComparisonYAML } from "../types"

export const fullFilterItemComparison = {
  itemType: "FilterItemComparison",
  use: false,
  leftValue: "Реквизит1",
  comparisonType: "Equal",
  rightValue: "true",
  presentation: { items: { ru: "Представление" } },
  application: "Items",
  viewMode: "QuickAccess",
  userSettingPresentation: "ТекстПредставленияНастройки",
} as const satisfies FilterItemComparison

export const fullFilterItemComparisonYAML = {
  Использование: "Ложь",
  ЛевоеЗначение: "Реквизит1",
  ВидСравнения: "Равно",
  ПравоеЗначение: "true",
  Представление: "Представление",
  Применение: "Элементы",
  РежимОтображения: "БыстрыйДоступ",
  ПредставлениеПользовательскойНастройки: "ТекстПредставленияНастройки",
} as const satisfies Required<
  Omit<FilterItemComparisonYAML, "ВидСравнения" | "ИспользоватьПользовательскуюНастройку">
> & {
  ВидСравнения: "Равно"
}
