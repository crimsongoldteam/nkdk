import { additionalIndexRule, metadataCommandsRule } from "~/metadata/appliedObjects/metadataAccountingRegister/types"
import {
  metadataCatalogAttributesRule,
  metadataTabularSectionsRule,
} from "~/metadata/appliedObjects/metadataCatalog/types"
import { characteristicsDescriptionsRule } from "~/metadata/commonObjects/characteristicsDescription/types"
import { childFormNamesRule } from "~/metadata/commonObjects/childFormNames/types"
import { childTemplateNamesRule } from "~/metadata/commonObjects/childTemplateNames/types"
import { helpRule } from "~/metadata/commonObjects/help/types"
import { internalInfoRule } from "~/metadata/commonObjects/internalInfo/types"
import { metadataFieldsRule } from "~/metadata/commonObjects/metadataField/types"
import { metadataObjectRefCollectionRule } from "~/metadata/commonObjects/metadataObjectRefCollection/types"
import { predefinedRule } from "~/metadata/commonObjects/predefined/types"
import { standardAttributeDescriptionsRule } from "~/metadata/commonObjects/standardAttributeDescription/types"
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
import { MetadataCatalogStandardAttributeNames } from "./types"
export const MetadataCatalogRules = {
  itemType: "MetadataCatalog",
  metadataTargetOwner: { kind: "self", root: "Catalog" },
  itemTypePrefix: "Справочник",
  xmlDir: "Catalogs",
  uniqueNameScopes: [{ collections: ["attributes", "tabularSections"] }],
  properties: {
    xmlRoot: xmlRootRule({
      container: "Catalog",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    }),
    internalInfo: internalInfoRule({
      xmlParents: [],
      forReferenceOnly: true,
      items: [
        { name: "CatalogObject", category: "Object" },
        { name: "CatalogRef", category: "Ref" },
        { name: "CatalogSelection", category: "Selection" },
        { name: "CatalogList", category: "List" },
        { name: "CatalogManager", category: "Manager" },
      ],
    }),
    uuid: uuidRule({
      xml: "_uuid",
      forReferenceOnly: true,
      xmlParents: [],
    }),
    additionalIndexes: additionalIndexRule({
      yaml: "ДополнительныеИндексы",
      filePath: "Ext/AdditionalIndexes.xml",
    }),
    attributes: metadataCatalogAttributesRule({
      yaml: "Реквизиты",
      xmlParents: ["ChildObjects"],
      xml: "Attribute",
    }),
    autonumbering: booleanRule({
      yaml: "Автонумерация",
      defaultValueXML: true,
      implicitValueYAML: true,
      xmlParents: ["Properties"],
    }),
    auxiliaryChoiceForm: stringRule({
      yaml: "ДополнительнаяФормаДляВыбора",
      xmlParents: ["Properties"],
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
    }),
    auxiliaryFolderChoiceForm: stringRule({
      yaml: "ДополнительнаяФормаДляВыбораГруппы",
      xmlParents: ["Properties"],
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
    }),
    auxiliaryFolderForm: stringRule({
      yaml: "ДополнительнаяФормаГруппы",
      xmlParents: ["Properties"],
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
    }),
    auxiliaryListForm: stringRule({
      yaml: "ДополнительнаяФормаСписка",
      xmlParents: ["Properties"],
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
    }),
    auxiliaryObjectForm: stringRule({
      yaml: "ДополнительнаяФормаОбъекта",
      xmlParents: ["Properties"],
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
    }),
    basedOn: metadataObjectRefCollectionRule({
      yaml: "ВводитсяНаОсновании",
      xmlParents: ["Properties"],
      metadataTarget: { kind: "object", allowedObjectPaths: commonBasedOnObjectPaths },
      defaultValueXMLRaw: {},
    }),
    characteristics: characteristicsDescriptionsRule({
      yaml: "Характеристики",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: {},
    }),
    checkUnique: booleanRule({
      yaml: "КонтрольУникальности",
      defaultValueXML: true,
      implicitValueYAML: true,
      xmlParents: ["Properties"],
    }),
    choiceDataGetModeOnInputByString: systemEnumerationRule({
      yaml: "РежимПолученияДанныхВыбораПриВводеПоСтроке",
      typeSE: "ChoiceDataGetModeOnInputByString",
      defaultValueXML: "Directly",
      xmlParents: ["Properties"],
      implicitValueYAML: "Directly",
    }),
    choiceHistoryOnInput: systemEnumerationRule({
      yaml: "ИсторияВыбораПриВводе",
      typeSE: "ChoiceHistoryOnInput",
      defaultValueXML: "Auto",
      xmlParents: ["Properties"],
      implicitValueYAML: "Auto",
    }),
    choiceMode: systemEnumerationRule({
      yaml: "СпособВыбора",
      typeSE: "ChoiceMode",
      defaultValueXML: "BothWays",
      xmlParents: ["Properties"],
      implicitValueYAML: "BothWays",
    }),
    codeAllowedLength: systemEnumerationRule({
      yaml: "ДопустимаяДлинаКода",
      typeSE: "AllowedLength",
      defaultValueXML: "Variable",
      xmlParents: ["Properties"],
      implicitValueYAML: "Variable",
    }),
    codeLength: numberRule({
      yaml: "ДлинаКода",
      defaultValueXML: 9,
      xmlParents: ["Properties"],
      implicitValueYAML: 10,
    }),
    codeSeries: systemEnumerationRule({
      yaml: "СерииКодов",
      typeSE: "CatalogCodesSeries",
      defaultValueXML: "WholeCatalog",
      xmlParents: ["Properties"],
      implicitValueYAML: "WholeCatalog",
    }),
    codeType: systemEnumerationRule({
      yaml: "ТипКода",
      typeSE: "CatalogCodeType",
      defaultValueXML: "String",
      xmlParents: ["Properties"],
      implicitValueYAML: "String",
    }),
    comment: stringRule({
      yaml: "Комментарий",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: "",
    }),
    createOnInput: systemEnumerationRule({
      yaml: "СозданиеПриВводе",
      typeSE: "CreateOnInput",
      defaultValueXML: "Use",
      xmlParents: ["Properties"],
      implicitValueYAML: "Use",
    }),
    dataHistory: systemEnumerationRule({
      yaml: "ИсторияДанных",
      typeSE: "DataHistoryUse",
      defaultValueXML: "DontUse",
      xmlParents: ["Properties"],
      implicitValueYAML: "DontUse",
    }),
    dataLockControlMode: systemEnumerationRule({
      yaml: "РежимУправленияБлокировкойДанных",
      typeSE: "DefaultDataLockControlMode",
      defaultValueXML: "Managed",
      xmlParents: ["Properties"],
      implicitValueYAML: "Managed",
    }),
    dataLockFields: metadataFieldsRule({
      yaml: "ПоляБлокировкиДанных",
      metadataTarget: { kind: "member", owner: "this" },
      xmlParents: ["Properties"],
      defaultValueXMLRaw: {},
    }),
    defaultChoiceForm: stringRule({
      yaml: "ОсновнаяФормаДляВыбора",
      xmlParents: ["Properties"],
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
    }),
    defaultFolderChoiceForm: stringRule({
      yaml: "ОсновнаяФормаДляВыбораГруппы",
      xmlParents: ["Properties"],
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
    }),
    defaultFolderForm: stringRule({
      yaml: "ОсновнаяФормаГруппы",
      xmlParents: ["Properties"],
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
    }),
    defaultListForm: stringRule({
      yaml: "ОсновнаяФормаСписка",
      xmlParents: ["Properties"],
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
    }),
    defaultObjectForm: stringRule({
      yaml: "ОсновнаяФормаОбъекта",
      xmlParents: ["Properties"],
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
    }),
    defaultPresentation: systemEnumerationRule({
      yaml: "ОсновноеПредставление",
      typeSE: "CatalogMainPresentation",
      defaultValueXML: "AsDescription",
      xmlParents: ["Properties"],
      implicitValueYAML: "AsDescription",
    }),
    descriptionLength: numberRule({
      yaml: "ДлинаНаименования",
      defaultValueXML: 25,
      xmlParents: ["Properties"],
      implicitValueYAML: 30,
    }),
    editType: systemEnumerationRule({
      yaml: "СпособРедактирования",
      typeSE: "EditType",
      defaultValueXML: "InDialog",
      xmlParents: ["Properties"],
      implicitValueYAML: "InDialog",
    }),
    executeAfterWriteDataHistoryVersionProcessing: booleanRule({
      yaml: "ВыполнятьОбработкуПослеЗаписиВерсииИсторииДанных",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: ["Properties"],
    }),
    explanation: i8nTextRule({
      yaml: "Пояснение",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: {},
    }),
    extendedListPresentation: i8nTextRule({
      yaml: "РасширенноеПредставлениеСписка",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: {},
    }),
    extendedObjectPresentation: i8nTextRule({
      yaml: "РасширенноеПредставлениеОбъекта",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: {},
    }),
    foldersOnTop: booleanRule({
      yaml: "ГруппыСверху",
      defaultValueXML: true,
      implicitValueYAML: true,
      xmlParents: ["Properties"],
    }),
    fullTextSearch: systemEnumerationRule({
      yaml: "ПолнотекстовыйПоиск",
      typeSE: "UseFullTextSearch",
      defaultValueXML: "Use",
      xmlParents: ["Properties"],
      implicitValueYAML: "Use",
    }),
    fullTextSearchOnInputByString: systemEnumerationRule({
      yaml: "ПолнотекстовыйПоискПриВводеПоСтроке",
      typeSE: "FullTextSearchOnInputByString",
      defaultValueXML: "DontUse",
      xmlParents: ["Properties"],
      implicitValueYAML: "DontUse",
    }),
    hierarchical: booleanRule({
      yaml: "Иерархический",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: ["Properties"],
    }),
    hierarchyType: systemEnumerationRule({
      yaml: "ВидИерархии",
      typeSE: "HierarchyType",
      defaultValueXML: "HierarchyFoldersAndItems",
      xmlParents: ["Properties"],
      implicitValueYAML: "HierarchyFoldersAndItems",
    }),
    includeHelpInContents: booleanRule({
      yaml: "ВключатьСправкуВСодержание",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: ["Properties"],
    }),
    inputByString: metadataFieldsRule({
      yaml: "ВводПоСтроке",
      metadataTarget: {
        kind: "member",
        owner: "this",
        memberKinds: ["Attribute", "StandardAttribute"],
        filters: [{ kind: "stringIndexedAttribute" }],
      },
      defaultValue: [],
      defaultValueXMLRaw: {},
      xmlParents: ["Properties"],
    }),
    levelCount: numberRule({
      yaml: "КоличествоУровней",
      defaultValueXML: 2,
      xmlParents: ["Properties"],
      implicitValueYAML: 2,
    }),
    limitLevelCount: booleanRule({
      yaml: "ОграничиватьКоличествоУровней",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: ["Properties"],
    }),
    listPresentation: i8nTextRule({
      yaml: "ПредставлениеСписка",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: {},
    }),
    name: stringRule({
      xmlParents: ["Properties"],
      required: true,
    }),
    objectBelonging: systemEnumerationRule({
      yaml: "ПринадлежностьОбъекта",
      typeSE: "ObjectBelonging",
      xmlParents: ["Properties"],
      toYAML: false,
      fromYAML: false,
      implicitValueYAML: "Native",
    }),
    objectPresentation: i8nTextRule({
      yaml: "ПредставлениеОбъекта",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: {},
    }),
    owners: metadataObjectRefCollectionRule({
      yaml: "Владельцы",
      xmlParents: ["Properties"],
      metadataTarget: { kind: "object", roots: ["Catalog", "Document", "ChartOfCharacteristicTypes", "ExchangePlan"] },
      defaultValueXMLRaw: {},
    }),
    objectModule: moduleRule({
      externalMetadata: { segment: "ObjectModule", placement: "derivedEntry" },
      nkdkPath: "МодульОбъекта.bsl",
      xmlPath: "Ext/ObjectModule.bsl",
      syncArea: { kind: "objectModule", yamlFile: "МодульОбъекта.bsl", xmlPath: "Ext/ObjectModule.bsl" },
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
    predefined: predefinedRule({
      yaml: "Предопределенные",
      filePath: "Ext/Predefined.xml",
    }),
    help: helpRule({
      externalMetadata: { segment: "Help", placement: "derivedEntry" },
      filePath: "Ext/Help.xml",
      nkdkDir: "Справка",
    }),
    predefinedDataUpdate: systemEnumerationRule({
      yaml: "ОбновлениеПредопределенныхДанных",
      typeSE: "PredefinedDataUpdate",
      defaultValueXML: "Auto",
      xmlParents: ["Properties"],
      implicitValueYAML: "Auto",
    }),
    quickChoice: booleanRule({
      yaml: "БыстрыйВыбор",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: ["Properties"],
    }),
    searchStringModeOnInputByString: systemEnumerationRule({
      yaml: "СпособПоискаСтрокиПриВводеПоСтроке",
      typeSE: "SearchStringModeOnInputByString",
      defaultValueXML: "Begin",
      xmlParents: ["Properties"],
      implicitValueYAML: "Begin",
    }),
    subordinationUse: systemEnumerationRule({
      yaml: "ИспользованиеПодчинения",
      typeSE: "SubordinationUse",
      defaultValueXML: "ToItems",
      xmlParents: ["Properties"],
      implicitValueYAML: "ToItems",
    }),
    synonym: i8nTextRule({
      yaml: "Синоним",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: {},
    }),
    tabularSections: metadataTabularSectionsRule({
      yaml: "ТабличныеЧасти",
      xmlParents: ["ChildObjects"],
      xml: "TabularSection",
    }),
    standardAttributes: standardAttributeDescriptionsRule({
      yaml: "СтандартныеРеквизиты",
      standartAttributeNames: MetadataCatalogStandardAttributeNames,
      xmlParents: ["Properties"],
    }),
    commands: metadataCommandsRule({
      yaml: "Команды",
      xmlParents: ["ChildObjects"],
      xml: "Command",
    }),
    forms: childFormNamesRule({
      xml: "Form",
      folderName: "Формы",
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
      xmlParents: ["ChildObjects"],
    }),
    templates: childTemplateNamesRule({
      xml: "Template",
      folderName: "Шаблоны",
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
      xmlParents: ["ChildObjects"],
    }),
    updateDataHistoryImmediatelyAfterWrite: booleanRule({
      yaml: "ОбновлятьИсториюДанныхСразуПослеЗаписи",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: ["Properties"],
    }),
    useStandardCommands: booleanRule({
      yaml: "ИспользоватьСтандартныеКоманды",
      defaultValueXML: true,
      implicitValueYAML: true,
      xmlParents: ["Properties"],
    }),
  },
  childCollections: [{ propertyKey: "commands", itemRule: MetadataCommandRules }],
} as const satisfies MetadataItemRule
