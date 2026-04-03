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
      defaultValueYAML: false,
    },
    dynamicDataRead: {
      type: "boolean",
      yaml: "ДинамическоеСчитываниеДанных",
      defaultValueYAML: true,
    },
    getInvisibleFieldPresentations: {
      type: "boolean",
      yaml: "ПолучениеПредставленийДляНевидимыхПолей",
      defaultValueYAML: true,
    },
    keyType: {
      type: "string",
      yaml: "ВидКлюча",
    },
    mainTable: {
      type: "string",
      yaml: "ОсновнаяТаблица",
    },
    mainTableCategory: {
      type: "number",
      yaml: "КатегорияОсновнойТаблицы",
    },
    staticQuery: {
      type: "boolean",
      yaml: "СтатическийЗапрос",
    },
    hierAvailable: {
      type: "boolean",
      yaml: "ДоступнаИерархия",
    },
    autoSaveUsrSettings: {
      type: "boolean",
      xml: "AutoSaveUserSettings",
      yaml: "АвтоматическоеСохранениеПользовательскихНастроек",
    },
    queryText: {
      type: "string",
      yaml: "ТекстЗапроса",
    },
    additionalData: {
      type: "string",
      yaml: "ДополнительныеДанные",
    },
    changesVersion: {
      type: "number",
      yaml: "ВерсияИзменений",
    },
    filter: {
      type: "Filter",
      xml: "dcsset:filter",
      yaml: "Отбор",
      xmlParents: ["ListSettings"],
    },
    conditionalAppearance: {
      type: "ConditionalAppearance",
      xml: "dcsset:conditionalAppearance",
      yaml: "УсловноеОформление",
      xmlParents: ["ListSettings"],
    },
    itemsViewMode: {
      type: "SystemEnumeration",
      typeSE: "DataCompositionSettingsItemViewMode",
      xml: "dcsset:itemsViewMode",
      yaml: "РежимОтображенияСтруктуры",
      xmlParents: ["ListSettings"],
    },
    itemsUserSettingID: {
      type: "UserSettingsID",
      xml: "dcsset:itemsUserSettingID",
      yaml: "ИдентификаторПользовательскойНастройкиСтруктуры",
      xmlParents: ["ListSettings"],
    },
    itemsUserSettingPresentation: {
      type: "UserSettingPresentation",
      xml: "dcsset:itemsUserSettingPresentation",
      yaml: "ПредставлениеПользовательскойНастройкиСтруктуры",
      xmlParents: ["ListSettings"],
    },
  },
} as const satisfies MetadataItemRule
