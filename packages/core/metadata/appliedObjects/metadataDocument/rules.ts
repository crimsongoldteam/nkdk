import { additionalIndexRule, metadataCommandsRule } from "../metadataAccountingRegister/builders"
import { metadataDocumentAttributesRule, metadataDocumentTabularSectionsRule } from "./types"
import { characteristicsDescriptionsRule } from "../../commonObjects/characteristicsDescription/types"
import { childFormNamesRule } from "../../commonObjects/childFormNames/types"
import { childTemplateNamesRule } from "../../commonObjects/childTemplateNames/types"
import { helpRule } from "../../commonObjects/help/types"
import { internalInfoRule } from "../../commonObjects/internalInfo/types"
import { metadataFieldsRule } from "../../commonObjects/metadataField/types"
import { metadataItemLinksRule } from "../../commonObjects/metadataPath/types"
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
const documentProperties = ["Properties"]
const documentChildObjects = ["ChildObjects"]
export const MetadataDocumentStandardAttributeNames: Record<string, string> = {
  Posted: "Проведен",
  Ref: "Ссылка",
  DeletionMark: "ПометкаУдаления",
  Date: "Дата",
  Number: "Номер",
}
const MetadataDocumentCommandRules = {
  ...MetadataCommandRules,
  properties: {
    ...MetadataCommandRules.properties,
    commandModule: {
      ...MetadataCommandRules.properties.commandModule,
      xmlPath: ({ name }: { name: string }) => `Commands/${name}/Ext/CommandModule.bsl`,
    },
  },
} as const satisfies MetadataItemRule
export const MetadataDocumentRules = {
  itemType: "MetadataDocument",
  metadataTargetOwner: { kind: "self", root: "Document" },
  itemTypePrefix: "Документ",
  xmlDir: "Documents",
  uniqueNameScopes: [{ collections: ["attributes", "tabularSections"] }],
  properties: {
    xmlRoot: xmlRootRule({
      container: "Document",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    }),
    internalInfo: internalInfoRule({
      xmlParents: [],
      forReferenceOnly: true,
      items: [
        { name: "DocumentObject", category: "Object" },
        { name: "DocumentRef", category: "Ref" },
        { name: "DocumentSelection", category: "Selection" },
        { name: "DocumentList", category: "List" },
        { name: "DocumentManager", category: "Manager" },
      ],
    }),
    uuid: uuidRule({
      xml: "_uuid",
      forReferenceOnly: true,
      xmlParents: [],
    }),
    actionsWritingOnPost: systemEnumerationRule({
      yaml: "ЗаписьДвиженийПриПроведении",
      typeSE: "RegisterRecordsWritingOnPost",
      xml: "RegisterRecordsWritingOnPost",
      defaultValueXML: "WriteModified",
      implicitValueYAML: "WriteModified",
      xmlParents: documentProperties,
    }),
    additionalIndexes: additionalIndexRule({
      yaml: "ДополнительныеИндексы",
      filePath: "Ext/AdditionalIndexes.xml",
    }),
    attributes: metadataDocumentAttributesRule({
      yaml: "Реквизиты",
      xmlParents: documentChildObjects,
      xml: "Attribute",
    }),
    autonumbering: booleanRule({
      yaml: "Автонумерация",
      defaultValueXML: true,
      implicitValueYAML: true,
      xmlParents: documentProperties,
    }),
    auxiliaryChoiceForm: stringRule({
      yaml: "ДополнительнаяФормаДляВыбора",
      xmlParents: documentProperties,
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
    }),
    auxiliaryListForm: stringRule({
      yaml: "ДополнительнаяФормаСписка",
      xmlParents: documentProperties,
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
    }),
    auxiliaryObjectForm: stringRule({
      yaml: "ДополнительнаяФормаОбъекта",
      xmlParents: documentProperties,
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
    }),
    basedOn: metadataItemLinksRule({
      yaml: "ВводитсяНаОсновании",
      metadataTarget: { kind: "object", allowedObjectPaths: commonBasedOnObjectPaths },
      xmlParents: documentProperties,
      defaultValueXMLRaw: {},
    }),
    characteristics: characteristicsDescriptionsRule({
      yaml: "Характеристики",
      xmlParents: documentProperties,
      defaultValueXMLRaw: {},
    }),
    checkUnique: booleanRule({
      yaml: "КонтрольУникальности",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: documentProperties,
    }),
    choiceDataGetModeOnInputByString: systemEnumerationRule({
      yaml: "РежимПолученияДанныхВыбораПриВводеПоСтроке",
      typeSE: "ChoiceDataGetModeOnInputByString",
      defaultValueXML: "Directly",
      implicitValueYAML: "Directly",
      xmlParents: documentProperties,
    }),
    choiceHistoryOnInput: systemEnumerationRule({
      yaml: "ИсторияВыбораПриВводе",
      typeSE: "ChoiceHistoryOnInput",
      defaultValueXML: "Auto",
      implicitValueYAML: "Auto",
      xmlParents: documentProperties,
    }),
    commands: metadataCommandsRule({
      yaml: "Команды",
      xmlParents: documentChildObjects,
      xml: "Command",
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
      toXML: false,
      fromXML: false,
    }),
    forms: childFormNamesRule({
      xml: "Form",
      folderName: "Формы",
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
      xmlParents: documentChildObjects,
    }),
    templates: childTemplateNamesRule({
      xml: "Template",
      folderName: "Шаблоны",
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
      xmlParents: documentChildObjects,
    }),
    comment: stringRule({
      yaml: "Комментарий",
      xmlParents: documentProperties,
      defaultValueXMLRaw: "",
    }),
    createOnInput: systemEnumerationRule({
      yaml: "СозданиеПриВводе",
      typeSE: "CreateOnInput",
      defaultValueXML: "Use",
      implicitValueYAML: "Use",
      xmlParents: documentProperties,
    }),
    dataHistory: systemEnumerationRule({
      yaml: "ИсторияДанных",
      typeSE: "DataHistoryUse",
      defaultValueXML: "DontUse",
      implicitValueYAML: "DontUse",
      xmlParents: documentProperties,
    }),
    dataLockControlMode: systemEnumerationRule({
      yaml: "РежимУправленияБлокировкойДанных",
      typeSE: "DefaultDataLockControlMode",
      defaultValueXML: "Managed",
      implicitValueYAML: "Managed",
      xmlParents: documentProperties,
    }),
    dataLockFields: metadataFieldsRule({
      yaml: "ПоляБлокировкиДанных",
      metadataTarget: { kind: "member", owner: "this" },
      xmlParents: documentProperties,
      defaultValueXMLRaw: {},
    }),
    defaultChoiceForm: stringRule({
      yaml: "ОсновнаяФормаДляВыбора",
      xmlParents: documentProperties,
      metadataTarget: {
        kind: "member",
        owner: "this",
        memberKinds: ["Form"],
        objectRoots: ["CommonForm"],
        allowedMemberPaths: [["DocumentJournal", "Form"]],
      },
      defaultValueXMLRaw: "",
    }),
    defaultListForm: stringRule({
      yaml: "ОсновнаяФормаСписка",
      xmlParents: documentProperties,
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
    }),
    defaultObjectForm: stringRule({
      yaml: "ОсновнаяФормаОбъекта",
      xmlParents: documentProperties,
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
    }),
    executeAfterWriteDataHistoryVersionProcessing: booleanRule({
      yaml: "ВыполнятьОбработкуПослеЗаписиВерсииИсторииДанных",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: documentProperties,
    }),
    explanation: i8nTextRule({
      yaml: "Пояснение",
      xmlParents: documentProperties,
      defaultValueXMLRaw: "",
    }),
    extendedListPresentation: i8nTextRule({
      yaml: "РасширенноеПредставлениеСписка",
      xmlParents: documentProperties,
      defaultValueXMLRaw: "",
    }),
    extendedObjectPresentation: i8nTextRule({
      yaml: "РасширенноеПредставлениеОбъекта",
      xmlParents: documentProperties,
      defaultValueXMLRaw: "",
    }),
    fullTextSearch: systemEnumerationRule({
      yaml: "ПолнотекстовыйПоиск",
      typeSE: "UseFullTextSearch",
      defaultValueXML: "Use",
      implicitValueYAML: "Use",
      xmlParents: documentProperties,
    }),
    fullTextSearchOnInputByString: systemEnumerationRule({
      yaml: "ПолнотекстовыйПоискПриВводеПоСтроке",
      typeSE: "FullTextSearchOnInputByString",
      defaultValueXML: "DontUse",
      implicitValueYAML: "DontUse",
      xmlParents: documentProperties,
    }),
    includeHelpInContents: booleanRule({
      yaml: "ВключатьСправкуВСодержание",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: documentProperties,
    }),
    inputByString: metadataFieldsRule({
      yaml: "ВводПоСтроке",
      metadataTarget: {
        kind: "member",
        owner: "this",
        memberKinds: ["Attribute", "StandardAttribute"],
        filters: [{ kind: "stringIndexedAttribute" }],
      },
      xmlParents: documentProperties,
      defaultValueXMLRaw: {},
    }),
    listPresentation: i8nTextRule({
      yaml: "ПредставлениеСписка",
      xmlParents: documentProperties,
      defaultValueXMLRaw: "",
    }),
    name: stringRule({
      xmlParents: documentProperties,
      required: true,
      defaultValue: ({ name }: { name?: string }) => name,
    }),
    numberAllowedLength: systemEnumerationRule({
      yaml: "ДопустимаяДлинаНомера",
      typeSE: "AllowedLength",
      defaultValueXML: "Variable",
      xmlParents: documentProperties,
      implicitValueYAML: "Variable",
    }),
    numberLength: numberRule({
      yaml: "ДлинаНомера",
      defaultValueXML: 11,
      xmlParents: documentProperties,
      implicitValueYAML: 11,
    }),
    numberPeriodicity: systemEnumerationRule({
      yaml: "ПериодичностьНомера",
      typeSE: "BusinessProcessNumberPeriodicity",
      defaultValueXML: "Year",
      implicitValueYAML: "Year",
      xmlParents: documentProperties,
    }),
    numberType: systemEnumerationRule({
      yaml: "ТипНомера",
      typeSE: "DocumentNumberType",
      defaultValueXML: "String",
      implicitValueYAML: "String",
      xmlParents: documentProperties,
    }),
    numerator: stringRule({
      yaml: "Нумератор",
      xmlParents: documentProperties,
      metadataTarget: { kind: "object", roots: ["DocumentNumerator"] },
      defaultValueXMLRaw: "",
    }),
    objectBelonging: systemEnumerationRule({
      yaml: "ПринадлежностьОбъекта",
      typeSE: "ObjectBelonging",
      implicitValueYAML: "Native",
      toYAML: false,
      fromYAML: false,
      xmlParents: documentProperties,
    }),
    objectPresentation: i8nTextRule({
      yaml: "ПредставлениеОбъекта",
      xmlParents: documentProperties,
      defaultValueXMLRaw: "",
    }),
    posting: systemEnumerationRule({
      yaml: "Проведение",
      typeSE: "Posting",
      defaultValueXML: "Deny",
      implicitValueYAML: "Deny",
      xmlParents: documentProperties,
    }),
    privilegedPostingMode: booleanRule({
      yaml: "ПривилегированныйРежимПриПроведении",
      xml: "PostInPrivilegedMode",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: documentProperties,
    }),
    privilegedUnpostingMode: booleanRule({
      yaml: "ПривилегированныйРежимПриОтменеПроведения",
      xml: "UnpostInPrivilegedMode",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: documentProperties,
    }),
    realTimePosting: systemEnumerationRule({
      yaml: "ОперативноеПроведение",
      typeSE: "RealTimePosting",
      defaultValueXML: "Deny",
      implicitValueYAML: "Deny",
      xmlParents: documentProperties,
    }),
    registerRecords: metadataItemLinksRule({
      yaml: "Движения",
      metadataTarget: {
        kind: "object",
        roots: ["InformationRegister", "AccumulationRegister", "AccountingRegister", "CalculationRegister"],
      },
      xmlParents: documentProperties,
      defaultValueXMLRaw: {},
    }),
    registerRecordsDeletion: systemEnumerationRule({
      yaml: "УдалениеДвижений",
      typeSE: "RegisterRecordsDeletion",
      defaultValueXML: "AutoDelete",
      implicitValueYAML: "AutoDelete",
      xmlParents: documentProperties,
    }),
    searchStringModeOnInputByString: systemEnumerationRule({
      yaml: "СпособПоискаСтрокиПриВводеПоСтроке",
      typeSE: "SearchStringModeOnInputByString",
      defaultValueXML: "Begin",
      implicitValueYAML: "Begin",
      xmlParents: documentProperties,
    }),
    sequenceFilling: systemEnumerationRule({
      yaml: "ЗаполнениеПоследовательностей",
      typeSE: "SequenceFilling",
      defaultValueXML: "AutoFill",
      implicitValueYAML: "AutoFill",
      xmlParents: documentProperties,
    }),
    standardAttributes: standardAttributeDescriptionsRule({
      yaml: "СтандартныеРеквизиты",
      standartAttributeNames: MetadataDocumentStandardAttributeNames,
      xmlParents: documentProperties,
    }),
    synonym: i8nTextRule({
      yaml: "Синоним",
      xmlParents: documentProperties,
      defaultValueXMLRaw: "",
      excludeIfEqualNameYAML: true,
    }),
    tabularSections: metadataDocumentTabularSectionsRule({
      yaml: "ТабличныеЧасти",
      xmlParents: documentChildObjects,
      xml: "TabularSection",
    }),
    updateDataHistoryImmediatelyAfterWrite: booleanRule({
      yaml: "ОбновлятьИсториюДанныхСразуПослеЗаписи",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: documentProperties,
    }),
    useStandardCommands: booleanRule({
      yaml: "ИспользоватьСтандартныеКоманды",
      defaultValueXML: true,
      implicitValueYAML: true,
      xmlParents: documentProperties,
    }),
  },
  childCollections: [{ propertyKey: "commands", itemRule: MetadataDocumentCommandRules }],
} as const satisfies MetadataItemRule
