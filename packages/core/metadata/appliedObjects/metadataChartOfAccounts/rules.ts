import { additionalIndexRule, metadataCommandsRule } from "../metadataAccountingRegister/builders"
import {
  accountingFlagsRule,
  extDimensionAccountingFlagsRule,
  metadataChartOfAccountsTabularSectionsRule,
} from "./builders"
import { metadataAttributesRule } from "../metadataDataProcessor/builders"
import { characteristicsDescriptionsRule } from "../../commonObjects/characteristicsDescription/types"
import { childFormNamesRule } from "../../commonObjects/childFormNames/types"
import { childTemplateNamesRule } from "../../commonObjects/childTemplateNames/types"
import { helpRule } from "../../commonObjects/help/types"
import { internalInfoRule } from "../../commonObjects/internalInfo/types"
import { metadataFieldsRule } from "../../commonObjects/metadataField/types"
import { metadataItemLinksRule } from "../../commonObjects/metadataPath/types"
import { predefinedRule } from "../../commonObjects/predefined/builders"
import { standardAttributeDescriptionsRule } from "../../commonObjects/standardAttributeDescription/builders"
import { standardTabularSectionDescriptionsRule } from "../../commonObjects/standardTabularSectionDescription/builders"
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
export const MetadataChartOfAccountsStandardAttributeNames: Record<string, string> = {
  PredefinedDataName: "ИмяПредопределенныхДанных",
  Order: "Порядок",
  OffBalance: "Забалансовый",
  Type: "Вид",
  Description: "Наименование",
  Code: "Код",
  Parent: "Родитель",
  Predefined: "Предопределенный",
  DeletionMark: "ПометкаУдаления",
  Ref: "Ссылка",
}
const MetadataChartOfAccountsCommandRules = {
  ...MetadataCommandRules,
  properties: {
    ...MetadataCommandRules.properties,
    commandModule: {
      ...MetadataCommandRules.properties.commandModule,
      xmlPath: ({ name }: { name: string }) => `Commands/${name}/Ext/CommandModule.bsl`,
    },
  },
} as const satisfies MetadataItemRule
export const MetadataChartOfAccountsRules = {
  itemType: "MetadataChartOfAccounts",
  metadataTargetOwner: { kind: "self", root: "ChartOfAccounts" },
  itemTypePrefix: "ПланСчетов",
  xmlDir: "ChartsOfAccounts",
  uniqueNameScopes: [{ collections: ["attributes", "tabularSections"] }],
  properties: {
    xmlRoot: xmlRootRule({
      container: "ChartOfAccounts",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    }),
    internalInfo: internalInfoRule({
      xmlParents: [],
      forReferenceOnly: true,
      items: [
        { name: "ChartOfAccountsObject", category: "Object" },
        { name: "ChartOfAccountsRef", category: "Ref" },
        { name: "ChartOfAccountsSelection", category: "Selection" },
        { name: "ChartOfAccountsList", category: "List" },
        { name: "ChartOfAccountsManager", category: "Manager" },
        { name: "ChartOfAccountsExtDimensionTypes", category: "ExtDimensionTypes" },
        { name: "ChartOfAccountsExtDimensionTypesRow", category: "ExtDimensionTypesRow" },
      ],
    }),
    uuid: uuidRule({ xml: "_uuid", forReferenceOnly: true, xmlParents: [] }),
    name: stringRule({ xmlParents: properties, required: true, defaultValue: ({ name }: { name?: string }) => name }),
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
    basedOn: metadataItemLinksRule({
      yaml: "ВводитсяНаОсновании",
      metadataTarget: { kind: "object", allowedObjectPaths: commonBasedOnObjectPaths },
      xmlParents: properties,
      defaultValueXMLRaw: {},
    }),
    extDimensionTypes: stringRule({ yaml: "ВидыСубконто", xmlParents: properties, defaultValueXMLRaw: "" }),
    maxExtDimensionCount: numberRule({
      yaml: "МаксКоличествоСубконто",
      defaultValueXML: 0,
      implicitValueYAML: 0,
      xmlParents: properties,
    }),
    codeMask: stringRule({ yaml: "МаскаКода", xmlParents: properties, defaultValueXMLRaw: "" }),
    codeLength: numberRule({ yaml: "ДлинаКода", defaultValueXML: 9, implicitValueYAML: 9, xmlParents: properties }),
    descriptionLength: numberRule({
      yaml: "ДлинаНаименования",
      defaultValueXML: 25,
      implicitValueYAML: 25,
      xmlParents: properties,
    }),
    codeSeries: systemEnumerationRule({
      yaml: "СерииКодов",
      typeSE: "CharOfAccountCodeSeries",
      defaultValueXML: "WholeChartOfAccounts",
      implicitValueYAML: "WholeChartOfAccounts",
      xmlParents: properties,
    }),
    checkUnique: booleanRule({
      yaml: "КонтрольУникальности",
      defaultValueXML: true,
      implicitValueYAML: true,
      xmlParents: properties,
    }),
    defaultPresentation: systemEnumerationRule({
      yaml: "ОсновноеПредставление",
      typeSE: "AccountMainPresentation",
      defaultValueXML: "AsCode",
      implicitValueYAML: "AsCode",
      xmlParents: properties,
    }),
    standardAttributes: standardAttributeDescriptionsRule({
      yaml: "СтандартныеРеквизиты",
      standartAttributeNames: MetadataChartOfAccountsStandardAttributeNames,
      xmlParents: properties,
    }),
    characteristics: characteristicsDescriptionsRule({
      yaml: "Характеристики",
      xmlParents: properties,
      defaultValueXMLRaw: {},
    }),
    standardTabularSections: standardTabularSectionDescriptionsRule({
      xmlParents: properties,
      toYAML: false,
      fromYAML: false,
    }),
    predefinedDataUpdate: systemEnumerationRule({
      yaml: "ОбновлениеПредопределенныхДанных",
      typeSE: "PredefinedDataUpdate",
      defaultValueXML: "Auto",
      implicitValueYAML: "Auto",
      xmlParents: properties,
    }),
    editType: systemEnumerationRule({
      yaml: "СпособРедактирования",
      typeSE: "EditType",
      defaultValueXML: "InDialog",
      implicitValueYAML: "InDialog",
      xmlParents: properties,
    }),
    quickChoice: booleanRule({
      yaml: "БыстрыйВыбор",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: properties,
    }),
    choiceMode: systemEnumerationRule({
      yaml: "РежимВыбора",
      typeSE: "ChoiceMode",
      defaultValueXML: "BothWays",
      implicitValueYAML: "BothWays",
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
    searchStringModeOnInputByString: systemEnumerationRule({
      yaml: "РежимСтрокиПоискаПриВводеПоСтроке",
      typeSE: "SearchStringModeOnInputByString",
      defaultValueXML: "Begin",
      implicitValueYAML: "Begin",
      xmlParents: properties,
    }),
    fullTextSearchOnInputByString: systemEnumerationRule({
      yaml: "ПолнотекстовыйПоискПриВводеПоСтроке",
      typeSE: "FullTextSearchOnInputByString",
      defaultValueXML: "DontUse",
      implicitValueYAML: "DontUse",
      xmlParents: properties,
    }),
    choiceDataGetModeOnInputByString: systemEnumerationRule({
      yaml: "РежимПолученияДанныхВыбораПриВводеПоСтроке",
      typeSE: "ChoiceDataGetModeOnInputByString",
      defaultValueXML: "Directly",
      implicitValueYAML: "Directly",
      xmlParents: properties,
    }),
    createOnInput: systemEnumerationRule({
      yaml: "СозданиеПриВводе",
      typeSE: "CreateOnInput",
      defaultValueXML: "DontUse",
      implicitValueYAML: "DontUse",
      xmlParents: properties,
    }),
    choiceHistoryOnInput: systemEnumerationRule({
      yaml: "ИсторияВыбораПриВводе",
      typeSE: "ChoiceHistoryOnInput",
      defaultValueXML: "Auto",
      implicitValueYAML: "Auto",
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
    autoOrderByCode: booleanRule({
      yaml: "АвтоПорядокПоКоду",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: properties,
    }),
    orderLength: numberRule({ yaml: "ДлинаПорядка", defaultValueXML: 0, implicitValueYAML: 0, xmlParents: properties }),
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
    fullTextSearch: systemEnumerationRule({
      yaml: "ПолнотекстовыйПоиск",
      typeSE: "UseFullTextSearch",
      defaultValueXML: "Use",
      implicitValueYAML: "Use",
      xmlParents: properties,
    }),
    dataHistory: systemEnumerationRule({
      yaml: "ИсторияДанных",
      typeSE: "DataHistoryUse",
      defaultValueXML: "DontUse",
      implicitValueYAML: "DontUse",
      xmlParents: properties,
    }),
    objectPresentation: i8nTextRule({ yaml: "ПредставлениеОбъекта", xmlParents: properties, defaultValueXMLRaw: "" }),
    extendedObjectPresentation: i8nTextRule({
      yaml: "РасширенноеПредставлениеОбъекта",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
    listPresentation: i8nTextRule({ yaml: "ПредставлениеСписка", xmlParents: properties, defaultValueXMLRaw: "" }),
    extendedListPresentation: i8nTextRule({
      yaml: "РасширенноеПредставлениеСписка",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
    explanation: i8nTextRule({ yaml: "Пояснение", xmlParents: properties, defaultValueXMLRaw: "" }),
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
    extendedConfigurationObject: stringRule({ runtimeOnly: true }),
    attributes: metadataAttributesRule({ yaml: "Реквизиты", xml: "Attribute", xmlParents: childObjects }),
    tabularSections: metadataChartOfAccountsTabularSectionsRule({
      yaml: "ТабличныеЧасти",
      xml: "TabularSection",
      xmlParents: childObjects,
    }),
    accountingFlags: accountingFlagsRule({
      yaml: "ПризнакиУчета",
      xml: "AccountingFlag",
      xmlParents: childObjects,
    }),
    extDimensionAccountingFlags: extDimensionAccountingFlagsRule({
      yaml: "ПризнакиУчетаСубконто",
      xml: "ExtDimensionAccountingFlag",
      xmlParents: childObjects,
    }),
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
    predefined: predefinedRule({ yaml: "Предопределенные", filePath: "Ext/Predefined.xml" }),
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
  childCollections: [{ propertyKey: "commands", itemRule: MetadataChartOfAccountsCommandRules }],
} as const satisfies MetadataItemRule
