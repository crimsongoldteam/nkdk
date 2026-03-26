import type { Filter, FilterYAML } from "../types"

export const fullFilterFromXML = {
  itemType: "Filter",
  items: {
    itemType: "FilterItemComparison",
    leftValue: { type: "Field", value: "Поле1" },
    comparisonType: "Contains",
  },
} as const satisfies Filter

export const fullFilterForExport = {
  itemType: "Filter",
  items: {
    itemType: "FilterItemComparison",
    leftValue: { type: "Field", value: "Поле1" },
    comparisonType: "Contains",
    rightValue: { type: "string", value: "" },
  },
  userSettingPresentation: "Представление отбора",
} as const satisfies Filter

export const fullFilterFromYAML = {
  itemType: "Filter",
  items: {
    itemType: "FilterItemComparison",
    leftValue: { type: "Field", value: "Поле1" },
    comparisonType: "Contains",
    rightValue: { type: "string", value: "" },
  },
  userSettingPresentation: "Представление отбора",
} as const satisfies Filter

export const fullFilterYAML = {
  Элементы: {
    ЛевоеЗначение: ".Поле1",
    ВидСравнения: "Содержит",
    ПравоеЗначение: "''",
  },
  ПредставлениеПользовательскойНастройки: "Представление отбора",
} as const satisfies FilterYAML
