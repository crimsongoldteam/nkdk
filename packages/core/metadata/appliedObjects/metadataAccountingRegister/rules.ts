import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { i8nTextRule } from "~/metadata/commonObjects/i8nText/types"
import { moduleRule } from "~/metadata/commonObjects/module/types"
import { numberRule } from "~/metadata/commonObjects/number/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { uuidRule } from "~/metadata/commonObjects/uuid/types"
import { xmlRootRule } from "~/metadata/commonObjects/xmlRoot/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
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
  const item =
    metadataItem && typeof metadataItem === "object"
      ? (metadataItem as {
          standardAttributes?: unknown
        })
      : {}
  const standardAttributes = Array.isArray(item.standardAttributes) ? item.standardAttributes : []
  const explicitExtDimensions = new Set(
    standardAttributes
      .map((attribute) =>
        attribute && typeof attribute === "object"
          ? (
              attribute as {
                name?: unknown
              }
            ).name
          : undefined
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
  metadataTargetOwner: { kind: "self", root: "AccountingRegister" },
  itemTypePrefix: "РегистрБухгалтерии",
  xmlDir: "AccountingRegisters",
  uniqueNameScopes: [{ collections: ["attributes", "dimensions", "resources"] }],
  properties: {
    xmlRoot: xmlRootRule({
      container: "AccountingRegister",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    }),
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
    uuid: uuidRule({ xml: "_uuid", forReferenceOnly: true, xmlParents: [] }),
    name: stringRule({
      xmlParents: properties,
      required: true,
      defaultValue: ({ name }: { name?: string }) => name,
    }),
    synonym: i8nTextRule({ yaml: "Синоним", xmlParents: properties, defaultValueXMLRaw: "" }),
    comment: stringRule({ yaml: "Комментарий", xmlParents: properties, defaultValueXMLRaw: "" }),
    useStandardCommands: booleanRule({
      yaml: "ИспользоватьСтандартныеКоманды",
      defaultValueXML: true,
      implicitValueYAML: true,
      xmlParents: properties,
    }),
    includeHelpInContents: booleanRule({
      yaml: "ВключатьСправкуВСодержание",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: properties,
    }),
    chartOfAccounts: stringRule({ yaml: "ПланСчетов", xmlParents: properties, defaultValueXMLRaw: "" }),
    correspondence: booleanRule({
      yaml: "Корреспонденция",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: properties,
    }),
    periodAdjustmentLength: numberRule({
      yaml: "ДлинаУточненияПериода",
      defaultValueXML: 0,
      implicitValueYAML: 0,
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
    standardAttributes: {
      yaml: "СтандартныеРеквизиты",
      type: "StandardAttributeDescriptions",
      standartAttributeNames: MetadataAccountingRegisterStandardAttributeNames,
      standartAttributeNamesXML: MetadataAccountingRegisterStandardAttributeNamesXML,
      xmlParents: properties,
    },
    dataLockControlMode: systemEnumerationRule({
      yaml: "РежимУправленияБлокировкойДанных",
      typeSE: "DefaultDataLockControlMode",
      defaultValueXML: "Managed",
      implicitValueYAML: "Managed",
      xmlParents: properties,
    }),
    enableTotalsSplitting: booleanRule({
      yaml: "РазрешитьРазделениеИтогов",
      defaultValueXML: true,
      implicitValueYAML: true,
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
    additionalIndexes: {
      yaml: "ДополнительныеИндексы",
      type: "AdditionalIndex",
      filePath: "Ext/AdditionalIndexes.xml",
    },
    help: {
      type: "Help",
      externalMetadata: { segment: "Help", placement: "derivedEntry" },
      filePath: "Ext/Help.xml",
      xmlPath: "Ext/Help.xml",
      nkdkDir: "Справка",
      toXML: false,
      fromXML: false,
    },
  },
  childCollections: [{ propertyKey: "commands", itemRule: MetadataAccountingRegisterCommandRules }],
} as const satisfies MetadataItemRule
