import { fixtureAppearanceFields, fixtureAppearanceFieldsYAML } from "../../appearanceFields/__fixtures__/data"
import { AppearanceFields } from "../../appearanceFields/types"
import { Filter } from "../../filter/types"
import { FilterItem, FilterItemComparison, FilterItemGroup } from "../../filterItem/types"
import { ConditionalAppearanceItem, ConditionalAppearanceItemYAML, ConditionalAppearanceYAML } from "../types"

/**
 * В XML/YAML для условного оформления `Поля` — список путей к полям данных; в типе правил
 * свойство помечено как AppearanceFields — внутри храним `_fieldNames` и приводим тип.
 */
const makeSelectionFields = (...names: string[]): AppearanceFields =>
  ({ itemType: "AppearanceFields" as const, _fieldNames: names }) as unknown as AppearanceFields

const filterItemComparison1: FilterItemComparison = {
  itemType: "FilterItemComparison",
  leftValue: "Реквизит1",
  comparisonType: "Equal",
  rightValue: { type: "boolean", value: true },
}

const filterItemComparison2: FilterItemComparison = {
  itemType: "FilterItemComparison",
  leftValue: "Реквизит2",
  comparisonType: "Contains",
  rightValue: { type: "string", value: "Реквизит1" },
  presentation: { items: { ru: "Представление" } },
}

const filterItemGroup: FilterItemGroup = {
  itemType: "FilterItemGroup",
  groupType: "AndGroup",
  items: filterItemComparison2,
}

const fullFixtureFilter: Filter = {
  itemType: "Filter",
  items: [filterItemComparison1, filterItemGroup] as unknown as FilterItem,
}

/** Полный элемент условного оформления (соответствует `full.xml`). */
export const fullConditionalAppearanceItem: ConditionalAppearanceItem = {
  itemType: "ConditionalAppearanceItem",
  fields: makeSelectionFields("Реквизит2", "Реквизит2РасширеннаяПодсказка"),
  filter: fullFixtureFilter,
  appearance: fixtureAppearanceFields,
}

/** Минимальный элемент — только выбор полей (`minimal.xml`). */
export const minimalConditionalAppearanceItem: ConditionalAppearanceItem = {
  itemType: "ConditionalAppearanceItem",
  fields: makeSelectionFields("ОдноПоле"),
}

const fullFilterYAML = {
  Элементы: [
    {
      ЛевоеЗначение: ".Реквизит1",
      ПравоеЗначение: "Истина",
    },
    {
      ТипГруппы: "ГруппаИ",
      Элементы: {
        ЛевоеЗначение: ".Реквизит2",
        ВидСравнения: "Содержит",
        ПравоеЗначение: "Реквизит1",
        Представление: "Представление",
      },
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

/** Коллекция в YAML: ключ — имя элемента (как в registerMetadataItemCollectionRule). */
export const fullConditionalAppearanceCollectionYAML = {
  full: fullConditionalAppearanceItemYAML,
} as const satisfies ConditionalAppearanceYAML

export const minimalConditionalAppearanceCollectionYAML = {
  minimal: minimalConditionalAppearanceItemYAML,
} as const satisfies ConditionalAppearanceYAML
