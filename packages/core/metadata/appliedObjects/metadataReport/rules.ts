import { metadataCommandsRule } from "../metadataAccountingRegister/builders"
import { metadataReportAttributesRule, metadataReportTabularSectionsRule } from "./builders"
import { childFormNamesRule } from "../../commonObjects/childFormNames/types"
import { childTemplateNamesRule } from "../../commonObjects/childTemplateNames/types"
import { helpRule } from "../../commonObjects/help/types"
import { internalInfoRule } from "../../commonObjects/internalInfo/types"
import { booleanRule } from "../../commonObjects/boolean/types"
import { i8nTextRule } from "../../commonObjects/i8nText/types"
import { moduleRule } from "../../commonObjects/module/types"
import { stringRule } from "../../commonObjects/string/types"
import { uuidRule } from "../../commonObjects/uuid/types"
import { xmlRootRule } from "../../commonObjects/xmlRoot/types"
import { systemEnumerationRule } from "../../systemEnumerations/types"
import { V8_MDCLASSES_ROOT } from "../../orchestration/appliedObject/presets"
import { registerMetadataItemCollectionRule } from "../../orchestration/metadataCollection/ruleFactory"
import type { MetadataItemRule } from "../../orchestration/property/types"
import "../../commonObjects/metadataAttribute/register"
import { MetadataAttributeRules } from "../../commonObjects/metadataAttribute/rules"
import { MetadataCommandRules } from "../metadataCommand/rules"
const properties = ["Properties"]
const childObjects = ["ChildObjects"]
const MetadataReportCommandRules = {
  ...MetadataCommandRules,
  properties: {
    ...MetadataCommandRules.properties,
    commandModule: {
      ...MetadataCommandRules.properties.commandModule,
      xmlPath: ({ name, parentName }: { name: string; parentName?: string }) =>
        `${parentName}/Commands/${name}/Ext/CommandModule.bsl`,
    },
  },
} as const satisfies MetadataItemRule
const MetadataReportAttributeRules = {
  ...MetadataAttributeRules,
  properties: {
    ...MetadataAttributeRules.properties,
    type: {
      ...MetadataAttributeRules.properties.type,
      declareTypeNamespaceXML: true,
    },
  },
} as const satisfies MetadataItemRule
registerMetadataItemCollectionRule({
  propertyType: "MetadataReportAttributes",
  itemRule: MetadataReportAttributeRules,
  xmlElement: "Attribute",
  keyField: "name",
  collectionItemRule: true,
})
export const MetadataReportRules = {
  itemType: "MetadataReport",
  metadataTargetOwner: { kind: "self", root: "Report" },
  itemTypePrefix: "Отчет",
  xmlDir: "Reports",
  uniqueNameScopes: [{ collections: ["attributes", "tabularSections"] }],
  properties: {
    xmlRoot: xmlRootRule({
      container: "Report",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    }),
    internalInfo: internalInfoRule({
      xmlParents: [],
      forReferenceOnly: true,
      items: [
        { name: "ReportObject", category: "Object" },
        { name: "ReportManager", category: "Manager" },
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
      defaultValue: ({ name, operation }: { name?: string; operation?: string }) =>
        operation === "importFromYAML" ? name : undefined,
    }),
    synonym: i8nTextRule({
      yaml: "Синоним",
      xmlParents: properties,
      defaultValueXMLRaw: "",
      excludeIfEqualNameYAML: true,
      defaultValueXMLEmpty: { items: {} },
      defaultValue: { items: {} },
    }),
    comment: stringRule({
      yaml: "Комментарий",
      xmlParents: properties,
      defaultValueXMLRaw: "",
      defaultValueXMLEmpty: "",
      defaultValue: "",
      implicitValueYAML: "",
    }),
    useStandardCommands: booleanRule({
      yaml: "ИспользоватьСтандартныеКоманды",
      defaultValue: true,
      defaultValueXML: true,
      implicitValueYAML: true,
      omitImplicitValueYAMLBySource: true,
      preserveExplicitDefaultXML: true,
      xmlParents: properties,
    }),
    defaultForm: stringRule({
      yaml: "ОсновнаяФорма",
      xmlParents: properties,
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
      defaultValueXMLEmpty: "",
      defaultValue: "",
      implicitValueYAML: "",
    }),
    auxiliaryForm: stringRule({
      yaml: "ДополнительнаяФорма",
      xmlParents: properties,
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
      defaultValueXMLEmpty: "",
      defaultValue: "",
      implicitValueYAML: "",
    }),
    mainDataCompositionSchema: stringRule({
      yaml: "ОсновнаяСхемаКомпоновкиДанных",
      xmlParents: properties,
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Template"] },
      defaultValueXMLRaw: "",
      defaultValueXMLEmpty: "",
      defaultValue: "",
      implicitValueYAML: "",
    }),
    defaultSettingsForm: stringRule({
      yaml: "ОсновнаяФормаНастроекОтчета",
      xmlParents: properties,
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
      defaultValueXMLEmpty: "",
      defaultValue: "",
      implicitValueYAML: "",
    }),
    auxiliarySettingsForm: stringRule({
      yaml: "ДополнительнаяФормаНастроекОтчета",
      xmlParents: properties,
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
      defaultValueXMLEmpty: "",
      defaultValue: "",
      implicitValueYAML: "",
    }),
    defaultVariantForm: stringRule({
      yaml: "ОсновнаяФормаВариантаОтчета",
      xmlParents: properties,
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
      defaultValueXMLEmpty: "",
      defaultValue: "",
      implicitValueYAML: "",
    }),
    variantsStorage: stringRule({
      yaml: "ХранилищеВариантовОтчетов",
      xmlParents: properties,
      defaultValueXMLRaw: "",
      defaultValueXMLEmpty: "",
      defaultValue: "",
      implicitValueYAML: "",
    }),
    settingsStorage: stringRule({
      yaml: "ХранилищеПользовательскихНастроекОтчетов",
      xmlParents: properties,
      defaultValueXMLRaw: "",
      defaultValueXMLEmpty: "",
      defaultValue: "",
      implicitValueYAML: "",
    }),
    includeHelpInContents: booleanRule({
      yaml: "ВключатьСправкуВСодержание",
      defaultValue: false,
      defaultValueXML: false,
      implicitValueYAML: false,
      omitImplicitValueYAMLBySource: true,
      preserveExplicitDefaultXML: true,
      xmlParents: properties,
    }),
    extendedPresentation: i8nTextRule({
      yaml: "РасширенноеПредставление",
      xmlParents: properties,
      defaultValueXMLRaw: "",
      defaultValueXMLEmpty: { items: {} },
      defaultValue: { items: {} },
    }),
    explanation: i8nTextRule({
      yaml: "Пояснение",
      xmlParents: properties,
      defaultValueXMLRaw: "",
      defaultValueXMLEmpty: { items: {} },
      defaultValue: { items: {} },
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
    attributes: metadataReportAttributesRule({
      yaml: "Реквизиты",
      xmlParents: childObjects,
      xml: "Attribute",
    }),
    tabularSections: metadataReportTabularSectionsRule({
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
    objectModule: moduleRule({
      externalMetadata: { segment: "ObjectModule", placement: "derivedEntry" },
      nkdkPath: "МодульОбъекта.bsl",
      xmlPath: ({ name }: { name: string }) => `${name}/Ext/ObjectModule.bsl`,
      toXML: false,
      fromXML: false,
    }),
    managerModule: moduleRule({
      externalMetadata: { segment: "ManagerModule", placement: "derivedEntry" },
      nkdkPath: "МодульМенеджера.bsl",
      xmlPath: ({ name }: { name: string }) => `${name}/Ext/ManagerModule.bsl`,
      toXML: false,
      fromXML: false,
    }),
    help: helpRule({
      externalMetadata: { segment: "Help", placement: "derivedEntry" },
      filePath: "Ext/Help.xml",
      xmlPath: ({ name }: { name: string }) => `${name}/Ext/Help.xml`,
      nkdkDir: "Справка",
    }),
  },
  childCollections: [{ propertyKey: "commands", itemRule: MetadataReportCommandRules }],
} as const satisfies MetadataItemRule
