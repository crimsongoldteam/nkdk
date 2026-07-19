import {
  additionalIndexRule,
  metadataCommandsRule,
  metadataRegisterAttributesRule,
  metadataRegisterDimensionsRule,
  metadataRegisterResourcesRule,
} from "../metadataAccountingRegister/builders"
import { accumulationRegisterAggregatesRule } from "./builders"
import { childFormNamesRule } from "../../commonObjects/childFormNames/types"
import { childTemplateNamesRule } from "../../commonObjects/childTemplateNames/types"
import { helpRule } from "../../commonObjects/help/types"
import { internalInfoRule } from "../../commonObjects/internalInfo/types"
import { standardAttributeDescriptionsRule } from "../../commonObjects/standardAttributeDescription/builders"
import { booleanRule } from "../../commonObjects/boolean/types"
import { i8nTextRule } from "../../commonObjects/i8nText/types"
import { moduleRule } from "../../commonObjects/module/types"
import { stringRule } from "../../commonObjects/string/types"
import { uuidRule } from "../../commonObjects/uuid/types"
import { xmlRootRule } from "../../commonObjects/xmlRoot/types"
import { systemEnumerationRule } from "../../systemEnumerations/types"
import { V8_MDCLASSES_ROOT } from "../../orchestration/appliedObject/presets"
import type { MetadataItemRule } from "../../orchestration/property/types"
import { MetadataCommandRules } from "../metadataCommand/rules"
const properties = ["Properties"]
const childObjects = ["ChildObjects"]
export const MetadataAccumulationRegisterStandardAttributeNames: Record<string, string> = {
  RecordType: "ВидДвижения",
  Active: "Активность",
  LineNumber: "НомерСтроки",
  Recorder: "Регистратор",
  Period: "Период",
}
const MetadataAccumulationRegisterTurnoverStandardAttributeNames: Record<string, string> = {
  Active: "Активность",
  LineNumber: "НомерСтроки",
  Recorder: "Регистратор",
  Period: "Период",
}
const isTurnoverAccumulationRegister = (metadataItem: unknown): boolean =>
  typeof metadataItem === "object" &&
  metadataItem !== null &&
  "registerType" in metadataItem &&
  metadataItem.registerType === "Turnovers"
const MetadataAccumulationRegisterCommandRules = {
  ...MetadataCommandRules,
  properties: {
    ...MetadataCommandRules.properties,
    commandModule: {
      ...MetadataCommandRules.properties.commandModule,
      xmlPath: ({ name }: { name: string }) => `Commands/${name}/Ext/CommandModule.bsl`,
    },
  },
} as const satisfies MetadataItemRule
export const MetadataAccumulationRegisterRules = {
  itemType: "MetadataAccumulationRegister",
  metadataTargetOwner: { kind: "self", root: "AccumulationRegister" },
  itemTypePrefix: "РегистрНакопления",
  xmlDir: "AccumulationRegisters",
  uniqueNameScopes: [{ collections: ["attributes", "dimensions", "resources"] }],
  properties: {
    xmlRoot: xmlRootRule({
      container: "AccumulationRegister",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    }),
    internalInfo: internalInfoRule({
      xmlParents: [],
      forReferenceOnly: true,
      items: [
        { name: "AccumulationRegisterRecord", category: "Record" },
        { name: "AccumulationRegisterManager", category: "Manager" },
        { name: "AccumulationRegisterSelection", category: "Selection" },
        { name: "AccumulationRegisterList", category: "List" },
        { name: "AccumulationRegisterRecordSet", category: "RecordSet" },
        { name: "AccumulationRegisterRecordKey", category: "RecordKey" },
      ],
    }),
    uuid: uuidRule({
      xml: "_uuid",
      forReferenceOnly: true,
      xmlParents: [],
    }),
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
    comment: stringRule({
      yaml: "Комментарий",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
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
    registerType: systemEnumerationRule({
      yaml: "ВидРегистра",
      typeSE: "AccumulationRegisterType",
      defaultValueXML: "Balance",
      implicitValueYAML: "Balance",
      xmlParents: properties,
    }),
    includeHelpInContents: booleanRule({
      yaml: "ВключатьСправкуВСодержание",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: properties,
    }),
    standardAttributes: standardAttributeDescriptionsRule({
      yaml: "СтандартныеРеквизиты",
      standartAttributeNames: MetadataAccumulationRegisterStandardAttributeNames,
      standartAttributeNamesXML: (metadataItem: unknown) =>
        isTurnoverAccumulationRegister(metadataItem)
          ? MetadataAccumulationRegisterTurnoverStandardAttributeNames
          : MetadataAccumulationRegisterStandardAttributeNames,
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
    enableTotalsSplitting: booleanRule({
      yaml: "РазделениеИтогов",
      defaultValueXML: true,
      implicitValueYAML: true,
      xmlParents: properties,
    }),
    listPresentation: i8nTextRule({
      yaml: "ПредставлениеСписка",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
    extendedListPresentation: i8nTextRule({
      yaml: "РасширенноеПредставлениеСписка",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
    explanation: i8nTextRule({
      yaml: "Пояснение",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
    objectBelonging: systemEnumerationRule({
      yaml: "ПринадлежностьОбъекта",
      typeSE: "ObjectBelonging",
      xmlParents: properties,
      toYAML: false,
      fromYAML: false,
      implicitValueYAML: "Native",
    }),
    extendedConfigurationObject: stringRule({
      yaml: "ОбъектРасширяемойКонфигурации",
      runtimeOnly: true,
    }),
    resources: metadataRegisterResourcesRule({
      yaml: "Ресурсы",
      xmlParents: childObjects,
      xml: "Resource",
    }),
    dimensions: metadataRegisterDimensionsRule({
      yaml: "Измерения",
      xmlParents: childObjects,
      xml: "Dimension",
    }),
    attributes: metadataRegisterAttributesRule({
      yaml: "Реквизиты",
      xmlParents: childObjects,
      xml: "Attribute",
    }),
    forms: childFormNamesRule({
      xml: "Form",
      folderName: "Формы",
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
      xmlParents: childObjects,
    }),
    templates: childTemplateNamesRule({
      xml: "Template",
      folderName: "Шаблоны",
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
      xmlParents: childObjects,
    }),
    commands: metadataCommandsRule({
      yaml: "Команды",
      xmlParents: childObjects,
      xml: "Command",
    }),
    additionalIndexes: additionalIndexRule({
      yaml: "ДополнительныеИндексы",
      filePath: "Ext/AdditionalIndexes.xml",
    }),
    aggregates: accumulationRegisterAggregatesRule({
      yaml: "Агрегаты",
      filePath: "Ext/Aggregates.xml",
    }),
    managerModule: moduleRule({
      externalMetadata: { segment: "ManagerModule", placement: "derivedEntry" },
      nkdkPath: "МодульМенеджера.bsl",
      xmlPath: "Ext/ManagerModule.bsl",
      toXML: false,
      fromXML: false,
    }),
    recordSetModule: moduleRule({
      nkdkPath: "МодульНабораЗаписей.bsl",
      xmlPath: "Ext/RecordSetModule.bsl",
      toXML: false,
      fromXML: false,
    }),
    help: helpRule({
      externalMetadata: { segment: "Help", placement: "derivedEntry" },
      filePath: "Ext/Help.xml",
      nkdkDir: "Справка",
    }),
  },
  childCollections: [
    {
      propertyKey: "commands",
      configurationIndexUidSegment: "Команда",
      itemRule: MetadataAccumulationRegisterCommandRules,
    },
  ],
} as const satisfies MetadataItemRule
