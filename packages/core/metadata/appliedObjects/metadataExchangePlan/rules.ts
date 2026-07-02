import {
  additionalIndexRule,
  metadataCommandsRule,
} from "~/metadata/appliedObjects/metadataAccountingRegister/builders"
import { metadataAttributesRule } from "~/metadata/appliedObjects/metadataDataProcessor/builders"
import {
  exchangePlanContentRule,
  metadataExchangePlanTabularSectionsRule,
} from "~/metadata/appliedObjects/metadataExchangePlan/builders"
import { characteristicsDescriptionsRule } from "~/metadata/commonObjects/characteristicsDescription/types"
import { childFormNamesRule } from "~/metadata/commonObjects/childFormNames/types"
import { childTemplateNamesRule } from "~/metadata/commonObjects/childTemplateNames/types"
import { helpRule } from "~/metadata/commonObjects/help/types"
import { internalInfoRule } from "~/metadata/commonObjects/internalInfo/types"
import { metadataFieldsRule } from "~/metadata/commonObjects/metadataField/types"
import { metadataItemLinksRule } from "~/metadata/commonObjects/metadataPath/types"
import { standardAttributeDescriptionsRule } from "~/metadata/commonObjects/standardAttributeDescription/builders"
import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { i8nTextRule } from "~/metadata/commonObjects/i8nText/types"
import { moduleRule } from "~/metadata/commonObjects/module/types"
import { numberRule } from "~/metadata/commonObjects/number/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { uuidRule } from "~/metadata/commonObjects/uuid/types"
import { xmlRootRule } from "~/metadata/commonObjects/xmlRoot/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
import { commonBasedOnObjectPaths } from "~/metadata/commonObjects/metadataTargets"
import { MetadataCommandRules } from "../metadataCommand/rules"
const properties = ["Properties"]
const childObjects = ["ChildObjects"]
const emptyCollection: [] = []
export const MetadataExchangePlanStandardAttributeNames: Record<string, string> = {
  ExchangeDate: "ДатаОбмена",
  ThisNode: "ЭтотУзел",
  ReceivedNo: "НомерПринятого",
  SentNo: "НомерОтправленного",
  Ref: "Ссылка",
  DeletionMark: "ПометкаУдаления",
  Description: "Наименование",
  Code: "Код",
}
const MetadataExchangePlanCommandRules = {
  ...MetadataCommandRules,
  properties: {
    ...MetadataCommandRules.properties,
    commandModule: {
      ...MetadataCommandRules.properties.commandModule,
      xmlPath: ({ name }: { name: string }) => `Commands/${name}/Ext/CommandModule.bsl`,
    },
  },
} as const satisfies MetadataItemRule
export const MetadataExchangePlanRules = {
  itemType: "MetadataExchangePlan",
  metadataTargetOwner: { kind: "self", root: "ExchangePlan" },
  itemTypePrefix: "ПланОбмена",
  xmlDir: "ExchangePlans",
  uniqueNameScopes: [{ collections: ["attributes", "tabularSections"] }],
  properties: {
    xmlRoot: xmlRootRule({
      container: "ExchangePlan",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    }),
    internalInfo: internalInfoRule({
      xmlParents: [],
      forReferenceOnly: true,
      thisNode: true,
      items: [
        { name: "ExchangePlanObject", category: "Object" },
        { name: "ExchangePlanRef", category: "Ref" },
        { name: "ExchangePlanSelection", category: "Selection" },
        { name: "ExchangePlanList", category: "List" },
        { name: "ExchangePlanManager", category: "Manager" },
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
    codeLength: numberRule({
      yaml: "ДлинаКода",
      defaultValueXML: 9,
      implicitValueYAML: 9,
      xmlParents: properties,
    }),
    codeAllowedLength: systemEnumerationRule({
      yaml: "ДопустимаяДлинаКода",
      typeSE: "AllowedLength",
      defaultValueXML: "Variable",
      implicitValueYAML: "Variable",
      xmlParents: properties,
    }),
    descriptionLength: numberRule({
      yaml: "ДлинаНаименования",
      defaultValueXML: 25,
      implicitValueYAML: 25,
      xmlParents: properties,
    }),
    content: exchangePlanContentRule({
      yaml: "Состав",
      filePath: "Ext/Content.xml",
      exportReferenceFileOnMissingValue: true,
    }),
    defaultPresentation: systemEnumerationRule({
      yaml: "ОсновноеПредставление",
      typeSE: "DataExchangeMainPresentation",
      defaultValueXML: "AsDescription",
      implicitValueYAML: "AsDescription",
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
        filters: [{ kind: "stringIndexedAttribute" }],
      },
      xmlParents: properties,
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
    standardAttributes: standardAttributeDescriptionsRule({
      yaml: "СтандартныеРеквизиты",
      standartAttributeNames: MetadataExchangePlanStandardAttributeNames,
      xmlParents: properties,
    }),
    characteristics: characteristicsDescriptionsRule({
      yaml: "Характеристики",
      xmlParents: properties,
      defaultValue: emptyCollection,
      defaultValueXMLEmpty: emptyCollection,
      defaultValueXMLRaw: "",
    }),
    basedOn: metadataItemLinksRule({
      yaml: "ОснованНа",
      metadataTarget: { kind: "object", allowedObjectPaths: commonBasedOnObjectPaths },
      xmlParents: properties,
      defaultValue: emptyCollection,
      defaultValueXMLEmpty: emptyCollection,
      defaultValueXMLRaw: "",
    }),
    distributedInfoBase: booleanRule({
      yaml: "РаспределеннаяИнформационнаяБаза",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: properties,
    }),
    includeConfigurationExtensions: booleanRule({
      yaml: "ВключатьРасширенияКонфигурации",
      defaultValueXML: false,
      implicitValueYAML: false,
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
    includeHelpInContents: booleanRule({
      yaml: "ВключатьСправкуВСодержание",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: properties,
    }),
    dataLockFields: metadataFieldsRule({
      yaml: "ПоляБлокировкиДанных",
      metadataTarget: { kind: "member", owner: "this" },
      xmlParents: properties,
      defaultValue: emptyCollection,
      defaultValueXMLEmpty: emptyCollection,
      defaultValueXMLRaw: "",
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
      xmlParents: properties,
      toYAML: false,
      fromYAML: false,
      implicitValueYAML: "Native",
    }),
    extendedConfigurationObject: stringRule({
      yaml: "ОбъектРасширяемойКонфигурации",
      runtimeOnly: true,
    }),
    attributes: metadataAttributesRule({
      yaml: "Реквизиты",
      xmlParents: childObjects,
      xml: "Attribute",
    }),
    tabularSections: metadataExchangePlanTabularSectionsRule({
      yaml: "ТабличныеЧасти",
      xmlParents: childObjects,
      xml: "TabularSection",
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
    help: helpRule({
      externalMetadata: { segment: "Help", placement: "derivedEntry" },
      filePath: "Ext/Help.xml",
      nkdkDir: "Справка",
    }),
  },
  childCollections: [{ propertyKey: "commands", itemRule: MetadataExchangePlanCommandRules }],
} as const satisfies MetadataItemRule
