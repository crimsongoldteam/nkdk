import {
  additionalIndexRule,
  metadataCommandsRule,
  metadataRegisterAttributesRule,
  metadataRegisterDimensionsRule,
  metadataRegisterResourcesRule,
} from "../metadataAccountingRegister/builders"
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
export const MetadataInformationRegisterStandardAttributeNames: Record<string, string> = {
  Active: "Активность",
  LineNumber: "НомерСтроки",
  Recorder: "Регистратор",
  Period: "Период",
}
const MetadataInformationRegisterCommandRules = {
  ...MetadataCommandRules,
  properties: {
    ...MetadataCommandRules.properties,
    commandModule: {
      ...MetadataCommandRules.properties.commandModule,
      xmlPath: ({ name }: { name: string }) => `Commands/${name}/Ext/CommandModule.bsl`,
    },
  },
} as const satisfies MetadataItemRule
export const MetadataInformationRegisterRules = {
  itemType: "MetadataInformationRegister",
  metadataTargetOwner: { kind: "self", root: "InformationRegister" },
  itemTypePrefix: "РегистрСведений",
  xmlDir: "InformationRegisters",
  uniqueNameScopes: [{ collections: ["attributes", "dimensions", "resources"] }],
  properties: {
    xmlRoot: xmlRootRule({
      container: "InformationRegister",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    }),
    internalInfo: internalInfoRule({
      xmlParents: [],
      forReferenceOnly: true,
      items: [
        { name: "InformationRegisterRecord", category: "Record" },
        { name: "InformationRegisterManager", category: "Manager" },
        { name: "InformationRegisterSelection", category: "Selection" },
        { name: "InformationRegisterList", category: "List" },
        { name: "InformationRegisterRecordSet", category: "RecordSet" },
        { name: "InformationRegisterRecordKey", category: "RecordKey" },
        { name: "InformationRegisterRecordManager", category: "RecordManager" },
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
    editType: systemEnumerationRule({
      yaml: "СпособРедактирования",
      typeSE: "EditType",
      defaultValueXML: "InDialog",
      implicitValueYAML: "InDialog",
      xmlParents: properties,
    }),
    defaultRecordForm: stringRule({
      yaml: "ОсновнаяФормаЗаписи",
      xmlParents: properties,
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
    }),
    defaultListForm: stringRule({
      yaml: "ОсновнаяФормаСписка",
      xmlParents: properties,
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
    }),
    auxiliaryRecordForm: stringRule({
      yaml: "ДополнительнаяФормаЗаписи",
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
      standartAttributeNames: MetadataInformationRegisterStandardAttributeNames,
      xmlParents: properties,
    }),
    informationRegisterPeriodicity: systemEnumerationRule({
      yaml: "Периодичность",
      typeSE: "InformationRegisterPeriodicity",
      defaultValueXML: "Nonperiodical",
      implicitValueYAML: "Nonperiodical",
      xmlParents: properties,
    }),
    writeMode: systemEnumerationRule({
      yaml: "РежимЗаписи",
      typeSE: "RegisterWriteMode",
      defaultValueXML: "Independent",
      implicitValueYAML: "Independent",
      xmlParents: properties,
    }),
    mainFilterOnPeriod: booleanRule({
      yaml: "ОсновнойОтборПоПериоду",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: properties,
    }),
    includeHelpInContents: booleanRule({
      yaml: "ВключатьСправкуВСодержание",
      defaultValueXML: false,
      implicitValueYAML: false,
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
    enableTotalsSliceFirst: booleanRule({
      yaml: "ВключатьИтогиСрезПервых",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: properties,
    }),
    enableTotalsSliceLast: booleanRule({
      yaml: "ВключатьИтогиСрезПоследних",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: properties,
    }),
    recordPresentation: i8nTextRule({
      yaml: "ПредставлениеЗаписи",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
    extendedRecordPresentation: i8nTextRule({
      yaml: "РасширенноеПредставлениеЗаписи",
      xmlParents: properties,
      defaultValueXMLRaw: "",
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
    dataHistory: systemEnumerationRule({
      yaml: "ИсторияДанных",
      typeSE: "DataHistoryUse",
      defaultValueXML: "DontUse",
      implicitValueYAML: "DontUse",
      xmlParents: properties,
    }),
    updateDataHistoryImmediatelyAfterWrite: booleanRule({
      yaml: "ОбновлятьИсториюДанныхСразуПослеЗаписи",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: properties,
    }),
    executeAfterWriteDataHistoryVersionProcessing: booleanRule({
      yaml: "ВыполнятьОбработкуПослеЗаписиВерсииИсторииДанных",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: properties,
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
  childCollections: [{ propertyKey: "commands", itemRule: MetadataInformationRegisterCommandRules }],
} as const satisfies MetadataItemRule
