import { mockContext } from "~/tests/mockContext"
import { exportPropertyToYAML } from "~/metadata/orchestration"
import { fixtureAppearanceFields } from "../../appearanceFields/__fixtures__/data"
import type { AppearanceFields, AppearanceFieldsYAML } from "../../appearanceFields/types"
import { exportFilterToYAML } from "../../filter/toYAML"
import type { Filter } from "../../filter/types"
import type { FilterItem, FilterItemComparison } from "../../filterItem/types"
import type { FilterItemGroup } from "../../filterItemGroup/types"
import type { ConditionalAppearanceItem, ConditionalAppearanceItemYAML } from "../types"

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
  rightValue: "true",
}

const filterItemComparison2: FilterItemComparison = {
  itemType: "FilterItemComparison",
  leftValue: "Реквизит2",
  comparisonType: "Contains",
  rightValue: "Реквизит1",
  presentation: "Представление",
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

const fullFilterYAML = exportFilterToYAML(mockContext, fullFixtureFilter)
const fullAppearanceYAML = exportPropertyToYAML({
  context: mockContext,
  rule: { type: "Appearance" },
  value: fixtureAppearanceFields,
}) as AppearanceFieldsYAML

/** Эталон YAML для полного кейса (вложенные части строятся теми же экспортёрами, что и в toYAML). */
export const fullConditionalAppearanceItemYAML = {
  Поля: ["Реквизит2", "Реквизит2РасширеннаяПодсказка"],
  ...(fullFilterYAML !== undefined ? { Отбор: fullFilterYAML } : {}),
  Оформление: fullAppearanceYAML,
} as const satisfies ConditionalAppearanceItemYAML

export const minimalConditionalAppearanceItemYAML = {
  Поля: ["ОдноПоле"],
} as const satisfies ConditionalAppearanceItemYAML
