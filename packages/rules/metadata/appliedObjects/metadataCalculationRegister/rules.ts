import {
  additionalIndexRule,
  metadataCommandsRule,
  metadataCalculationRegisterAttributesRule,
  metadataCalculationRegisterDimensionsRule,
  metadataCalculationRegisterResourcesRule,
} from "../metadataAccountingRegister/builders"
import { childFormNamesRule } from "../../commonObjects/childFormNames/types"
import { childTemplateNamesRule } from "../../commonObjects/childTemplateNames/types"
import { helpRule } from "../../commonObjects/help/types"
import { internalInfoRule } from "../../commonObjects/internalInfo/types"
import { recalculationsRule } from "./recalculation/builders"
import { standardAttributeDescriptionsRule } from "../../commonObjects/standardAttributeDescription/builders"
import { booleanRule } from "../../commonObjects/boolean/types"
import { i8nTextRule } from "../../commonObjects/i8nText/types"
import { moduleRule } from "../../commonObjects/module/types"
import { stringRule } from "../../commonObjects/string/types"
import { uuidRule } from "../../commonObjects/uuid/types"
import { xmlRootRule } from "../../commonObjects/xmlRoot/types"
import { systemEnumerationRule } from "../../systemEnumerations/types"
import { RecalculationRules } from "./recalculation/rules"
import { V8_MDCLASSES_ROOT } from "../../ruleRuntime/appliedObject/presets"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { MetadataCommandRules } from "../../commonObjects/metadataCommand/rules"
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
  xmlOrder: [
    "internalInfo",
    "objectBelonging",
    "name",
    "synonym",
    "comment",
    "useStandardCommands",
    "defaultListForm",
    "auxiliaryListForm",
    "periodicity",
    "actionPeriod",
    "basePeriod",
    "schedule",
    "scheduleValue",
    "scheduleDate",
    "chartOfCalculationTypes",
    "includeHelpInContents",
    "standardAttributes",
    "dataLockControlMode",
    "fullTextSearch",
    "listPresentation",
    "extendedListPresentation",
    "explanation",
    "resources",
    "attributes",
    "dimensions",
    "recalculations",
    "forms",
    "templates",
    "commands",
    "uuid",
    "additionalIndexes",
    "help",
  ],
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
      defaultValueAdoptedXML: "",
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
      ownerFactRole: "actionPeriod",
      yaml: "ПериодДействия",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: properties,
    }),
    basePeriod: booleanRule({
      ownerFactRole: "basePeriod",
      yaml: "БазовыйПериод",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: properties,
    }),
    schedule: stringRule({ yaml: "График", xmlParents: properties, defaultValueXMLRaw: "", ownerFactRole: "schedule" }),
    scheduleValue: stringRule({ yaml: "ЗначениеГрафика", xmlParents: properties, defaultValueXMLRaw: "", ownerFactRole: "scheduleValue" }),
    scheduleDate: stringRule({ yaml: "ДатаГрафика", xmlParents: properties, defaultValueXMLRaw: "", ownerFactRole: "scheduleDate" }),
    chartOfCalculationTypes: stringRule({
      ownerFactRole: "chartOfCalculationTypes",
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
    resources: metadataCalculationRegisterResourcesRule({ yaml: "Ресурсы", xml: "Resource", xmlParents: childObjects }),
    dimensions: metadataCalculationRegisterDimensionsRule({ yaml: "Измерения", xml: "Dimension", xmlParents: childObjects }),
    attributes: metadataCalculationRegisterAttributesRule({
      yaml: "Реквизиты",
      xml: "Attribute",
      xmlParents: childObjects,
    }),
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
    {
      propertyKey: "commands",
      configurationIndexUidSegment: "Команда",
      itemRule: MetadataCalculationRegisterCommandRules,
    },
    { propertyKey: "recalculations", configurationIndexUidSegment: "Перерасчёт", itemRule: RecalculationRules },
  ],
} as const satisfies MetadataItemRule
