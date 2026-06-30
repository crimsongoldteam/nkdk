import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import { exportMetadataCollectionToXML } from "~/metadata/orchestration/metadataCollection/toXML"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { ExportToXMLFunctionNew } from "~/metadata/orchestration/property/fn"
import { MetadataItemRule, PropertyRule } from "~/metadata/orchestration/property/types"
import "~/metadata/commonObjects/metadataAttribute/register"
import { MetadataAttributeRules } from "~/metadata/commonObjects/metadataAttribute/rules"
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

const MetadataDataProcessorAttributeRules = {
  ...MetadataAttributeRules,
  properties: {
    ...MetadataAttributeRules.properties,
    type: {
      ...MetadataAttributeRules.properties.type,
      declareTypeNamespaceXML: true,
    },
  },
} as const satisfies MetadataItemRule

const getMetadataAttributeItemRule = (rule: PropertyRule | undefined): MetadataItemRule => {
  if (rule && "itemRule" in rule && rule.itemRule !== undefined) return rule.itemRule as MetadataItemRule
  return MetadataAttributeRules
}

const exportMetadataAttributesToXML: ExportToXMLFunctionNew = (params) => {
  const effectiveXmlElement = params.rule.xml === "Attribute" ? undefined : "Attribute"

  return exportMetadataCollectionToXML({
    context: params.context,
    rule: params.rule,
    data: params.value,
    referenceData: params.referenceMetadata,
    itemRule: getMetadataAttributeItemRule(params.rule),
    xmlElement: effectiveXmlElement,
    keyField: "name",
  })
}

registerTypeRule("MetadataAttributes", "exportToXML", exportMetadataAttributesToXML)

export const MetadataDataProcessorRules = {
  itemType: "MetadataDataProcessor",
  metadataTargetOwner: { kind: "self", root: "DataProcessor" },
  itemTypePrefix: "Обработка",
  xmlDir: "DataProcessors",
  uniqueNameScopes: [{ collections: ["attributes", "tabularSections"] }],
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
      implicitValueYAML: true,
      xmlParents: properties,
    },
    defaultForm: {
      yaml: "ОсновнаяФорма",
      type: "string",
      xmlParents: properties,
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
    },
    auxiliaryForm: {
      yaml: "ДополнительнаяФорма",
      type: "string",
      xmlParents: properties,
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
    },
    includeHelpInContents: {
      yaml: "ВключатьСправкуВСодержание",
      type: "boolean",
      defaultValueXML: false,
      implicitValueYAML: false,
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
      implicitValueYAML: "Native",
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
      ...({ itemRule: MetadataDataProcessorAttributeRules } as { itemRule: MetadataItemRule }),
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
      externalMetadata: { segment: "ObjectModule", placement: "derivedEntry" },
      nkdkPath: "МодульОбъекта.bsl",
      xmlPath: ({ name }: { name: string }) => `${name}/Ext/ObjectModule.bsl`,
      toXML: false,
      fromXML: false,
    },
    managerModule: {
      type: "Module",
      externalMetadata: { segment: "ManagerModule", placement: "derivedEntry" },
      nkdkPath: "МодульМенеджера.bsl",
      xmlPath: ({ name }: { name: string }) => `${name}/Ext/ManagerModule.bsl`,
      toXML: false,
      fromXML: false,
    },
    help: {
      type: "Help",
      externalMetadata: { segment: "Help", placement: "derivedEntry" },
      filePath: "Ext/Help.xml",
      xmlPath: ({ name }: { name: string }) => `${name}/Ext/Help.xml`,
      nkdkDir: "Справка",
    },
  },
  childCollections: [{ propertyKey: "commands", itemRule: MetadataDataProcessorCommandRules }],
} as const satisfies MetadataItemRule
