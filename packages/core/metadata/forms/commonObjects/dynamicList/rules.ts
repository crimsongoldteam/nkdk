import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"
export const DynamicListRules = {
  itemType: "DynamicList",
  xsiType: "DynamicList",
  properties: {
    autoFillAvailableFields: booleanRule({
      yaml: "АвтоЗаполнениеДоступныхПолей",
      order: 0,
      implicitValueYAML: true,
    }),
    autoSaveUserSettings: booleanRule({
      yaml: "АвтоматическоеСохранениеПользовательскихНастроек",
      implicitValueYAML: true,
      order: 7,
    }),
    calculatedFields: {
      type: "CalculatedFields",
      xml: "CalculatedField",
      yaml: "ВычисляемыеПоля",
      order: 4,
    },
    conditionalAppearance: {
      type: "ConditionalAppearance",
      xml: "dcsset:conditionalAppearance",
      yaml: "УсловноеОформление",
      xmlParents: ["ListSettings"],
      order: 11,
    },
    currentUserSettingsKey: stringRule({
      yaml: "КлючТекущихПользовательскихНастроек",
      fromXML: false,
      toXML: false,
    }),
    customQuery: booleanRule({
      xml: "ManualQuery",
      yaml: "ПроизвольныйЗапрос",
      order: 1,
      defaultValue: false,
      defaultValueXML: false,
      implicitValueYAML: false,
    }),
    dataParameters: {
      type: "SettingsParameterValueCollection",
      xml: "dcscor:item",
      xmlParents: ["ListSettings", "dcsset:dataParameters"],
      yaml: "ПараметрыДанных",
      order: 9,
      defaultItemRule: {
        type: "SettingsParameterValue",
        valueType: "Field",
      },
    },
    dynamicDataRead: booleanRule({
      yaml: "ДинамическоеСчитываниеДанных",
      order: 2,
      implicitValueYAML: true,
    }),
    fields: {
      type: "DataSetFieldFields",
      xml: "Field",
      yaml: "Поля",
      order: 4,
    },
    filter: {
      type: "Filter",
      xml: "dcsset:filter",
      yaml: "Отбор",
      xmlParents: ["ListSettings"],
      order: 8,
    },
    getInvisibleFieldPresentations: booleanRule({
      yaml: "ПолучениеПредставленийДляНевидимыхПолей",
      implicitValueYAML: true,
      order: 7,
    }),
    group: {
      type: "StructureItemGroup",
      xml: "dcsset:item",
      yaml: "Группировка",
      xmlParents: ["ListSettings"],
      order: 12,
    },
    mainTable: stringRule({
      yaml: "ОсновнаяТаблица",
      order: 6,
    }),
    order: {
      type: "Order",
      xml: "dcsset:order",
      yaml: "Порядок",
      xmlParents: ["ListSettings"],
      order: 10,
    },
    parameters: {
      type: "DCSParameters",
      xml: "Parameter",
      yaml: "Параметры",
      order: 5,
    },
    queryText: stringRule({
      xml: "QueryText",
      order: 3,
      // Значение хранится во внешнем файле — не в YAML
      externalFile: { dir: "ДинамическийСписок", extension: "query", nameFrom: "parent" },
    }),
    keyType: systemEnumerationRule({
      typeSE: "DynamicListKeyType",
      xml: "KeyType",
      yaml: "ВидКлюча",
      order: 4,
      implicitValueYAML: "Auto",
    }),
    keyFields: {
      type: "DynamicListKeyFields",
      xml: "KeyField",
      yaml: "ПоляКлюча",
      order: 5,
      preserveFromReferenceXML: true,
    },
    itemsViewMode: systemEnumerationRule({
      typeSE: "DataCompositionSettingsItemViewMode",
      xml: "dcsset:itemsViewMode",
      yaml: "РежимОтображенияСтруктуры",
      xmlParents: ["ListSettings"],
      order: 13,
      implicitValueYAML: "Normal",
    }),
    settingsComposer: stringRule({
      yaml: "КомпоновщикНастроек",
      runtimeOnly: true,
    }),
    itemsUserSettingID: {
      type: "UserSettingsID",
      xml: "dcsset:itemsUserSettingID",
      yaml: "ИдентификаторПользовательскойНастройкиСтруктуры",
      xmlParents: ["ListSettings"],
      order: 14,
    },
    itemsUserSettingPresentation: {
      type: "DcsLocalStringType",
      xml: "dcsset:itemsUserSettingPresentation",
      yaml: "ПредставлениеПользовательскойНастройкиСтруктуры",
      xmlParents: ["ListSettings"],
      order: 15,
    },
  },
} as const satisfies MetadataItemRule
