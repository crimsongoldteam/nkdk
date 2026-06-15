import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"
import { MetadataCommandRules } from "../metadataCommand/rules"

const properties = ["Properties"]
const childObjects = ["ChildObjects"]

export const MetadataAccountingRegisterStandardAttributeNames: Record<string, string> = {
  PeriodAdjustment: "УточнениеПериода",
  Account: "Счет",
  Active: "Активность",
  LineNumber: "НомерСтроки",
  Recorder: "Регистратор",
  Period: "Период",
  ...Object.fromEntries(
    Array.from({ length: 50 }, (_, index) => {
      const number = index + 1
      return [
        [`ExtDimension${number}`, `Субконто${number}`],
        [`ExtDimensionType${number}`, `ВидСубконто${number}`],
      ]
    }).flat()
  ),
}

const extDimensionStandardAttributeName = /^ExtDimension(Type)?\d+$/

export const MetadataAccountingRegisterStandardAttributeNamesXML = (metadataItem: unknown): Record<string, string> => {
  const item = metadataItem && typeof metadataItem === "object" ? (metadataItem as { standardAttributes?: unknown }) : {}
  const standardAttributes = Array.isArray(item.standardAttributes) ? item.standardAttributes : []
  const explicitExtDimensions = new Set(
    standardAttributes
      .map((attribute) =>
        attribute && typeof attribute === "object" ? (attribute as { name?: unknown }).name : undefined
      )
      .filter((name): name is string => typeof name === "string" && extDimensionStandardAttributeName.test(name))
  )

  return Object.fromEntries(
    Object.entries(MetadataAccountingRegisterStandardAttributeNames).filter(
      ([name]) => !extDimensionStandardAttributeName.test(name) || explicitExtDimensions.has(name)
    )
  )
}

const MetadataAccountingRegisterCommandRules = {
  ...MetadataCommandRules,
  properties: {
    ...MetadataCommandRules.properties,
    commandModule: {
      ...MetadataCommandRules.properties.commandModule,
      xmlPath: ({ name }: { name: string }) => `Commands/${name}/Ext/CommandModule.bsl`,
    },
  },
} as const satisfies MetadataItemRule

export const MetadataAccountingRegisterRules = {
  itemType: "MetadataAccountingRegister",
  itemTypePrefix: "РегистрБухгалтерии",
  xmlDir: "AccountingRegisters",
  uniqueNameScopes: [{ collections: ["attributes", "dimensions", "resources"] }],
  properties: {
    xmlRoot: {
      type: "XMLRoot",
      container: "AccountingRegister",
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
        { name: "AccountingRegisterRecord", category: "Record" },
        { name: "AccountingRegisterExtDimensions", category: "ExtDimensions" },
        { name: "AccountingRegisterRecordSet", category: "RecordSet" },
        { name: "AccountingRegisterRecordKey", category: "RecordKey" },
        { name: "AccountingRegisterSelection", category: "Selection" },
        { name: "AccountingRegisterList", category: "List" },
        { name: "AccountingRegisterManager", category: "Manager" },
      ],
    },
    uuid: { type: "uuid", xml: "_uuid", forReferenceOnly: true, xmlParents: [] },
    name: { type: "string", xmlParents: properties, required: true, defaultValue: ({ name }: { name?: string }) => name },
    synonym: { yaml: "Синоним", type: "I8nText", xmlParents: properties, defaultValueXMLRaw: "" },
    comment: { yaml: "Комментарий", type: "string", xmlParents: properties, defaultValueXMLRaw: "" },
    useStandardCommands: {
      yaml: "ИспользоватьСтандартныеКоманды",
      type: "boolean",
      defaultValueXML: true,
      implicitValueYAML: true,
      xmlParents: properties,
    },
    includeHelpInContents: {
      yaml: "ВключатьСправкуВСодержание",
      type: "boolean",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: properties,
    },
    chartOfAccounts: { yaml: "ПланСчетов", type: "string", xmlParents: properties, defaultValueXMLRaw: "" },
    correspondence: {
      yaml: "Корреспонденция",
      type: "boolean",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: properties,
    },
    periodAdjustmentLength: {
      yaml: "ДлинаУточненияПериода",
      type: "number",
      defaultValueXML: 0,
      implicitValueYAML: 0,
      xmlParents: properties,
    },
    defaultListForm: {
      yaml: "ОсновнаяФормаСписка",
      type: "string",
      xmlParents: properties,
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"] },
      defaultValueXMLRaw: "",
    },
    auxiliaryListForm: {
      yaml: "ДополнительнаяФормаСписка",
      type: "string",
      xmlParents: properties,
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"] },
      defaultValueXMLRaw: "",
    },
    standardAttributes: {
      yaml: "СтандартныеРеквизиты",
      type: "StandardAttributeDescriptions",
      standartAttributeNames: MetadataAccountingRegisterStandardAttributeNames,
      standartAttributeNamesXML: MetadataAccountingRegisterStandardAttributeNamesXML,
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
    enableTotalsSplitting: {
      yaml: "РазрешитьРазделениеИтогов",
      type: "boolean",
      defaultValueXML: true,
      implicitValueYAML: true,
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
    listPresentation: { yaml: "ПредставлениеСписка", type: "I8nText", xmlParents: properties, defaultValueXMLRaw: "" },
    extendedListPresentation: {
      yaml: "РасширенноеПредставлениеСписка",
      type: "I8nText",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    },
    explanation: { yaml: "Пояснение", type: "I8nText", xmlParents: properties, defaultValueXMLRaw: "" },
    objectBelonging: {
      yaml: "ПринадлежностьОбъекта",
      type: "SystemEnumeration",
      typeSE: "ObjectBelonging",
      xmlParents: properties,
      toYAML: false,
      fromYAML: false,
      implicitValueYAML: "Native",
    },
    extendedConfigurationObject: { type: "string", runtimeOnly: true },
    dimensions: { yaml: "Измерения", xml: "Dimension", type: "MetadataRegisterDimensions", xmlParents: childObjects },
    resources: { yaml: "Ресурсы", xml: "Resource", type: "MetadataRegisterResources", xmlParents: childObjects },
    attributes: { yaml: "Реквизиты", xml: "Attribute", type: "MetadataRegisterAttributes", xmlParents: childObjects },
    forms: {
      yaml: "Формы",
      xml: "Form",
      type: "ChildFormNames",
      xmlParents: childObjects,
      folderName: "Формы",
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    },
    templates: {
      yaml: "Макеты",
      xml: "Template",
      type: "ChildTemplateNames",
      xmlParents: childObjects,
      folderName: "Макеты",
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    },
    commands: { yaml: "Команды", xml: "Command", type: "MetadataCommands", xmlParents: childObjects },
    recordSetModule: {
      type: "Module",
      nkdkPath: "МодульНабораЗаписей.bsl",
      xmlPath: "Ext/RecordSetModule.bsl",
      toXML: false,
      fromXML: false,
    },
    managerModule: {
      type: "Module",
      nkdkPath: "МодульМенеджера.bsl",
      xmlPath: "Ext/ManagerModule.bsl",
      toXML: false,
      fromXML: false,
    },
    additionalIndexes: { yaml: "ДополнительныеИндексы", type: "AdditionalIndex", filePath: "Ext/AdditionalIndexes.xml" },
    help: { type: "Help", filePath: "Ext/Help.xml", xmlPath: "Ext/Help.xml", nkdkDir: "Справка", toXML: false, fromXML: false },
  },
  childCollections: [{ propertyKey: "commands", itemRule: MetadataAccountingRegisterCommandRules }],
} as const satisfies MetadataItemRule
