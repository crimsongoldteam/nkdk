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
    calculatedFields: calculatedFieldsRule({
      xml: "CalculatedField",
      yaml: "ВычисляемыеПоля",
      order: 4,
    }),
    conditionalAppearance: conditionalAppearanceRule({
      xml: "dcsset:conditionalAppearance",
      yaml: "УсловноеОформление",
      xmlParents: ["ListSettings"],
      order: 11,
    }),
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
    dataParameters: settingsParameterValueCollectionRule({
      xml: "dcscor:item",
      xmlParents: ["ListSettings", "dcsset:dataParameters"],
      yaml: "ПараметрыДанных",
      order: 9,
      defaultItemRule: settingsParameterValueRule({
        valueType: "Field",
      }),
    }),
    dynamicDataRead: booleanRule({
      yaml: "ДинамическоеСчитываниеДанных",
      order: 2,
      implicitValueYAML: true,
    }),
    fields: dataSetFieldFieldsRule({
      xml: "Field",
      yaml: "Поля",
      order: 4,
    }),
    filter: filterRule({
      xml: "dcsset:filter",
      yaml: "Отбор",
      xmlParents: ["ListSettings"],
      order: 8,
    }),
    getInvisibleFieldPresentations: booleanRule({
      yaml: "ПолучениеПредставленийДляНевидимыхПолей",
      implicitValueYAML: true,
      order: 7,
    }),
    group: structureItemGroupRule({
      xml: "dcsset:item",
      yaml: "Группировка",
      xmlParents: ["ListSettings"],
      order: 12,
    }),
    mainTable: stringRule({
      yaml: "ОсновнаяТаблица",
      order: 6,
    }),
    order: orderRule({
      xml: "dcsset:order",
      yaml: "Порядок",
      xmlParents: ["ListSettings"],
      order: 10,
    }),
    parameters: dCSParametersRule({
      xml: "Parameter",
      yaml: "Параметры",
      order: 5,
    }),
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
    keyFields: dynamicListKeyFieldsRule({
      xml: "KeyField",
      yaml: "ПоляКлюча",
      order: 5,
      preserveFromReferenceXML: true,
    }),
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
    itemsUserSettingID: userSettingsIDRule({
      xml: "dcsset:itemsUserSettingID",
      yaml: "ИдентификаторПользовательскойНастройкиСтруктуры",
      xmlParents: ["ListSettings"],
      order: 14,
    }),
    itemsUserSettingPresentation: dcsLocalStringTypeRule({
      xml: "dcsset:itemsUserSettingPresentation",
      yaml: "ПредставлениеПользовательскойНастройкиСтруктуры",
      xmlParents: ["ListSettings"],
      order: 15,
    }),
  },
} as const satisfies MetadataItemRule
