import {
  additionalIndexRule,
  metadataCommandsRule,
} from "~/metadata/appliedObjects/metadataAccountingRegister/builders"
import { metadataAttributesRule } from "~/metadata/appliedObjects/metadataDataProcessor/builders"
import {
  metadataTaskAddressingAttributesRule,
  metadataTaskTabularSectionsRule,
} from "~/metadata/appliedObjects/metadataTask/builders"
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
import { MetadataItemRule } from "~/metadata/orchestration/property/types"
import { commonBasedOnObjectPaths } from "~/metadata/commonObjects/metadataTargets"
import { MetadataCommandRules } from "../metadataCommand/rules"
const properties = ["Properties"]
const childObjects = ["ChildObjects"]
export const MetadataTaskStandardAttributeNames: Record<string, string> = {
  Executed: "Выполнена",
  Description: "Описание",
  RoutePoint: "ТочкаМаршрута",
  BusinessProcess: "БизнесПроцесс",
  Ref: "Ссылка",
  DeletionMark: "ПометкаУдаления",
  Date: "Дата",
  Number: "Номер",
}
export const MetadataTaskRules = {
  itemType: "MetadataTask",
  metadataTargetOwner: { kind: "self", root: "Task" },
  itemTypePrefix: "Задача",
  xmlDir: "Tasks",
  uniqueNameScopes: [{ collections: ["attributes", "tabularSections"] }],
  properties: {
    xmlRoot: xmlRootRule({
      container: "Task",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    }),
    internalInfo: internalInfoRule({
      xmlParents: [],
      forReferenceOnly: true,
      items: [
        { name: "TaskObject", category: "Object" },
        { name: "TaskRef", category: "Ref" },
        { name: "TaskSelection", category: "Selection" },
        { name: "TaskList", category: "List" },
        { name: "TaskManager", category: "Manager" },
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
    numberType: systemEnumerationRule({
      yaml: "ТипНомера",
      typeSE: "TaskNumberType",
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
    autonumbering: booleanRule({
      yaml: "Автонумерация",
      defaultValueXML: true,
      implicitValueYAML: true,
      xmlParents: properties,
    }),
    taskNumberAutoPrefix: systemEnumerationRule({
      yaml: "АвтоПрефиксНомераЗадачи",
      typeSE: "TaskNumberAutoPrefix",
      defaultValueXML: "DontUse",
      implicitValueYAML: "DontUse",
      xmlParents: properties,
    }),
    descriptionLength: numberRule({
      yaml: "ДлинаНаименования",
      defaultValueXML: 25,
      implicitValueYAML: 25,
      xmlParents: properties,
    }),
    addressing: stringRule({
      yaml: "Адресация",
      xmlParents: properties,
      metadataTarget: { kind: "object", roots: ["InformationRegister"] },
      defaultValueXMLRaw: "",
    }),
    mainAddressingAttribute: stringRule({
      yaml: "ОсновнойРеквизитАдресации",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
    currentPerformer: stringRule({
      yaml: "ТекущийИсполнитель",
      xmlParents: properties,
      metadataTarget: { kind: "object", roots: ["SessionParameter"] },
      defaultValueXMLRaw: "",
    }),
    basedOn: metadataItemLinksRule({
      yaml: "ВводитсяНаОсновании",
      metadataTarget: { kind: "object", allowedObjectPaths: commonBasedOnObjectPaths },
      xmlParents: properties,
      defaultValueXMLRaw: {},
    }),
    standardAttributes: standardAttributeDescriptionsRule({
      yaml: "СтандартныеРеквизиты",
      standartAttributeNames: MetadataTaskStandardAttributeNames,
      xmlParents: properties,
    }),
    characteristics: characteristicsDescriptionsRule({
      yaml: "Характеристики",
      xmlParents: properties,
      defaultValueXMLRaw: {},
    }),
    defaultPresentation: systemEnumerationRule({
      yaml: "ОсновноеПредставление",
      typeSE: "TaskMainPresentation",
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
    inputByString: metadataFieldsRule({
      yaml: "ВводПоСтроке",
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
    includeHelpInContents: booleanRule({
      yaml: "ВключатьСправкуВСодержание",
      defaultValueXML: false,
      implicitValueYAML: false,
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
    tabularSections: metadataTaskTabularSectionsRule({
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
    addressingAttributes: metadataTaskAddressingAttributesRule({
      yaml: "РеквизитыАдресации",
      xml: "AddressingAttribute",
      xmlParents: childObjects,
    }),
    commands: metadataCommandsRule({
      yaml: "Команды",
      xml: "Command",
      xmlParents: childObjects,
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
  childCollections: [{ propertyKey: "commands", itemRule: MetadataCommandRules }],
} as const satisfies MetadataItemRule
