import { MetadataItemRule } from "~/metadata/orchestration/property/types"

export const DynamicListRules = {
  itemType: "DynamicList",
  properties: {
    autoFillAvailableFields: {
      type: "boolean",
      yaml: "АвтоЗаполнениеДоступныхПолей",
    },
    customQuery: {
      type: "boolean",
      xml: "ManualQuery",
      yaml: "ПроизвольныйЗапрос",
    },
    dynamicDataRead: {
      type: "boolean",
      yaml: "ДинамическоеСчитываниеДанных",
    },
    queryText: {
      type: "string",
    },
    mainTable: {
      type: "string",
      yaml: "ОсновнаяТаблица",
    },
    listSettingsFilter: {
      type: "Filter",
      xml: "dcsset:filter",
      yaml: "Отбор",
      xmlParents: ["ListSettings"],
    },
    listSettingsConditionalAppearance: {
      type: "ConditionalAppearance",
      xml: "dcsset:conditionalAppearance",
      yaml: "УсловноеОформление",
      xmlParents: ["ListSettings"],
    },
    listSettingsItemsViewMode: {
      type: "SystemEnumeration",
      typeSE: "DataCompositionSettingsItemViewMode",
      xml: "dcsset:itemsViewMode",
      yaml: "РежимОтображенияСтруктуры",
      xmlParents: ["ListSettings"],
    },
    listSettingsItemsUserSettingID: {
      type: "string",
      xml: "dcsset:itemsUserSettingID",
      yaml: "ИдентификаторПользовательскойНастройкиСтруктуры",
      xmlParents: ["ListSettings"],
    },
    listSettingsItemsUserSettingPresentation: {
      type: "I8nText",
      xml: "dcsset:itemsUserSettingPresentation",
      yaml: "ПредставлениеПользовательскойНастройкиСтруктуры",
      xmlParents: ["ListSettings"],
    },
  },
} as const satisfies MetadataItemRule
