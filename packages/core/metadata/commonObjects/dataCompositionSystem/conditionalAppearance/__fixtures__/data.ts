import { fixtureAppearanceFields, fixtureAppearanceFieldsYAML } from "../../appearanceFields/__fixtures__/data"
import { Filter } from "../../filter/types"
import { FilterItemComparison, FilterItemGroup } from "../../filterItem/types"
import { ConditionalAppearanceItem, ConditionalAppearanceItemYAML } from "../types"

const filterItemComparison1 = {
  itemType: "FilterItemComparison",
  leftValue: { type: "Field", value: "Реквизит1" },
  comparisonType: "Equal",
  rightValue: { type: "boolean", value: true },
} satisfies FilterItemComparison

const filterItemComparison2 = {
  itemType: "FilterItemComparison",
  leftValue: { type: "Field", value: "Реквизит2" },
  comparisonType: "Contains",
  rightValue: { type: "Field", value: "Реквизит1" },
  presentation: { items: { ru: "Представление" } },
} satisfies FilterItemComparison

const filterItemGroup = {
  itemType: "FilterItemGroup",
  groupType: "AndGroup",
  items: [filterItemComparison2],
} satisfies FilterItemGroup

const fullFixtureFilter = {
  itemType: "Filter",
  items: [filterItemComparison1, filterItemGroup],
} as const satisfies Filter

export const fullConditionalAppearanceItem: ConditionalAppearanceItem = {
  itemType: "ConditionalAppearanceItem",
  fields: {
    itemType: "AvailableFields",
  },
  filter: fullFixtureFilter,
  appearance: fixtureAppearanceFields,
}

/** Минимальный элемент — только выбор полей (`minimal.xml`). */
export const minimalConditionalAppearanceItem: ConditionalAppearanceItem = {
  itemType: "ConditionalAppearanceItem",
}

const fullFilterYAML = {
  Элементы: [
    {
      ЛевоеЗначение: ".Реквизит1",
      ПравоеЗначение: "Истина",
    },
    {
      ТипГруппы: "ГруппаИ",
      Элементы: [
        {
          ЛевоеЗначение: ".Реквизит2",
          ВидСравнения: "Содержит",
          ПравоеЗначение: ".Реквизит1",
          Представление: "Представление",
        },
      ],
    },
  ],
}

/** Эталон YAML одного элемента (полный кейс). */
export const fullConditionalAppearanceItemYAML = {
  Поля: ["Реквизит2", "Реквизит2РасширеннаяПодсказка"],
  ...(fullFilterYAML !== undefined ? { Отбор: fullFilterYAML } : {}),
  Оформление: fixtureAppearanceFieldsYAML,
} as const satisfies ConditionalAppearanceItemYAML

export const minimalConditionalAppearanceItemYAML = {
  Поля: ["ОдноПоле"],
} as const satisfies ConditionalAppearanceItemYAML
