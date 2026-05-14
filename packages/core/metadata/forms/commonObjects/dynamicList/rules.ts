import { MetadataItemRule } from "~/metadata/orchestration/property/types"

export const DynamicListRules = {
  itemType: "DynamicList",
  xsiType: "DynamicList",
  requiredXMLParents: [["ListSettings"]],
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
      type: "CalculatedFields",
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
      order: 1,
      derivedFrom: { externalFile: "queryText" },
      defaultValue: false,
      defaultValueXML: false,
      defaultValueYAML: false,
    },
    dataParameters: {
      type: "SettingsParameterValueCollection",
      xml: "dcscor:item",
      xmlParents: ["ListSettings", "dcsset:dataParameters"],
      yaml: "ПараметрыДанных",
      defaultItemRule: {
        type: "SettingsParameterValue",
        valueType: "Field",
      },
    },
    dynamicDataRead: {
      type: "boolean",
      yaml: "ДинамическоеСчитываниеДанных",
      order: 2,
      defaultValueYAML: true,
    },
    fields: {
      type: "DataSetFieldFields",
      xml: "Field",
      yaml: "Поля",
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
      type: "DCSParameters",
      xml: "Parameter",
      yaml: "Параметры",
    },
    queryText: {
      type: "string",
      xml: "QueryText",
      order: 3,
      // Значение хранится во внешнем файле — не в YAML
      externalFile: { dir: "ДинамическийСписок", extension: "query", nameFrom: "parent" },
    },
    keyType: {
      type: "SystemEnumeration",
      typeSE: "DynamicListKeyType",
      xml: "KeyType",
      yaml: "ВидКлюча",
      order: 4,
      defaultValueYAML: "Auto",
    },
    keyFields: {
      type: "DynamicListKeyFields",
      xml: "KeyField",
      yaml: "ПоляКлюча",
      order: 5,
      preserveFromReferenceXML: true,
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
      type: "DcsLocalStringType",
      xml: "dcsset:itemsUserSettingPresentation",
      yaml: "ПредставлениеПользовательскойНастройкиСтруктуры",
      xmlParents: ["ListSettings"],
    },
  },
} as const satisfies MetadataItemRule
