import type { ConfigurationContext } from "~/metadata/context/types"
import * as SE from "~/metadata/systemEnumerations/types"
import { FilterItemComparisonRules } from "../filterItem/rules"
import type { FilterItem, FilterItemComparison, FilterItemYAML } from "../filterItem/types"
import { FilterItemGroupRules } from "../filterItemGroup/rules"
import type { FilterItemGroup, FilterItemGroupYAML } from "../filterItemGroup/types"
import { FilterRules } from "./rules"
import type { Filter, FilterYAML } from "./types"

const asArray = <T>(x: T | T[] | undefined): T[] => {
  if (x === undefined) return []
  return Array.isArray(x) ? x : [x]
}

const parseUseBool = (v: "Истина" | "Ложь" | undefined): boolean | undefined => {
  if (v === undefined) return undefined
  return v === "Истина"
}

const importFilterItemFromYAML = (_context: ConfigurationContext, yaml: FilterItemYAML): FilterItem => {
  const y = yaml as Record<string, unknown>

  const groupType = y["ТипГруппы"] as SE.DataCompositionFilterItemsGroupTypeYAML | undefined
  if (groupType !== undefined || y["Элементы"] !== undefined) {
    const g = yaml as FilterItemGroupYAML
    const use = parseUseBool(g["Использование"])
    const childItems = asArray(g["Элементы"] as FilterItemYAML | FilterItemYAML[] | undefined).map((item) =>
      importFilterItemFromYAML(_context, item)
    )
    const result: FilterItemGroup = {
      itemType: FilterItemGroupRules.itemType,
      ...(use !== undefined ? { use } : {}),
      ...(groupType !== undefined
        ? { groupType: SE.DataCompositionFilterItemsGroupTypeFromYAML[groupType] }
        : {}),
      ...(childItems.length > 0
        ? { items: (childItems.length === 1 ? childItems[0] : childItems) as FilterItem }
        : {}),
      ...(g["Представление"] ? { presentation: g["Представление"] } : {}),
      ...(g["Применение"] !== undefined
        ? { application: SE.DataCompositionFilterApplicationTypeFromYAML[g["Применение"]] }
        : {}),
      ...(g["РежимОтображения"] !== undefined
        ? { viewMode: SE.DataCompositionSettingsItemViewModeFromYAML[g["РежимОтображения"]] }
        : {}),
      ...(g["ИдентификаторПользовательскойНастройки"]
        ? { userSettingID: g["ИдентификаторПользовательскойНастройки"] }
        : {}),
    }
    return result
  }

  const cy = yaml as Record<string, unknown>
  const use = parseUseBool(cy["Использование"] as "Истина" | "Ложь" | undefined)
  const compTypeYaml = cy["ВидСравнения"] as SE.DataCompositionComparisonTypeYAML | undefined
  const appTypeYaml = cy["Применение"] as SE.DataCompositionFilterApplicationTypeYAML | undefined
  const vmYaml = cy["РежимОтображения"] as SE.DataCompositionSettingsItemViewModeYAML | undefined
  const result: FilterItemComparison = {
    itemType: FilterItemComparisonRules.itemType,
    ...(use !== undefined ? { use } : {}),
    ...(cy["ЛевоеЗначение"] !== undefined ? { leftValue: String(cy["ЛевоеЗначение"]) } : {}),
    ...(compTypeYaml !== undefined
      ? { comparisonType: SE.DataCompositionComparisonTypeFromYAML[compTypeYaml] }
      : {}),
    ...(cy["ПравоеЗначение"] !== undefined ? { rightValue: String(cy["ПравоеЗначение"]) } : {}),
    ...(cy["Представление"] ? { presentation: String(cy["Представление"]) } : {}),
    ...(appTypeYaml !== undefined
      ? { application: SE.DataCompositionFilterApplicationTypeFromYAML[appTypeYaml] }
      : {}),
    ...(vmYaml !== undefined ? { viewMode: SE.DataCompositionSettingsItemViewModeFromYAML[vmYaml] } : {}),
    ...(cy["ИдентификаторПользовательскойНастройки"]
      ? { userSettingID: String(cy["ИдентификаторПользовательскойНастройки"]) }
      : {}),
  }
  return result
}

export const importFilterFromYAML = (
  context: ConfigurationContext,
  yaml: FilterYAML | undefined
): Filter | undefined => {
  if (!yaml) return undefined
  const y = yaml as Record<string, unknown>
  const itemsRaw = y["Элементы"] as FilterItemYAML | FilterItemYAML[] | undefined
  const items = asArray(itemsRaw).map((item) => importFilterItemFromYAML(context, item))
  const vmYaml = y["РежимОтображения"] as SE.DataCompositionSettingsItemViewModeYAML | undefined
  return {
    itemType: FilterRules.itemType,
    ...(items.length > 0 ? { items: (items.length === 1 ? items[0] : items) as FilterItem } : {}),
    ...(vmYaml !== undefined ? { viewMode: SE.DataCompositionSettingsItemViewModeFromYAML[vmYaml] } : {}),
    ...(y["ИдентификаторПользовательскойНастройки"]
      ? { userSettingID: String(y["ИдентификаторПользовательскойНастройки"]) }
      : {}),
    ...(y["ПредставлениеПользовательскойНастройки"]
      ? { userSettingPresentation: String(y["ПредставлениеПользовательскойНастройки"]) }
      : {}),
  }
}
