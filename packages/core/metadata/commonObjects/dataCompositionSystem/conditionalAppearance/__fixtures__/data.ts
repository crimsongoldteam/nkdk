import type { AppearanceFields } from "../../appearanceFields/types"
import { fixtureAppearanceFields } from "../../appearanceFields/__fixtures__/data"
import type { Filter } from "../../filter/types"
import type { FilterItem, FilterItemComparison } from "../../filterItem/types"
import type { FilterItemGroup } from "../../filterItemGroup/types"
import type { ConditionalAppearanceItem } from "../types"

/**
 * The `fields` (dcsset:selection) property holds a list of data field names that the appearance
 * applies to. The current rules map this to type "AppearanceFields" which is incorrect —
 * the actual structure is a list of field path strings. We use a cast here.
 */
const makeSelectionFields = (...names: string[]): AppearanceFields =>
  ({ itemType: "AppearanceFields" as const, _fieldNames: names } as unknown as AppearanceFields)

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

const fixtureFilter: Filter = {
  itemType: "Filter",
  items: [filterItemComparison1, filterItemGroup] as unknown as FilterItem,
}

export const fixtureConditionalAppearanceItem: ConditionalAppearanceItem = {
  itemType: "ConditionalAppearanceItem",
  fields: makeSelectionFields("Реквизит2", "Реквизит2РасширеннаяПодсказка"),
  filter: fixtureFilter,
  appearance: fixtureAppearanceFields,
}
