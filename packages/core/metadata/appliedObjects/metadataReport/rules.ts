import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import { registerMetadataItemCollectionRule } from "~/metadata/orchestration/metadataCollection/ruleFactory"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
import "~/metadata/commonObjects/metadataAttribute/register"
import { MetadataAttributeRules } from "~/metadata/commonObjects/metadataAttribute/rules"
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
  graphChild: { idFrom: "name", edgeKind: "ATTRIBUTE", edgeYaml: "Реквизит", nodeSegment: "Реквизит" },
})

export const MetadataReportRules = {
  itemType: "MetadataReport",
  itemTypePrefix: "Отчет",
  xmlDir: "Reports",
  uniqueNameScopes: [{ collections: ["attributes", "tabularSections"] }],
  properties: {
    xmlRoot: {
      type: "XMLRoot",
      container: "Report",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    },
    internalInfo: {
      type: "InternalInfo",
      xmlParents: [],
      forReferenceOnly: true,
      items: [
        { name: "ReportObject", category: "Object" },
        { name: "ReportManager", category: "Manager" },
      ],
    },
    uuid: {
      type: "uuid",
      xml: "_uuid",
      forReferenceOnly: true,
      xmlParents: [],
    },
    name: {
      type: "string",
      xmlParents: properties,
      required: true,
      defaultValue: ({ name, operation }: { name?: string; operation?: string }) =>
        operation === "importFromYAML" ? name : undefined,
    },
    synonym: {
      yaml: "Синоним",
      type: "I8nText",
      xmlParents: properties,
      defaultValueXMLRaw: "",
      defaultValueXMLEmpty: { items: {} },
      defaultValue: { items: {} },
    },
    comment: {
      yaml: "Комментарий",
      type: "string",
      xmlParents: properties,
      defaultValueXMLRaw: "",
      defaultValueXMLEmpty: "",
      defaultValue: "",
      implicitValueYAML: "",
    },
    useStandardCommands: {
      yaml: "ИспользоватьСтандартныеКоманды",
      type: "boolean",
      defaultValue: true,
      defaultValueXML: true,
      implicitValueYAML: true,
      omitImplicitValueYAMLBySource: true,
      preserveExplicitDefaultXML: true,
      xmlParents: properties,
    },
    defaultForm: {
      yaml: "ОсновнаяФорма",
      type: "string",
      xmlParents: properties,
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
      defaultValueXMLEmpty: "",
      defaultValue: "",
      implicitValueYAML: "",
    },
    auxiliaryForm: {
      yaml: "ДополнительнаяФорма",
      type: "string",
      xmlParents: properties,
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
      defaultValueXMLEmpty: "",
      defaultValue: "",
      implicitValueYAML: "",
    },
    mainDataCompositionSchema: {
      yaml: "ОсновнаяСхемаКомпоновкиДанных",
      type: "string",
      xmlParents: properties,
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Template"] },
      defaultValueXMLRaw: "",
      defaultValueXMLEmpty: "",
      defaultValue: "",
      implicitValueYAML: "",
    },
    defaultSettingsForm: {
      yaml: "ОсновнаяФормаНастроекОтчета",
      type: "string",
      xmlParents: properties,
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
      defaultValueXMLEmpty: "",
      defaultValue: "",
      implicitValueYAML: "",
    },
    auxiliarySettingsForm: {
      yaml: "ДополнительнаяФормаНастроекОтчета",
      type: "string",
      xmlParents: properties,
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
      defaultValueXMLEmpty: "",
      defaultValue: "",
      implicitValueYAML: "",
    },
    defaultVariantForm: {
      yaml: "ОсновнаяФормаВариантаОтчета",
      type: "string",
      xmlParents: properties,
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
      defaultValueXMLEmpty: "",
      defaultValue: "",
      implicitValueYAML: "",
    },
    variantsStorage: {
      yaml: "ХранилищеВариантовОтчетов",
      type: "string",
      xmlParents: properties,
      defaultValueXMLRaw: "",
      defaultValueXMLEmpty: "",
      defaultValue: "",
      implicitValueYAML: "",
    },
    settingsStorage: {
      yaml: "ХранилищеПользовательскихНастроекОтчетов",
      type: "string",
      xmlParents: properties,
      defaultValueXMLRaw: "",
      defaultValueXMLEmpty: "",
      defaultValue: "",
      implicitValueYAML: "",
    },
    includeHelpInContents: {
      yaml: "ВключатьСправкуВСодержание",
      type: "boolean",
      defaultValue: false,
      defaultValueXML: false,
      implicitValueYAML: false,
      omitImplicitValueYAMLBySource: true,
      preserveExplicitDefaultXML: true,
      xmlParents: properties,
    },
    extendedPresentation: {
      yaml: "РасширенноеПредставление",
      type: "I8nText",
      xmlParents: properties,
      defaultValueXMLRaw: "",
      defaultValueXMLEmpty: { items: {} },
      defaultValue: { items: {} },
    },
    explanation: {
      yaml: "Пояснение",
      type: "I8nText",
      xmlParents: properties,
      defaultValueXMLRaw: "",
      defaultValueXMLEmpty: { items: {} },
      defaultValue: { items: {} },
    },
    objectBelonging: {
      yaml: "ПринадлежностьОбъекта",
      type: "SystemEnumeration",
      typeSE: "ObjectBelonging",
      xmlParents: properties,
      toYAML: false,
      fromYAML: false,
      implicitValueYAML: "Native",
    },
    extendedConfigurationObject: {
      yaml: "ОбъектРасширяемойКонфигурации",
      type: "string",
      runtimeOnly: true,
    },
    attributes: {
      yaml: "Реквизиты",
      type: "MetadataReportAttributes",
      xmlParents: childObjects,
      xml: "Attribute",
    },
    tabularSections: {
      yaml: "ТабличныеЧасти",
      type: "MetadataReportTabularSections",
      xmlParents: childObjects,
      xml: "TabularSection",
    },
    forms: {
      type: "ChildFormNames",
      xml: "Form",
      folderName: "Формы",
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
      xmlParents: childObjects,
    },
    templates: {
      type: "ChildTemplateNames",
      xml: "Template",
      folderName: "Шаблоны",
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
      xmlParents: childObjects,
    },
    commands: {
      yaml: "Команды",
      type: "MetadataCommands",
      xmlParents: childObjects,
      xml: "Command",
    },
    objectModule: {
      type: "Module",
      nkdkPath: "МодульОбъекта.bsl",
      xmlPath: ({ name }: { name: string }) => `${name}/Ext/ObjectModule.bsl`,
      toXML: false,
      fromXML: false,
    },
    managerModule: {
      type: "Module",
      nkdkPath: "МодульМенеджера.bsl",
      xmlPath: ({ name }: { name: string }) => `${name}/Ext/ManagerModule.bsl`,
      toXML: false,
      fromXML: false,
    },
    help: {
      type: "Help",
      filePath: "Ext/Help.xml",
      xmlPath: ({ name }: { name: string }) => `${name}/Ext/Help.xml`,
      nkdkDir: "Справка",
    },
  },
  childCollections: [{ propertyKey: "commands", itemRule: MetadataReportCommandRules }],
} as const satisfies MetadataItemRule
