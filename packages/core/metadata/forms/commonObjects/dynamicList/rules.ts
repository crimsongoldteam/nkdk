import { filterRule } from "../../../commonObjects/dataCompositionSystem/conditionalAppearanceItem/builders"
import { dcsLocalStringTypeRule } from "../../../commonObjects/dataCompositionSystem/dcsLocalStringType/types"
import { settingsParameterValueRule } from "../../../commonObjects/dataCompositionSystem/parameterValue/types"
import { settingsParameterValueCollectionRule } from "../../../commonObjects/dataCompositionSystem/settingsParameterValueCollection/types"
import { structureItemGroupRule } from "../../../commonObjects/dataCompositionSystem/structureItemGroup/builders"
import { userSettingsIDRule } from "../../../commonObjects/userSettingsID/types"
import { conditionalAppearanceRule } from "../../clientApplicationForm/builders"
import {
  calculatedFieldsRule,
  dCSParametersRule,
  dataSetFieldFieldsRule,
  dynamicListKeyFieldsRule,
  orderRule,
} from "./builders"
import { booleanRule } from "../../../commonObjects/boolean/types"
import { stringRule } from "../../../commonObjects/string/types"
import { systemEnumerationRule } from "../../../systemEnumerations/types"
import type { MetadataItemRule } from "../../../orchestration/property/types"
export const DynamicListRules = {
  itemType: "DynamicList",
  xsiType: "DynamicList",
  xmlOrder: [
    "autoFillAvailableFields",
    "customQuery",
    "dynamicDataRead",
    "queryText",
    "fields",
    "calculatedFields",
    "parameters",
    "mainTable",
    "keyType",
    "keyFields",
    "autoSaveUserSettings",
    "getInvisibleFieldPresentations",
    "filter",
    "dataParameters",
    "order",
    "conditionalAppearance",
    "group",
    "itemsViewMode",
    "itemsUserSettingID",
    "itemsUserSettingPresentation",
  ],
  properties: {
    autoFillAvailableFields: booleanRule({
      yaml: "АвтоЗаполнениеДоступныхПолей",
      implicitValueYAML: true,
    }),
    autoSaveUserSettings: booleanRule({
      yaml: "АвтоматическоеСохранениеПользовательскихНастроек",
      implicitValueYAML: true,
    }),
    calculatedFields: calculatedFieldsRule({
      xml: "CalculatedField",
      yaml: "ВычисляемыеПоля",
    }),
    conditionalAppearance: conditionalAppearanceRule({
      xml: "dcsset:conditionalAppearance",
      yaml: "УсловноеОформление",
      xmlParents: ["ListSettings"],
    }),
    currentUserSettingsKey: stringRule({
      yaml: "КлючТекущихПользовательскихНастроек",
      fromXML: false,
      toXML: false,
    }),
    customQuery: booleanRule({
      xml: "ManualQuery",
      yaml: "ПроизвольныйЗапрос",
      defaultValue: false,
      defaultValueXML: false,
      implicitValueYAML: false,
    }),
    dataParameters: settingsParameterValueCollectionRule({
      xml: "dcscor:item",
      xmlParents: ["ListSettings", "dcsset:dataParameters"],
      yaml: "ПараметрыДанных",
      defaultItemRule: settingsParameterValueRule({
        valueType: "Field",
      }),
    }),
    dynamicDataRead: booleanRule({
      yaml: "ДинамическоеСчитываниеДанных",
      implicitValueYAML: true,
    }),
    fields: dataSetFieldFieldsRule({
      xml: "Field",
      yaml: "Поля",
    }),
    filter: filterRule({
      xml: "dcsset:filter",
      yaml: "Отбор",
      xmlParents: ["ListSettings"],
    }),
    getInvisibleFieldPresentations: booleanRule({
      yaml: "ПолучениеПредставленийДляНевидимыхПолей",
      implicitValueYAML: true,
    }),
    group: structureItemGroupRule({
      xml: "dcsset:item",
      yaml: "Группировка",
      xmlParents: ["ListSettings"],
    }),
    mainTable: stringRule({
      yaml: "ОсновнаяТаблица",
    }),
    order: orderRule({
      xml: "dcsset:order",
      yaml: "Порядок",
      xmlParents: ["ListSettings"],
    }),
    parameters: dCSParametersRule({
      xml: "Parameter",
      yaml: "Параметры",
    }),
    queryText: stringRule({
      xml: "QueryText",
      externalFile: { dir: "ДинамическийСписок", extension: "query", nameFrom: "parent" },
    }),
    keyType: systemEnumerationRule({
      typeSE: "DynamicListKeyType",
      xml: "KeyType",
      yaml: "ВидКлюча",
      implicitValueYAML: "Auto",
    }),
    keyFields: dynamicListKeyFieldsRule({
      xml: "KeyField",
      yaml: "ПоляКлюча",
    }),
    itemsViewMode: systemEnumerationRule({
      typeSE: "DataCompositionSettingsItemViewMode",
      xml: "dcsset:itemsViewMode",
      yaml: "РежимОтображенияСтруктуры",
      xmlParents: ["ListSettings"],
      implicitValueYAML: "Normal",
    }),
    settingsComposer: stringRule({
      yaml: "КомпоновщикНастроек",
      runtimeOnly: true,
    }),
    itemsUserSettingID: userSettingsIDRule({
      xml: "dcsset:itemsUserSettingID",
      yaml: "ИдентификаторПользовательскойНастройкиСтруктуры",
      xmlParents: ["ListSettings"],
    }),
    itemsUserSettingPresentation: dcsLocalStringTypeRule({
      xml: "dcsset:itemsUserSettingPresentation",
      yaml: "ПредставлениеПользовательскойНастройкиСтруктуры",
      xmlParents: ["ListSettings"],
    }),
  },
} as const satisfies MetadataItemRule
