import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"
import { MetadataCommandRules } from "../metadataCommand/rules"

const properties = ["Properties"]
const childObjects = ["ChildObjects"]

const MetadataDataProcessorCommandRules = {
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

export const MetadataDataProcessorRules = {
  itemType: "MetadataDataProcessor",
  itemTypePrefix: "Обработка",
  xmlDir: "DataProcessors",
  properties: {
    xmlRoot: {
      type: "XMLRoot",
      container: "DataProcessor",
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
        { name: "DataProcessorObject", category: "Object" },
        { name: "DataProcessorManager", category: "Manager" },
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
    },
    comment: {
      yaml: "Комментарий",
      type: "string",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    },
    useStandardCommands: {
      yaml: "ИспользоватьСтандартныеКоманды",
      type: "boolean",
      defaultValueXML: true,
      defaultValueYAML: true,
      xmlParents: properties,
    },
    defaultForm: {
      yaml: "ОсновнаяФорма",
      type: "string",
      xmlParents: properties,
      referenceScope: { target: "this", kind: "Form" },
      defaultValueXMLRaw: "",
    },
    auxiliaryForm: {
      yaml: "ДополнительнаяФорма",
      type: "string",
      xmlParents: properties,
      referenceScope: { target: "this", kind: "Form" },
      defaultValueXMLRaw: "",
    },
    includeHelpInContents: {
      yaml: "ВключатьСправкуВСодержание",
      type: "boolean",
      defaultValueXML: false,
      defaultValueYAML: false,
      xmlParents: properties,
    },
    extendedPresentation: {
      yaml: "РасширенноеПредставление",
      type: "I8nText",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    },
    explanation: {
      yaml: "Пояснение",
      type: "I8nText",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    },
    objectBelonging: {
      yaml: "ПринадлежностьОбъекта",
      type: "SystemEnumeration",
      typeSE: "ObjectBelonging",
      xmlParents: properties,
      toYAML: false,
      fromYAML: false,
      defaultValueYAML: "Native",
    },
    extendedConfigurationObject: {
      yaml: "ОбъектРасширяемойКонфигурации",
      type: "string",
      runtimeOnly: true,
    },
    attributes: {
      yaml: "Реквизиты",
      type: "MetadataAttributes",
      xmlParents: childObjects,
      xml: "Attribute",
    },
    tabularSections: {
      yaml: "ТабличныеЧасти",
      type: "MetadataDataProcessorTabularSections",
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
  requiredXMLParents: [["ChildObjects"]],
  childCollections: [{ propertyKey: "commands", itemRule: MetadataDataProcessorCommandRules }],
} as const satisfies MetadataItemRule
