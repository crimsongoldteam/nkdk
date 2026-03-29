import type { ConditionalAppearance, ConditionalAppearanceYAML } from "~/metadata/commonObjects/dataCompositionSystem/conditionalAppearance/types"
import type { Filter, FilterYAML } from "~/metadata/commonObjects/dataCompositionSystem/filter/types"
import type { I8nText } from "~/metadata/commonObjects/i8nText/types"
import { DynamicList, DynamicListYAML } from "~/metadata/forms/commonObjects/dynamicList/types"

const queryText =
  "ВЫБРАТЬ\nСправочник1.Реквизит1 КАК Реквизит1\nИЗ\nСправочник.Справочник1 КАК Справочник1"

const filter = {
  itemType: "Filter",
  items: [
    {
      itemType: "FilterItemComparison",
      leftValue: { type: "Field", value: "Поле1" },
      comparisonType: "Contains",
    },
  ],
} satisfies Filter

const conditionalAppearance = [
  {
    itemType: "ConditionalAppearanceItem",
    fields: ["Наименование", "ПометкаУдаления"],
    filter: {
      itemType: "Filter",
      items: [
        {
          itemType: "FilterItemComparison",
          leftValue: { type: "Field", value: "Наименование" },
          comparisonType: "Contains",
          rightValue: { type: "string", value: "Текст" },
        },
      ],
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

const itemsUserSettingPresentation: I8nText = {
  items: { ru: "Представление группировки" },
}

const filterYAML = {
  Элементы: [
    {
      ЛевоеЗначение: ".Поле1",
      ВидСравнения: "Содержит",
    },
  ],
} as const satisfies FilterYAML

const conditionalAppearanceYAML = [
  {
    Поля: ["Наименование", "ПометкаУдаления"],
    Отбор: {
      Элементы: [
        {
          ЛевоеЗначение: ".Наименование",
          ВидСравнения: "Содержит",
          ПравоеЗначение: "'Текст'",
        },
      ],
    },
    Оформление: {
      Текст: "6678",
    },
  },
] as const satisfies ConditionalAppearanceYAML

/** Эталон после `importFromXML` (поля только из XML). */
export const fullDynamicListFromXML = {
  itemType: "DynamicList",
  autoFillAvailableFields: false,
  customQuery: true,
  dynamicDataRead: true,
  queryText,
  mainTable: "Catalog.Справочник1",
  filter,
  conditionalAppearance,
  itemsUserSettingID: "911b6018-f537-43e8-a417-da56b22f9aec",
  itemsUserSettingPresentation,
} satisfies DynamicList

/** Полная модель для YAML (включая поля без XML). */
export const fullDynamicList = {
  ...fullDynamicListFromXML,
  getInvisibleFieldPresentations: false,
} satisfies DynamicList

export const fullDynamicListYAML = {
  АвтоЗаполнениеДоступныхПолей: "Ложь",
  ПроизвольныйЗапрос: "Истина",
  ДинамическоеСчитываниеДанных: "Истина",
  ПолучениеПредставленийДляНевидимыхПолей: "Ложь",
  ТекстЗапроса: queryText,
  ОсновнаяТаблица: "Catalog.Справочник1",
  Отбор: filterYAML,
  УсловноеОформление: conditionalAppearanceYAML,
  ИдентификаторПользовательскойНастройкиСтруктуры: "911b6018-f537-43e8-a417-da56b22f9aec",
  ПредставлениеПользовательскойНастройкиСтруктуры: "Представление группировки",
} as const satisfies DynamicListYAML

export const minimalDynamicList: DynamicList = {
  itemType: "DynamicList",
}
