import type { Filter, FilterYAML } from "../types"

export const filterFixture = {
  itemType: "Filter",
  items: [
    {
      itemType: "FilterItemComparison",
      leftValue: { type: "Field", value: "Поле1" },
      comparisonType: "Contains",
      rightValue: { type: "string", value: "" },
    },
  ],
  userSettingPresentation: { items: { ru: "Представление отбора" } },
} as const satisfies Filter

export const fullFilterFixtureYAML = {
  Элементы: [
    {
      ЛевоеЗначение: ".Поле1",
      ВидСравнения: "Содержит",
      ПравоеЗначение: "''",
    },
  ],
  ПредставлениеПользовательскойНастройки: "Представление отбора",
} as const satisfies FilterYAML
