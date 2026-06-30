import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"
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
    xmlRoot: {
      type: "XMLRoot",
      container: "AccumulationRegister",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    },
    internalInfo: {
      type: "InternalInfo",
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
    },
    uuid: {
      type: "uuid",
      xml: "_uuid",
      forReferenceOnly: true,
      xmlParents: [],
    },
    name: {
      type: "string",
      xmlParents: properties,
      required: true,
      defaultValue: ({ name }: { name?: string }) => name,
    },
    synonym: {
      yaml: "Синоним",
      type: "I8nText",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    },
    comment: {
      yaml: "Комментарий",
      type: "string",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    },
    useStandardCommands: {
      yaml: "ИспользоватьСтандартныеКоманды",
      type: "boolean",
      defaultValueXML: true,
      implicitValueYAML: true,
      xmlParents: properties,
    },
    defaultListForm: {
      yaml: "ОсновнаяФормаСписка",
      type: "string",
      xmlParents: properties,
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
    },
    auxiliaryListForm: {
      yaml: "ДополнительнаяФормаСписка",
      type: "string",
      xmlParents: properties,
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
    },
    registerType: {
      yaml: "ВидРегистра",
      type: "SystemEnumeration",
      typeSE: "AccumulationRegisterType",
      defaultValueXML: "Balance",
      implicitValueYAML: "Balance",
      xmlParents: properties,
    },
    includeHelpInContents: {
      yaml: "ВключатьСправкуВСодержание",
      type: "boolean",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: properties,
    },
    standardAttributes: {
      yaml: "СтандартныеРеквизиты",
      type: "StandardAttributeDescriptions",
      standartAttributeNames: MetadataAccumulationRegisterStandardAttributeNames,
      standartAttributeNamesXML: (metadataItem: unknown) =>
        isTurnoverAccumulationRegister(metadataItem)
          ? MetadataAccumulationRegisterTurnoverStandardAttributeNames
          : MetadataAccumulationRegisterStandardAttributeNames,
      xmlParents: properties,
    },
    dataLockControlMode: {
      yaml: "РежимУправленияБлокировкойДанных",
      type: "SystemEnumeration",
      typeSE: "DefaultDataLockControlMode",
      defaultValueXML: "Managed",
      implicitValueYAML: "Managed",
      xmlParents: properties,
    },
    fullTextSearch: {
      yaml: "ПолнотекстовыйПоиск",
      type: "SystemEnumeration",
      typeSE: "UseFullTextSearch",
      defaultValueXML: "DontUse",
      implicitValueYAML: "DontUse",
      xmlParents: properties,
    },
    enableTotalsSplitting: {
      yaml: "РазделениеИтогов",
      type: "boolean",
      defaultValueXML: true,
      implicitValueYAML: true,
      xmlParents: properties,
    },
    listPresentation: {
      yaml: "ПредставлениеСписка",
      type: "I8nText",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    },
    extendedListPresentation: {
      yaml: "РасширенноеПредставлениеСписка",
      type: "I8nText",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    },
    explanation: {
      yaml: "Пояснение",
      type: "I8nText",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    },
    objectBelonging: {
      yaml: "ПринадлежностьОбъекта",
      type: "SystemEnumeration",
      typeSE: "ObjectBelonging",
      xmlParents: properties,
      toYAML: false,
      fromYAML: false,
      implicitValueYAML: "Native",
    },
    extendedConfigurationObject: {
      yaml: "ОбъектРасширяемойКонфигурации",
      type: "string",
      runtimeOnly: true,
    },
    resources: {
      yaml: "Ресурсы",
      type: "MetadataRegisterResources",
      xmlParents: childObjects,
      xml: "Resource",
    },
    dimensions: {
      yaml: "Измерения",
      type: "MetadataRegisterDimensions",
      xmlParents: childObjects,
      xml: "Dimension",
    },
    attributes: {
      yaml: "Реквизиты",
      type: "MetadataRegisterAttributes",
      xmlParents: childObjects,
      xml: "Attribute",
    },
    forms: {
      type: "ChildFormNames",
      xml: "Form",
      folderName: "Формы",
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
      xmlParents: childObjects,
    },
    templates: {
      type: "ChildTemplateNames",
      xml: "Template",
      folderName: "Шаблоны",
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
      xmlParents: childObjects,
    },
    commands: {
      yaml: "Команды",
      type: "MetadataCommands",
      xmlParents: childObjects,
      xml: "Command",
    },
    additionalIndexes: {
      yaml: "ДополнительныеИндексы",
      type: "AdditionalIndex",
      filePath: "Ext/AdditionalIndexes.xml",
    },
    aggregates: {
      yaml: "Агрегаты",
      type: "AccumulationRegisterAggregates",
      filePath: "Ext/Aggregates.xml",
    },
    managerModule: {
      type: "Module",
      externalMetadata: { segment: "ManagerModule", placement: "derivedEntry" },
      nkdkPath: "МодульМенеджера.bsl",
      xmlPath: "Ext/ManagerModule.bsl",
      toXML: false,
      fromXML: false,
    },
    recordSetModule: {
      type: "Module",
      nkdkPath: "МодульНабораЗаписей.bsl",
      xmlPath: "Ext/RecordSetModule.bsl",
      toXML: false,
      fromXML: false,
    },
    help: {
      type: "Help",
      externalMetadata: { segment: "Help", placement: "derivedEntry" },
      filePath: "Ext/Help.xml",
      nkdkDir: "Справка",
    },
  },
  childCollections: [{ propertyKey: "commands", itemRule: MetadataAccumulationRegisterCommandRules }],
} as const satisfies MetadataItemRule
