import { additionalIndexRule, metadataCommandsRule } from "../metadataAccountingRegister/builders"
import {
  metadataChartOfCalculationTypesAttributesRule,
  metadataChartOfCalculationTypesTabularSectionsRule,
} from "./builders"
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
import { V8_MDCLASSES_ROOT } from "../../ruleRuntime/appliedObject/presets"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { ChartOfCalculationTypesPredefinedRules } from "./predefinedRules"
import { commonBasedOnObjectPaths } from "../../ruleRuntime/metadataTarget"
import { MetadataCommandRules } from "../../commonObjects/metadataCommand/rules"
import { appliedObjectInputByStringRule, commonInputChoiceRules, inputByStringStandardField, NUMERIC_LENGTH_HINT } from "../inputByStringDeclarations"
const properties = ["Properties"]
const childObjects = ["ChildObjects"]
export const MetadataChartOfCalculationTypesStandardAttributeNames: Record<string, string> = {
  PredefinedDataName: "ИмяПредопределенныхДанных",
  Predefined: "Предопределенный",
  Ref: "Ссылка",
  DeletionMark: "ПометкаУдаления",
  ActionPeriodIsBasic: "ПериодДействияБазовый",
  Description: "Наименование",
  Code: "Код",
}
const MetadataChartOfCalculationTypesCommandRules = {
  ...MetadataCommandRules,
  properties: {
    ...MetadataCommandRules.properties,
    commandModule: {
      ...MetadataCommandRules.properties.commandModule,
      xmlPath: ({ name }: { name: string }) => `Commands/${name}/Ext/CommandModule.bsl`,
    },
  },
} as const satisfies MetadataItemRule
export const MetadataChartOfCalculationTypesRules = {
  itemType: "MetadataChartOfCalculationTypes",
  metadataTargetOwner: { kind: "self", root: "ChartOfCalculationTypes" },
  itemTypePrefix: "ПланВидовРасчета",
  xmlDir: "ChartsOfCalculationTypes",
  uniqueNameScopes: [{ collections: ["attributes", "tabularSections"] }],
  xmlOrder: [
    "internalInfo",
    "objectBelonging",
    "name",
    "synonym",
    "comment",
    "useStandardCommands",
    "codeLength",
    "descriptionLength",
    "codeType",
    "codeAllowedLength",
    "defaultPresentation",
    "editType",
    "quickChoice",
    "choiceMode",
    "inputByString",
    "searchStringModeOnInputByString",
    "fullTextSearchOnInputByString",
    "choiceDataGetModeOnInputByString",
    "createOnInput",
    "choiceHistoryOnInput",
    "defaultObjectForm",
    "defaultListForm",
    "defaultChoiceForm",
    "auxiliaryObjectForm",
    "auxiliaryListForm",
    "auxiliaryChoiceForm",
    "basedOn",
    "dependenceOnCalculationTypes",
    "baseCalculationTypes",
    "actionPeriodUse",
    "standardAttributes",
    "characteristics",
    "standardTabularSections",
    "predefinedDataUpdate",
    "includeHelpInContents",
    "dataLockFields",
    "dataLockControlMode",
    "fullTextSearch",
    "objectPresentation",
    "extendedObjectPresentation",
    "listPresentation",
    "extendedListPresentation",
    "explanation",
    "dataHistory",
    "updateDataHistoryImmediatelyAfterWrite",
    "executeAfterWriteDataHistoryVersionProcessing",
    "attributes",
    "tabularSections",
    "forms",
    "templates",
    "commands",
    "uuid",
    "predefined",
    "additionalIndexes",
    "help",
  ],
  properties: {
    xmlRoot: xmlRootRule({
      container: "ChartOfCalculationTypes",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    }),
    internalInfo: internalInfoRule({
      xmlParents: [],
      forReferenceOnly: true,
      items: [
        { name: "ChartOfCalculationTypesObject", category: "Object" },
        { name: "ChartOfCalculationTypesRef", category: "Ref" },
        { name: "ChartOfCalculationTypesSelection", category: "Selection" },
        { name: "ChartOfCalculationTypesList", category: "List" },
        { name: "ChartOfCalculationTypesManager", category: "Manager" },
        { name: "DisplacingCalculationTypes", category: "DisplacingCalculationTypes" },
        { name: "DisplacingCalculationTypesRow", category: "DisplacingCalculationTypesRow" },
        { name: "BaseCalculationTypes", category: "BaseCalculationTypes" },
        { name: "BaseCalculationTypesRow", category: "BaseCalculationTypesRow" },
        { name: "LeadingCalculationTypes", category: "LeadingCalculationTypes" },
        { name: "LeadingCalculationTypesRow", category: "LeadingCalculationTypesRow" },
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
    comment: stringRule({
      yaml: "Комментарий",
      xmlParents: properties,
      defaultValueXMLRaw: "",
      defaultValueAdoptedXML: "",
    }),
    useStandardCommands: booleanRule({
      yaml: "ИспользоватьСтандартныеКоманды",
      defaultValueXML: true,
      implicitValueYAML: true,
      xmlParents: properties,
    }),
    codeLength: numberRule({
      yaml: "ДлинаКода",
      description: `Длина кода. ${NUMERIC_LENGTH_HINT}`,
      minimum: 0,
      maximum: 40,
      maximumWhen: { propertyKey: "codeType", equals: "Number", maximum: 38 },
      defaultValueXML: 9,
      implicitValueYAML: 9,
      xmlParents: properties,
    }),
    descriptionLength: numberRule({
      yaml: "ДлинаНаименования",
      minimum: 0,
      maximum: 100,
      defaultValueXML: 40,
      implicitValueYAML: 40,
      xmlParents: properties,
    }),
    codeType: systemEnumerationRule({
      yaml: "ТипКода",
      typeSE: "ChartOfCalculationTypesCodeType",
      defaultValueXML: "String",
      implicitValueYAML: "String",
      xmlParents: properties,
    }),
    codeAllowedLength: systemEnumerationRule({
      yaml: "ДопустимаяДлинаКода",
      typeSE: "AllowedLength",
      defaultValueXML: "Variable",
      implicitValueYAML: "Variable",
      xmlParents: properties,
    }),
    defaultPresentation: systemEnumerationRule({
      yaml: "ОсновноеПредставление",
      typeSE: "CalculationTypeMainPresentation",
      defaultValueXML: "AsDescription",
      implicitValueYAML: "AsDescription",
      xmlParents: properties,
    }),
    ...commonInputChoiceRules(properties),
    inputByString: appliedObjectInputByStringRule({
      xmlParents: properties,
      defaultValueXMLRaw: {},
      standardFields: [
        inputByStringStandardField("Наименование", "descriptionLength", "ДлинаНаименования", 40),
        inputByStringStandardField("Код", "codeLength", "ДлинаКода", 9),
      ],
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
    basedOn: metadataItemLinksRule({
      yaml: "ВводитсяНаОсновании",
      metadataTarget: { kind: "object", allowedObjectPaths: commonBasedOnObjectPaths },
      xmlParents: properties,
      defaultValueXMLRaw: {},
    }),
    dependenceOnCalculationTypes: systemEnumerationRule({
      ownerFactRole: "dependenceOnCalculationTypes",
      yaml: "ЗависимостьОтВидовРасчета",
      typeSE: "ChartOfCalculationTypesBaseUse",
      defaultValueXML: "DontUse",
      implicitValueYAML: "DontUse",
      xmlParents: properties,
    }),
    baseCalculationTypes: metadataItemLinksRule({
      ownerFactRole: "baseCalculationTypes",
      yaml: "БазовыеВидыРасчета",
      xmlParents: properties,
      defaultValueXMLRaw: {},
    }),
    actionPeriodUse: booleanRule({
      yaml: "ПериодДействияБазовый",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: properties,
    }),
    standardAttributes: standardAttributeDescriptionsRule({
      yaml: "СтандартныеРеквизиты",
      standartAttributeNames: MetadataChartOfCalculationTypesStandardAttributeNames,
      xmlParents: properties,
    }),
    characteristics: characteristicsDescriptionsRule({
      yaml: "Характеристики",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
    standardTabularSections: standardTabularSectionDescriptionsRule({
      yaml: "СтандартныеТабличныеЧасти",
      xmlParents: properties,
    }),
    predefinedDataUpdate: systemEnumerationRule({
      yaml: "ОбновлениеПредопределенныхДанных",
      typeSE: "PredefinedDataUpdate",
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
    extendedConfigurationObject: stringRule({ runtimeOnly: true }),
    attributes: metadataChartOfCalculationTypesAttributesRule({
      yaml: "Реквизиты",
      xml: "Attribute",
      xmlParents: childObjects,
    }),
    tabularSections: metadataChartOfCalculationTypesTabularSectionsRule({
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
    predefined: predefinedRule({
      yaml: "Предопределенные",
      ownerFactRole: "predefined",
      filePath: "Ext/Predefined.xml",
      itemRule: ChartOfCalculationTypesPredefinedRules,
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
      itemRule: MetadataChartOfCalculationTypesCommandRules,
    },
  ],
} as const satisfies MetadataItemRule
