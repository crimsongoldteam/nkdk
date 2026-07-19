import { additionalIndexRule, metadataCommandsRule } from "../metadataAccountingRegister/builders"
import { metadataDocumentJournalColumnsRule } from "./builders"
import { childFormNamesRule } from "../../commonObjects/childFormNames/types"
import { childTemplateNamesRule } from "../../commonObjects/childTemplateNames/types"
import { helpRule } from "../../commonObjects/help/types"
import { internalInfoRule } from "../../commonObjects/internalInfo/types"
import { metadataItemLinksRule } from "../../commonObjects/metadataPath/types"
import { standardAttributeDescriptionsRule } from "../../commonObjects/standardAttributeDescription/builders"
import { booleanRule } from "../../commonObjects/boolean/types"
import { i8nTextRule } from "../../commonObjects/i8nText/types"
import { moduleRule } from "../../commonObjects/module/types"
import { stringRule } from "../../commonObjects/string/types"
import { uuidRule } from "../../commonObjects/uuid/types"
import { xmlRootRule } from "../../commonObjects/xmlRoot/types"
import { systemEnumerationRule } from "../../systemEnumerations/types"
import { V8_MDCLASSES_ROOT } from "../../orchestration/appliedObject/presets"
import type { MetadataItemRule } from "../../orchestration/property/types"
import { MetadataCommandRules } from "../metadataCommand/rules"
const properties = ["Properties"]
const childObjects = ["ChildObjects"]
export const MetadataDocumentJournalStandardAttributeNames: Record<string, string> = {
  Type: "Тип",
  Ref: "Ссылка",
  Date: "Дата",
  Posted: "Проведен",
  DeletionMark: "ПометкаУдаления",
  Number: "Номер",
}
const MetadataDocumentJournalCommandRules = {
  ...MetadataCommandRules,
  properties: {
    ...MetadataCommandRules.properties,
    commandModule: {
      ...MetadataCommandRules.properties.commandModule,
      xmlPath: ({ name }: { name: string }) => `Commands/${name}/Ext/CommandModule.bsl`,
    },
  },
} as const satisfies MetadataItemRule
export const MetadataDocumentJournalRules = {
  itemType: "MetadataDocumentJournal",
  metadataTargetOwner: { kind: "self", root: "DocumentJournal" },
  itemTypePrefix: "ЖурналДокументов",
  xmlDir: "DocumentJournals",
  properties: {
    xmlRoot: xmlRootRule({
      container: "DocumentJournal",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    }),
    internalInfo: internalInfoRule({
      xmlParents: [],
      forReferenceOnly: true,
      items: [
        { name: "DocumentJournalSelection", category: "Selection" },
        { name: "DocumentJournalList", category: "List" },
        { name: "DocumentJournalManager", category: "Manager" },
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
    useStandardCommands: booleanRule({
      yaml: "ИспользоватьСтандартныеКоманды",
      defaultValueXML: true,
      implicitValueYAML: true,
      xmlParents: properties,
    }),
    registeredDocuments: metadataItemLinksRule({
      yaml: "РегистрируемыеДокументы",
      metadataTarget: { kind: "object", roots: ["Document"] },
      xml: "RegisteredDocuments",
      xmlParents: properties,
    }),
    includeHelpInContents: booleanRule({
      yaml: "ВключатьСправкуВСодержание",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: properties,
    }),
    standardAttributes: standardAttributeDescriptionsRule({
      yaml: "СтандартныеРеквизиты",
      standartAttributeNames: MetadataDocumentJournalStandardAttributeNames,
      xmlParents: properties,
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
    columns: metadataDocumentJournalColumnsRule({
      yaml: "Графы",
      xmlParents: childObjects,
      xml: "Column",
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
  childCollections: [
    { propertyKey: "commands", configurationIndexUidSegment: "Команда", itemRule: MetadataDocumentJournalCommandRules },
  ],
} as const satisfies MetadataItemRule
