import { additionalIndexRule, metadataCommandsRule } from "../metadataAccountingRegister/builders"
import { metadataBusinessProcessTabularSectionsRule } from "./builders"
import { metadataAttributesRule } from "../metadataDataProcessor/builders"
import { characteristicsDescriptionsRule } from "../../commonObjects/characteristicsDescription/types"
import { childFormNamesRule } from "../../commonObjects/childFormNames/types"
import { childTemplateNamesRule } from "../../commonObjects/childTemplateNames/types"
import { helpRule } from "../../commonObjects/help/types"
import { internalInfoRule } from "../../commonObjects/internalInfo/types"
import { metadataFieldsRule } from "../../commonObjects/metadataField/types"
import { metadataItemLinksRule } from "../../commonObjects/metadataPath/types"
import { templateRule } from "../../commonObjects/module/types"
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
import { commonBasedOnObjectPaths } from "../../commonObjects/metadataTargets"
import { MetadataCommandRules } from "../metadataCommand/rules"
const properties = ["Properties"]
const childObjects = ["ChildObjects"]
export const MetadataBusinessProcessStandardAttributeNames: Record<string, string> = {
  Started: "Стартован",
  HeadTask: "ГоловнаяЗадача",
  Completed: "Завершен",
  Ref: "Ссылка",
  DeletionMark: "ПометкаУдаления",
  Date: "Дата",
  Number: "Номер",
}
export const MetadataBusinessProcessRules = {
  itemType: "MetadataBusinessProcess",
  metadataTargetOwner: { kind: "self", root: "BusinessProcess" },
  itemTypePrefix: "БизнесПроцесс",
  xmlDir: "BusinessProcesses",
  uniqueNameScopes: [{ collections: ["attributes", "tabularSections"] }],
  properties: {
    xmlRoot: xmlRootRule({
      container: "BusinessProcess",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    }),
    internalInfo: internalInfoRule({
      xmlParents: [],
      forReferenceOnly: true,
      items: [
        { name: "BusinessProcessObject", category: "Object" },
        { name: "BusinessProcessRef", category: "Ref" },
        { name: "BusinessProcessSelection", category: "Selection" },
        { name: "BusinessProcessList", category: "List" },
        { name: "BusinessProcessManager", category: "Manager" },
        { name: "BusinessProcessRoutePointRef", category: "RoutePointRef" },
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
    inputByString: metadataFieldsRule({
      yaml: "ВводПоСтроке",
      metadataTarget: {
        kind: "member",
        owner: "this",
        memberKinds: ["Attribute", "StandardAttribute"],
        filters: [{ kind: "inputByStringField" }],
      },
      xmlParents: properties,
      defaultValueXMLRaw: {},
    }),
    createOnInput: systemEnumerationRule({
      yaml: "СозданиеПриВводе",
      typeSE: "CreateOnInput",
      defaultValueXML: "DontUse",
      implicitValueYAML: "DontUse",
      xmlParents: properties,
    }),
    searchStringModeOnInputByString: systemEnumerationRule({
      yaml: "РежимСтрокиПоискаПриВводеПоСтроке",
      typeSE: "SearchStringModeOnInputByString",
      defaultValueXML: "Begin",
      implicitValueYAML: "Begin",
      xmlParents: properties,
    }),
    choiceDataGetModeOnInputByString: systemEnumerationRule({
      yaml: "РежимПолученияДанныхВыбораПриВводеПоСтроке",
      typeSE: "ChoiceDataGetModeOnInputByString",
      defaultValueXML: "Directly",
      implicitValueYAML: "Directly",
      xmlParents: properties,
    }),
    fullTextSearchOnInputByString: systemEnumerationRule({
      yaml: "ПолнотекстовыйПоискПриВводеПоСтроке",
      typeSE: "FullTextSearchOnInputByString",
      defaultValueXML: "DontUse",
      implicitValueYAML: "DontUse",
      xmlParents: properties,
    }),
    defaultObjectForm: stringRule({
      yaml: "ОсновнаяФормаОбъекта",
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
    defaultChoiceForm: stringRule({
      yaml: "ОсновнаяФормаВыбора",
      xmlParents: properties,
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
    }),
    auxiliaryObjectForm: stringRule({
      yaml: "ДополнительнаяФормаОбъекта",
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
    auxiliaryChoiceForm: stringRule({
      yaml: "ДополнительнаяФормаВыбора",
      xmlParents: properties,
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
    }),
    choiceHistoryOnInput: systemEnumerationRule({
      yaml: "ИсторияВыбораПриВводе",
      typeSE: "ChoiceHistoryOnInput",
      defaultValueXML: "Auto",
      implicitValueYAML: "Auto",
      xmlParents: properties,
    }),
    numberType: systemEnumerationRule({
      yaml: "ТипНомера",
      typeSE: "BusinessProcessNumberType",
      defaultValueXML: "String",
      implicitValueYAML: "String",
      xmlParents: properties,
    }),
    numberLength: numberRule({
      yaml: "ДлинаНомера",
      defaultValueXML: 9,
      implicitValueYAML: 9,
      xmlParents: properties,
    }),
    numberAllowedLength: systemEnumerationRule({
      yaml: "ДопустимаяДлинаНомера",
      typeSE: "AllowedLength",
      defaultValueXML: "Variable",
      implicitValueYAML: "Variable",
      xmlParents: properties,
    }),
    checkUnique: booleanRule({
      yaml: "КонтрольУникальности",
      defaultValueXML: true,
      implicitValueYAML: true,
      xmlParents: properties,
    }),
    standardAttributes: standardAttributeDescriptionsRule({
      yaml: "СтандартныеРеквизиты",
      standartAttributeNames: MetadataBusinessProcessStandardAttributeNames,
      xmlParents: properties,
    }),
    characteristics: characteristicsDescriptionsRule({
      yaml: "Характеристики",
      xmlParents: properties,
      defaultValueXMLRaw: {},
    }),
    autonumbering: booleanRule({
      yaml: "Автонумерация",
      defaultValueXML: true,
      implicitValueYAML: true,
      xmlParents: properties,
    }),
    basedOn: metadataItemLinksRule({
      yaml: "ВводитсяНаОсновании",
      metadataTarget: { kind: "object", allowedObjectPaths: commonBasedOnObjectPaths },
      xmlParents: properties,
      defaultValueXMLRaw: {},
    }),
    numberPeriodicity: systemEnumerationRule({
      yaml: "ПериодичностьНомера",
      typeSE: "BusinessProcessNumberPeriodicity",
      defaultValueXML: "Nonperiodical",
      implicitValueYAML: "Nonperiodical",
      xmlParents: properties,
    }),
    task: stringRule({
      yaml: "Задача",
      xml: "Task",
      xmlParents: properties,
      metadataTarget: { kind: "object", roots: ["Task"] },
    }),
    createTaskInPrivilegedMode: booleanRule({
      yaml: "ПривилегированныйРежимПриСозданииЗадач",
      defaultValueXML: true,
      implicitValueYAML: true,
      xmlParents: properties,
    }),
    dataLockFields: metadataFieldsRule({
      yaml: "ПоляБлокировкиДанных",
      xmlParents: properties,
      defaultValueXMLRaw: {},
    }),
    dataLockControlMode: systemEnumerationRule({
      yaml: "РежимУправленияБлокировкойДанных",
      typeSE: "DefaultDataLockControlMode",
      defaultValueXML: "Managed",
      implicitValueYAML: "Managed",
      xmlParents: properties,
    }),
    includeHelpInContents: booleanRule({
      yaml: "ВключатьСправкуВСодержание",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: properties,
    }),
    fullTextSearch: systemEnumerationRule({
      yaml: "ПолнотекстовыйПоиск",
      typeSE: "UseFullTextSearch",
      defaultValueXML: "Use",
      implicitValueYAML: "Use",
      xmlParents: properties,
    }),
    objectPresentation: i8nTextRule({
      yaml: "ПредставлениеОбъекта",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
    extendedObjectPresentation: i8nTextRule({
      yaml: "РасширенноеПредставлениеОбъекта",
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
      implicitValueYAML: "Native",
      toYAML: false,
      fromYAML: false,
      xmlParents: properties,
    }),
    extendedConfigurationObject: stringRule({
      yaml: "ОбъектРасширяемойКонфигурации",
      runtimeOnly: true,
    }),
    attributes: metadataAttributesRule({
      yaml: "Реквизиты",
      xml: "Attribute",
      xmlParents: childObjects,
    }),
    tabularSections: metadataBusinessProcessTabularSectionsRule({
      yaml: "ТабличныеЧасти",
      xml: "TabularSection",
      xmlParents: childObjects,
    }),
    forms: childFormNamesRule({
      yaml: "Формы",
      xml: "Form",
      xmlParents: childObjects,
      folderName: "Формы",
      forReferenceOnly: true,
    }),
    templates: childTemplateNamesRule({
      yaml: "Макеты",
      xml: "Template",
      xmlParents: childObjects,
      folderName: "Макеты",
      forReferenceOnly: true,
    }),
    commands: metadataCommandsRule({
      yaml: "Команды",
      xml: "Command",
      xmlParents: childObjects,
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
    flowchart: templateRule({
      nkdkPath: "Flowchart.xml",
      xmlPath: "Ext/Flowchart.xml",
      toXML: false,
      fromXML: false,
    }),
    objectModule: moduleRule({
      externalMetadata: { segment: "ObjectModule", placement: "derivedEntry" },
      nkdkPath: "МодульОбъекта.bsl",
      xmlPath: "Ext/ObjectModule.bsl",
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
  },
  childCollections: [
    { propertyKey: "commands", configurationIndexUidSegment: "Команда", itemRule: MetadataCommandRules },
  ],
} as const satisfies MetadataItemRule
