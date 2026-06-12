import { fixtureAppearanceFields, fixtureAppearanceFieldsYAML } from "../../appearanceFields/__fixtures__/data"
import { Filter } from "../../filter/types"
import { FilterItemComparison, FilterItemGroup } from "../../filterItem/types"
import { ConditionalAppearanceItem, ConditionalAppearanceItemsYAML } from "../types"

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

export const fullConditionalAppearanceItems: ConditionalAppearanceItem[] = [
  {
    itemType: "ConditionalAppearanceItem",
    fields: ["Реквизит2", "Реквизит2РасширеннаяПодсказка"],
    filter: fullFixtureFilter,
    appearance: fixtureAppearanceFields,
    presentation: { items: { ru: "Выделение цветом состояния" } },
  },
]

const yamlFilterItemComparison1 = {
  itemType: "FilterItemComparison",
  leftValue: { type: "Field", value: "Реквизит1" },
  rightValue: { type: "boolean", value: true },
} satisfies FilterItemComparison

const yamlFixtureFilter = {
  itemType: "Filter",
  items: [yamlFilterItemComparison1, filterItemGroup],
} as const satisfies Filter

export const fullConditionalAppearanceItemsFromYAML: ConditionalAppearanceItem[] = [
  {
    itemType: "ConditionalAppearanceItem",
    fields: ["Реквизит2", "Реквизит2РасширеннаяПодсказка"],
    filter: yamlFixtureFilter,
    appearance: fixtureAppearanceFields,
    presentation: { items: { ru: "Выделение цветом состояния" } },
  },
]

/** Минимальный элемент — только выбор полей (`minimal.xml`). */
export const minimalConditionalAppearanceItems: ConditionalAppearanceItem[] = [
  {
    itemType: "ConditionalAppearanceItem",
  },
]

/** Эталон YAML одного элемента (полный кейс). */
export const fullConditionalAppearanceItemsYAML = [
  {
    Поля: ["Реквизит2", "Реквизит2РасширеннаяПодсказка"],
    Отбор: {
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
    },
    Оформление: fixtureAppearanceFieldsYAML,
    Представление: "Выделение цветом состояния",
  },
] as const satisfies ConditionalAppearanceItemsYAML

export const minimalConditionalAppearanceItemsYAML = [{}] as const satisfies ConditionalAppearanceItemsYAML
