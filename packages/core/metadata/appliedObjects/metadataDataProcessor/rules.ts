import { metadataCommandsRule } from "../metadataAccountingRegister/builders"
import { metadataAttributesRule, metadataDataProcessorTabularSectionsRule } from "./builders"
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
import { exportMetadataCollectionToXML } from "../../orchestration/metadataCollection/toXML"
import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import { ExportToXMLFunctionNew } from "../../orchestration/property/fn"
import type { MetadataItemRule, PropertyRule } from "../../orchestration/property/types"
import "../../commonObjects/metadataAttribute/register"
import { MetadataAttributeRules } from "../../commonObjects/metadataAttribute/rules"
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
    xmlRoot: xmlRootRule({
      container: "DataProcessor",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    }),
    internalInfo: internalInfoRule({
      xmlParents: [],
      forReferenceOnly: true,
      items: [
        { name: "DataProcessorObject", category: "Object" },
        { name: "DataProcessorManager", category: "Manager" },
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
    defaultForm: stringRule({
      yaml: "ОсновнаяФорма",
      xmlParents: properties,
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
    }),
    auxiliaryForm: stringRule({
      yaml: "ДополнительнаяФорма",
      xmlParents: properties,
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
    }),
    includeHelpInContents: booleanRule({
      yaml: "ВключатьСправкуВСодержание",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: properties,
    }),
    extendedPresentation: i8nTextRule({
      yaml: "РасширенноеПредставление",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
    explanation: i8nTextRule({
      yaml: "Пояснение",
      xmlParents: properties,
      defaultValueXMLRaw: "",
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
      ...({ itemRule: MetadataDataProcessorAttributeRules } as {
        itemRule: MetadataItemRule
      }),
    }),
    tabularSections: metadataDataProcessorTabularSectionsRule({
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
  childCollections: [
    { propertyKey: "commands", configurationIndexUidSegment: "Команда", itemRule: MetadataDataProcessorCommandRules },
  ],
} as const satisfies MetadataItemRule
