import { MetadataItemRule } from "~/metadata/orchestration/property/types"

export const DynamicListRules = {
  itemType: "DynamicList",
  properties: {
    autoFillAvailableFields: {
      type: "boolean",
      yaml: "АвтоЗаполнениеДоступныхПолей",
    },
    autoSaveUserSettings: {
      type: "boolean",
      yaml: "АвтоматическоеСохранениеПользовательскихНастроек",
      defaultValueYAML: true,
    },
    calculatedFields: {
      type: "CalculatedField",
      xml: "CalculatedField",
      yaml: "ВычисляемыеПоля",
    },
    conditionalAppearance: {
      type: "ConditionalAppearance",
      xml: "dcsset:conditionalAppearance",
      yaml: "УсловноеОформление",
      xmlParents: ["ListSettings"],
    },
    currentUserSettingsKey: {
      type: "string",
      yaml: "КлючТекущихПользовательскихНастроек",
      fromXML: false,
      toXML: false,
    },
    customQuery: {
      type: "boolean",
      xml: "ManualQuery",
      yaml: "ПроизвольныйЗапрос",
      defaultValueYAML: false,
    },
    dataParameters: {
      type: "string",
      xml: "dcsset:dataParameters",
      yaml: "ПараметрыДанных",
      xmlParents: ["ListSettings"],
      fromXML: false,
      toXML: false,
    },
    dynamicDataRead: {
      type: "boolean",
      yaml: "ДинамическоеСчитываниеДанных",
      defaultValueYAML: true,
    },
    fields: {
      type: "string",
      xml: "Field",
      yaml: "Поля",
      fromXML: false,
      toXML: false,
    },
    filter: {
      type: "Filter",
      xml: "dcsset:filter",
      yaml: "Отбор",
      xmlParents: ["ListSettings"],
    },
    getInvisibleFieldPresentations: {
      type: "boolean",
      yaml: "ПолучениеПредставленийДляНевидимыхПолей",
      defaultValueYAML: true,
    },
    group: {
      type: "StructureItemGroup",
      xml: "dcsset:item",
      yaml: "Группировка",
      xmlParents: ["ListSettings"],
    },
    keyFields: {
      type: "string",
      xml: "KeyField",
      yaml: "ПоляКлюча",
      fromXML: false,
      toXML: false,
    },
    // keyType: {
    //   type: "SystemEnumeration",
    //   typeSE: "DynamicListKeyType",
    //   yaml: "ВидКлюча",
    //   defaultValueYAML: "Авто",
    // },
    mainTable: {
      type: "string",
      yaml: "ОсновнаяТаблица",
    },
    order: {
      type: "Order",
      xml: "dcsset:order",
      yaml: "Порядок",
      xmlParents: ["ListSettings"],
    },
    parameters: {
      type: "DCSParameter",
      xml: "Parameter",
      yaml: "Параметры",
    },
    itemsViewMode: {
      type: "SystemEnumeration",
      typeSE: "DataCompositionSettingsItemViewMode",
      xml: "dcsset:itemsViewMode",
      yaml: "РежимОтображенияСтруктуры",
      xmlParents: ["ListSettings"],
    },
    settingsComposer: {
      type: "string",
      yaml: "КомпоновщикНастроек",
      runtimeOnly: true,
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
