import type { Filter } from "../types"

export const filterFixture = {
  itemType: "Filter",
  items: [
    {
      itemType: "FilterItemComparison",
      leftValue: { type: "Field", value: "Поле1" },
      comparisonType: "Contains",
    },
  ],
  userSettingPresentation: { items: { ru: "Представление отбора" } },
} as const satisfies Filter

export const fullFilterFixtureYAML = {
  Элементы: [
    {
      ЛевоеЗначение: ".Поле1",
      ВидСравнения: "Содержит",
    },
  ],
  ПредставлениеПользовательскойНастройки: "Представление отбора",
} as const
