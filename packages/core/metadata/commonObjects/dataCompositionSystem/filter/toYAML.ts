import type { ConfigurationContext } from "~/metadata/context/types"
import * as SE from "~/metadata/systemEnumerations/types"
import type { FilterItem, FilterItemComparison, FilterItemYAML } from "../filterItem/types"
import type { FilterItemGroup, FilterItemGroupYAML } from "../filterItemGroup/types"
import type { Filter, FilterYAML } from "./types"

const asArray = <T>(x: T | T[] | undefined): T[] => {
  if (x === undefined) return []
  return Array.isArray(x) ? x : [x]
}

const exportFilterItemToYAML = (_context: ConfigurationContext, item: FilterItem): FilterItemYAML => {
  if (item.itemType === "FilterItemGroup") {
    const g = item as FilterItemGroup
    const childItems = asArray(g.items as FilterItem | FilterItem[] | undefined).map((child) =>
      exportFilterItemToYAML(_context, child)
    )
    const result: FilterItemGroupYAML = {
      ...(g.use !== undefined ? { Использование: g.use ? ("Истина" as const) : ("Ложь" as const) } : {}),
      ...(g.groupType !== undefined
        ? { ТипГруппы: SE.DataCompositionFilterItemsGroupTypeToYAML[g.groupType] as never }
        : {}),
      ...(childItems.length > 0
        ? { Элементы: (childItems.length === 1 ? childItems[0] : childItems) as FilterItemYAML }
        : {}),
      ...(g.presentation ? { Представление: g.presentation } : {}),
      ...(g.application !== undefined
        ? { Применение: SE.DataCompositionFilterApplicationTypeToYAML[g.application] as never }
        : {}),
      ...(g.viewMode !== undefined
        ? { РежимОтображения: SE.DataCompositionSettingsItemViewModeToYAML[g.viewMode] as never }
        : {}),
      ...(g.userSettingID ? { ИдентификаторПользовательскойНастройки: g.userSettingID } : {}),
    }
    return result as unknown as FilterItemYAML
  }

  const c = item as FilterItemComparison
  const result: Record<string, unknown> = {
    ...(c.use !== undefined ? { Использование: c.use ? ("Истина" as const) : ("Ложь" as const) } : {}),
    ...(c.leftValue !== undefined ? { ЛевоеЗначение: c.leftValue } : {}),
    ...(c.comparisonType !== undefined
      ? { ВидСравнения: SE.DataCompositionComparisonTypeToYAML[c.comparisonType] }
      : {}),
    ...(c.rightValue !== undefined ? { ПравоеЗначение: c.rightValue } : {}),
    ...(c.presentation ? { Представление: c.presentation } : {}),
    ...(c.application !== undefined
      ? { Применение: SE.DataCompositionFilterApplicationTypeToYAML[c.application] }
      : {}),
    ...(c.viewMode !== undefined
      ? { РежимОтображения: SE.DataCompositionSettingsItemViewModeToYAML[c.viewMode] }
      : {}),
    ...(c.userSettingID ? { ИдентификаторПользовательскойНастройки: c.userSettingID } : {}),
  }
  return result as FilterItemYAML
}

export const exportFilterToYAML = (
  context: ConfigurationContext,
  filter: Filter | undefined
): FilterYAML | undefined => {
  if (!filter) return undefined
  const items = asArray(filter.items as FilterItem | FilterItem[] | undefined).map((item) =>
    exportFilterItemToYAML(context, item)
  )
  const result: Record<string, unknown> = {
    ...(items.length > 0
      ? { Элементы: (items.length === 1 ? items[0] : items) as FilterItemYAML }
      : {}),
    ...(filter.viewMode !== undefined
      ? { РежимОтображения: SE.DataCompositionSettingsItemViewModeToYAML[filter.viewMode] }
      : {}),
    ...(filter.userSettingID ? { ИдентификаторПользовательскойНастройки: filter.userSettingID } : {}),
  }
  return result as FilterYAML
}
