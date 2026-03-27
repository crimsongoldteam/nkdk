import type { ConditionalAppearance } from "~/metadata/commonObjects/dataCompositionSystem/conditionalAppearance/types"
import type { Filter } from "~/metadata/commonObjects/dataCompositionSystem/filter/types"
import type { I8nText } from "~/metadata/commonObjects/i8nText/types"
import { DynamicList, DynamicListYAML } from "~/metadata/forms/commonObjects/dynamicList/types"

const listSettingsFilter = {
  itemType: "Filter",
  items: {
    itemType: "FilterItemComparison",
    leftValue: "Поле1",
    comparisonType: "Contains",
  },
} satisfies Filter

const listSettingsConditionalAppearance = [
  {
    itemType: "ConditionalAppearanceItem",
    fields: {
      itemType: "AppearanceFields",

      _fieldNames: ["Наименование", "ПометкаУдаления"],
    },
    filter: {
      itemType: "Filter",
      items: {
        itemType: "FilterItemComparison",
        leftValue: "Наименование",
        comparisonType: "Contains",
        rightValue: { type: "string", value: "Текст" },
      },
    },
    appearance: {
      itemType: "AppearanceFields",
      Текст: {
        parameter: "Текст",
        value: { items: { ru: "6678" } },
      },
    },
  },
] satisfies ConditionalAppearance

const listSettingsItemsUserSettingPresentation: I8nText = {
  items: { ru: "Представление группировки" },
}

/** Эталон внутренней модели после `importFromXML` (ключи по `DynamicListRules`, вложенные DCS-типы). */
export const fullDynamicList = {
  autoFillAvailableFields: false,
  customQuery: true,
  dynamicDataRead: true,
  queryText: "ВЫБРАТЬ\nСправочник1.Реквизит1 КАК Реквизит1\nИЗ\nСправочник.Справочник1 КАК Справочник1",
  mainTable: "Catalog.Справочник1",
  listSettingsFilter,
  listSettingsConditionalAppearance,
  listSettingsItemsUserSettingID: "911b6018-f537-43e8-a417-da56b22f9aec",
  listSettingsItemsUserSettingPresentation,
  itemType: "DynamicList",
  listSettingsItemsViewMode: "Auto",
  uuid: "",
} satisfies Required<DynamicList>

export const fullDynamicListYAML: DynamicListYAML = {}

export const minimalDynamicList: DynamicList = {
  itemType: "DynamicList",
} as DynamicList
