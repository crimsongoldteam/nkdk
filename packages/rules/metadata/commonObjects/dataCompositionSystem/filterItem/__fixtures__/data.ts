import type { FilterItemComparison, FilterItemComparisonYAML, FilterItemGroup, FilterItemGroupYAML } from "../types"

export const fullFilterItemComparison = {
  itemType: "FilterItemComparison",
  use: false,
  leftValue: { type: "Field", value: "Ссылка" },
  comparisonType: "Equal",
  rightValue: { type: "DesignTimeValue", value: "Справочник.Справочник1.ПустаяСсылка" },
  presentation: { items: { ru: "Представление" } },
  viewMode: "Normal",
  userSettingID: "7b8eb4d9-8661-46f5-9da8-dbe4d77a2292",
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
  ИспользоватьПользовательскуюНастройку: "7b8eb4d9-8661-46f5-9da8-dbe4d77a2292",
} as const satisfies Required<Omit<FilterItemComparisonYAML, "ВидСравнения" | "Применение">> & {
  ВидСравнения: "Равно"
}

export const inListFilterItemComparison = {
  itemType: "FilterItemComparison",
  leftValue: { type: "Field", value: "Статус" },
  comparisonType: "InList",
  rightValue: [
    { type: "DesignTimeValue", value: "Перечисление.СтатусыОбменСБанками.Доставлен" },
    { type: "DesignTimeValue", value: "Перечисление.СтатусыОбменСБанками.Исполнен" },
    { type: "DesignTimeValue", value: "Перечисление.СтатусыОбменСБанками.Обработан" },
  ],
} as const satisfies FilterItemComparison

export const inListFilterItemComparisonYAML = {
  ЛевоеЗначение: ".Статус",
  ВидСравнения: "ВСписке",
  ПравоеЗначение: [
    "Перечисление.СтатусыОбменСБанками.Доставлен",
    "Перечисление.СтатусыОбменСБанками.Исполнен",
    "Перечисление.СтатусыОбменСБанками.Обработан",
  ],
} as const satisfies Pick<FilterItemComparisonYAML, "ЛевоеЗначение" | "ВидСравнения" | "ПравоеЗначение"> & {
  ВидСравнения: "ВСписке"
}

export const inListWithNilFilterItemComparison = {
  itemType: "FilterItemComparison",
  leftValue: { type: "Field", value: "Объект.Корректировки.Документ" },
  comparisonType: "InList",
  rightValue: [
    { type: "DesignTimeValue", value: "Документ.ВыбытиеИнвестиций.ПустаяСсылка" },
    { type: "DesignTimeValue", value: "Документ.ПоступлениеИнвестиций.ПустаяСсылка" },
    undefined,
  ],
} as const satisfies FilterItemComparison

export const fullFilterItemGroup = {
  itemType: "FilterItemGroup",
  groupType: "OrGroup",
  presentation: { items: { ru: "Представление" } },
  viewMode: "Normal",
  userSettingID: "020f583f-ed48-47c1-b824-30b02c09aff9",
  userSettingPresentation: { items: { ru: "Пользовательское представление" } },
} as const satisfies Omit<FilterItemGroup, "id" | "items">

export const fullFilterItemGroupYAML = {
  ТипГруппы: "ГруппаИли",
  Представление: "Представление",
  ПредставлениеПользовательскойНастройки: "Пользовательское представление",
  РежимОтображения: "Обычный",
  ИспользоватьПользовательскуюНастройку: "020f583f-ed48-47c1-b824-30b02c09aff9",
} as const satisfies Required<Omit<FilterItemGroupYAML, "Элементы" | "Использование" | "Применение">>
