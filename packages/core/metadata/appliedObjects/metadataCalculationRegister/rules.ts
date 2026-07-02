import {
  additionalIndexRule,
  metadataCommandsRule,
  metadataRegisterAttributesRule,
  metadataRegisterDimensionsRule,
  metadataRegisterResourcesRule,
} from "~/metadata/appliedObjects/metadataAccountingRegister/builders"
import { childFormNamesRule } from "~/metadata/commonObjects/childFormNames/types"
import { childTemplateNamesRule } from "~/metadata/commonObjects/childTemplateNames/types"
import { helpRule } from "~/metadata/commonObjects/help/types"
import { internalInfoRule } from "~/metadata/commonObjects/internalInfo/types"
import { recalculationsRule } from "~/metadata/commonObjects/recalculation/builders"
import { standardAttributeDescriptionsRule } from "~/metadata/commonObjects/standardAttributeDescription/builders"
import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { i8nTextRule } from "~/metadata/commonObjects/i8nText/types"
import { moduleRule } from "~/metadata/commonObjects/module/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { uuidRule } from "~/metadata/commonObjects/uuid/types"
import { xmlRootRule } from "~/metadata/commonObjects/xmlRoot/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
import { RecalculationRules } from "~/metadata/commonObjects/recalculation/rules"
import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
import { MetadataCommandRules } from "../metadataCommand/rules"
const properties = ["Properties"]
const childObjects = ["ChildObjects"]
export const MetadataCalculationRegisterStandardAttributeNames: Record<string, string> = {
  RegistrationPeriod: "ПериодРегистрации",
  ReversingEntry: "Сторно",
  Active: "Активность",
  EndOfBasePeriod: "КонецБазовогоПериода",
  BegOfBasePeriod: "НачалоБазовогоПериода",
  EndOfActionPeriod: "КонецПериодаДействия",
  BegOfActionPeriod: "НачалоПериодаДействия",
  ActionPeriod: "ПериодДействия",
  CalculationType: "ВидРасчета",
  LineNumber: "НомерСтроки",
  Recorder: "Регистратор",
}
const MetadataCalculationRegisterCommandRules = {
  ...MetadataCommandRules,
  properties: {
    ...MetadataCommandRules.properties,
    commandModule: {
      ...MetadataCommandRules.properties.commandModule,
      xmlPath: ({ name }: { name: string }) => `Commands/${name}/Ext/CommandModule.bsl`,
    },
  },
} as const satisfies MetadataItemRule
export const MetadataCalculationRegisterRules = {
  itemType: "MetadataCalculationRegister",
  metadataTargetOwner: { kind: "self", root: "CalculationRegister" },
  itemTypePrefix: "РегистрРасчета",
  xmlDir: "CalculationRegisters",
  uniqueNameScopes: [{ collections: ["attributes", "dimensions", "resources"] }],
  properties: {
    xmlRoot: xmlRootRule({
      container: "CalculationRegister",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    }),
    internalInfo: internalInfoRule({
      xmlParents: [],
      forReferenceOnly: true,
      items: [
        { name: "CalculationRegisterRecord", category: "Record" },
        { name: "CalculationRegisterManager", category: "Manager" },
        { name: "CalculationRegisterSelection", category: "Selection" },
        { name: "CalculationRegisterList", category: "List" },
        { name: "CalculationRegisterRecordSet", category: "RecordSet" },
        { name: "CalculationRegisterRecordKey", category: "RecordKey" },
        { name: "RecalculationsManager", category: "Recalcs" },
      ],
    }),
    uuid: uuidRule({ xml: "_uuid", forReferenceOnly: true, xmlParents: [] }),
    name: stringRule({
      xmlParents: properties,
      required: true,
      defaultValue: ({ name }: { name?: string }) => name,
    }),
    synonym: i8nTextRule({
      yaml: "Синоним",
      xmlParents: properties,
      defaultValueXMLRaw: "",
      excludeIfEqualNameYAML: true,
    }),
    comment: stringRule({ yaml: "Комментарий", xmlParents: properties, defaultValueXMLRaw: "" }),
    useStandardCommands: booleanRule({
      yaml: "ИспользоватьСтандартныеКоманды",
      defaultValueXML: true,
      implicitValueYAML: true,
      xmlParents: properties,
    }),
    defaultListForm: stringRule({
      yaml: "ОсновнаяФормаСписка",
      xmlParents: properties,
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
    }),
    auxiliaryListForm: stringRule({
      yaml: "ДополнительнаяФормаСписка",
      xmlParents: properties,
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
    }),
    periodicity: systemEnumerationRule({
      yaml: "Периодичность",
      typeSE: "CalculationRegisterPeriodicity",
      defaultValueXML: "Month",
      implicitValueYAML: "Month",
      xmlParents: properties,
    }),
    actionPeriod: booleanRule({
      yaml: "ПериодДействия",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: properties,
    }),
    basePeriod: booleanRule({
      yaml: "БазовыйПериод",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: properties,
    }),
    schedule: stringRule({ yaml: "График", xmlParents: properties, defaultValueXMLRaw: "" }),
    scheduleValue: stringRule({ yaml: "ЗначениеГрафика", xmlParents: properties, defaultValueXMLRaw: "" }),
    scheduleDate: stringRule({ yaml: "ДатаГрафика", xmlParents: properties, defaultValueXMLRaw: "" }),
    chartOfCalculationTypes: stringRule({
      yaml: "ПланВидовРасчета",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
    includeHelpInContents: booleanRule({
      yaml: "ВключатьСправкуВСодержание",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: properties,
    }),
    standardAttributes: standardAttributeDescriptionsRule({
      yaml: "СтандартныеРеквизиты",
      standartAttributeNames: MetadataCalculationRegisterStandardAttributeNames,
      xmlParents: properties,
    }),
    dataLockControlMode: systemEnumerationRule({
      yaml: "РежимУправленияБлокировкойДанных",
      typeSE: "DefaultDataLockControlMode",
      defaultValueXML: "Managed",
      implicitValueYAML: "Managed",
      xmlParents: properties,
    }),
    fullTextSearch: systemEnumerationRule({
      yaml: "ПолнотекстовыйПоиск",
      typeSE: "UseFullTextSearch",
      defaultValueXML: "DontUse",
      implicitValueYAML: "DontUse",
      xmlParents: properties,
    }),
    listPresentation: i8nTextRule({ yaml: "ПредставлениеСписка", xmlParents: properties, defaultValueXMLRaw: "" }),
    extendedListPresentation: i8nTextRule({
      yaml: "РасширенноеПредставлениеСписка",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
    explanation: i8nTextRule({ yaml: "Пояснение", xmlParents: properties, defaultValueXMLRaw: "" }),
    objectBelonging: systemEnumerationRule({
      yaml: "ПринадлежностьОбъекта",
      typeSE: "ObjectBelonging",
      xmlParents: properties,
      toYAML: false,
      fromYAML: false,
      implicitValueYAML: "Native",
    }),
    extendedConfigurationObject: stringRule({ runtimeOnly: true }),
    resources: metadataRegisterResourcesRule({ yaml: "Ресурсы", xml: "Resource", xmlParents: childObjects }),
    dimensions: metadataRegisterDimensionsRule({ yaml: "Измерения", xml: "Dimension", xmlParents: childObjects }),
    attributes: metadataRegisterAttributesRule({ yaml: "Реквизиты", xml: "Attribute", xmlParents: childObjects }),
    recalculations: recalculationsRule({ yaml: "Перерасчеты", xml: "Recalculation", xmlParents: childObjects }),
    forms: childFormNamesRule({
      yaml: "Формы",
      xml: "Form",
      xmlParents: childObjects,
      folderName: "Формы",
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    }),
    templates: childTemplateNamesRule({
      yaml: "Макеты",
      xml: "Template",
      xmlParents: childObjects,
      folderName: "Макеты",
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    }),
    commands: metadataCommandsRule({ yaml: "Команды", xml: "Command", xmlParents: childObjects }),
    recordSetModule: moduleRule({
      nkdkPath: "МодульНабораЗаписей.bsl",
      xmlPath: "Ext/RecordSetModule.bsl",
      toXML: false,
      fromXML: false,
    }),
    managerModule: moduleRule({
      externalMetadata: { segment: "ManagerModule", placement: "derivedEntry" },
      nkdkPath: "МодульМенеджера.bsl",
      xmlPath: "Ext/ManagerModule.bsl",
      toXML: false,
      fromXML: false,
    }),
    additionalIndexes: additionalIndexRule({
      yaml: "ДополнительныеИндексы",
      filePath: "Ext/AdditionalIndexes.xml",
    }),
    help: helpRule({
      externalMetadata: { segment: "Help", placement: "derivedEntry" },
      filePath: "Ext/Help.xml",
      xmlPath: "Ext/Help.xml",
      nkdkDir: "Справка",
      toXML: false,
      fromXML: false,
    }),
  },
  childCollections: [
    { propertyKey: "commands", itemRule: MetadataCalculationRegisterCommandRules },
    { propertyKey: "recalculations", itemRule: RecalculationRules },
  ],
} as const satisfies MetadataItemRule
