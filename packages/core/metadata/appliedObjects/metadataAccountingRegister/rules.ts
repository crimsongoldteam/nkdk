import {
  additionalIndexRule,
  metadataCommandsRule,
  metadataRegisterAttributesRule,
  metadataRegisterDimensionsRule,
  metadataRegisterResourcesRule,
} from "./builders"
import { childFormNamesRule } from "../../commonObjects/childFormNames/types"
import { childTemplateNamesRule } from "../../commonObjects/childTemplateNames/types"
import { helpRule } from "../../commonObjects/help/types"
import { internalInfoRule } from "../../commonObjects/internalInfo/types"
import { standardAttributeDescriptionsRule } from "../../commonObjects/standardAttributeDescription/builders"
import { booleanRule } from "../../commonObjects/boolean/types"
import { i8nTextRule } from "../../commonObjects/i8nText/types"
import { moduleRule } from "../../commonObjects/module/types"
import { numberRule } from "../../commonObjects/number/types"
import { stringRule } from "../../commonObjects/string/types"
import { uuidRule } from "../../commonObjects/uuid/types"
import { xmlRootRule } from "../../commonObjects/xmlRoot/types"
import { systemEnumerationRule } from "../../systemEnumerations/types"
import { V8_MDCLASSES_ROOT } from "../../orchestration/appliedObject/presets"
import type { MetadataItemRule } from "../../orchestration/property/types"
import type { YAMLPropertySource } from "../../orchestration/property/fromYAMLToXMLTypes"
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
export const MetadataAccountingRegisterStandardAttributeNamesXML = (
  source: YAMLPropertySource | unknown
): Record<string, string> => {
  if (typeof source === "object" && source !== null && "raw" in source && typeof source.raw === "function") {
    const standardAttributes = source.raw("standardAttributes")
    const yamlNames =
      standardAttributes !== null && typeof standardAttributes === "object" && !Array.isArray(standardAttributes)
        ? new Set(Object.keys(standardAttributes))
        : new Set<string>()
    return Object.fromEntries(
      Object.entries(MetadataAccountingRegisterStandardAttributeNames).filter(
        ([name, yamlName]) => !extDimensionStandardAttributeName.test(name) || yamlNames.has(yamlName)
      )
    )
  }
  const item =
    source && typeof source === "object"
      ? (source as {
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
    internalInfo: internalInfoRule({
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
    includeHelpInContents: booleanRule({
      yaml: "ВключатьСправкуВСодержание",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: properties,
    }),
    chartOfAccounts: stringRule({
      yaml: "ПланСчетов",
      xmlParents: properties,
      defaultValueXMLRaw: "",
      ownerFactRole: "chartOfAccounts",
    }),
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
    standardAttributes: standardAttributeDescriptionsRule({
      yaml: "СтандартныеРеквизиты",
      standartAttributeNames: MetadataAccountingRegisterStandardAttributeNames,
      standartAttributeNamesXML: MetadataAccountingRegisterStandardAttributeNamesXML,
      xmlParents: properties,
    }),
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
    dimensions: metadataRegisterDimensionsRule({ yaml: "Измерения", xml: "Dimension", xmlParents: childObjects }),
    resources: metadataRegisterResourcesRule({ yaml: "Ресурсы", xml: "Resource", xmlParents: childObjects }),
    attributes: metadataRegisterAttributesRule({ yaml: "Реквизиты", xml: "Attribute", xmlParents: childObjects }),
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
      itemRule: MetadataAccountingRegisterCommandRules,
    },
  ],
} as const satisfies MetadataItemRule
