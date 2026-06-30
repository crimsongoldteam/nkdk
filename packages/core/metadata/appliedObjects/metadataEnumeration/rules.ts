import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"
import { MetadataCommandRules } from "../metadataCommand/rules"

const enumProperties = ["Properties"]
const enumChildObjects = ["ChildObjects"]

export const MetadataEnumerationStandardAttributeNames: Record<string, string> = {
  Order: "Порядок",
  Ref: "Ссылка",
}

export const MetadataEnumerationValueRules = {
  itemType: "MetadataEnumerationValue",
  externalMetadata: { segment: "EnumValue", placement: "ownerChild" },
  properties: {
    uuid: {
      type: "uuid",
      xml: "_uuid",
      forReferenceOnly: true,
      xmlParents: [],
    },
    name: {
      yaml: "Имя",
      xml: "Name",
      type: "string",
      required: true,
      xmlParents: enumProperties,
    },
    synonym: {
      yaml: "Синоним",
      xml: "Synonym",
      type: "I8nText",
      xmlParents: enumProperties,
      defaultValueXMLRaw: "",
    },
    comment: {
      yaml: "Комментарий",
      xml: "Comment",
      type: "string",
      xmlParents: enumProperties,
      defaultValueXMLRaw: "",
    },
    objectBelonging: {
      yaml: "ПринадлежностьОбъекта",
      xml: "ObjectBelonging",
      type: "SystemEnumeration",
      typeSE: "ObjectBelonging",
      xmlParents: enumProperties,
      noImplicitValueYAML: true,
    },
    extendedConfigurationObject: {
      yaml: "ОбъектРасширяемойКонфигурации",
      type: "string",
      runtimeOnly: true,
    },
  },
} as const satisfies MetadataItemRule

export const MetadataEnumerationRules = {
  itemType: "MetadataEnumeration",
  itemTypePrefix: "Перечисление",
  xmlDir: "Enums",
  properties: {
    xmlRoot: {
      type: "XMLRoot",
      container: "Enum",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
    },
    internalInfo: {
      type: "InternalInfo",
      xmlParents: [],
      forReferenceOnly: true,
      items: [
        { name: "EnumRef", category: "Ref" },
        { name: "EnumManager", category: "Manager" },
        { name: "EnumList", category: "List" },
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
      xmlParents: enumProperties,
      required: true,
    },
    synonym: {
      yaml: "Синоним",
      type: "I8nText",
      xmlParents: enumProperties,
      defaultValueXMLRaw: "",
    },
    comment: {
      yaml: "Комментарий",
      type: "string",
      xmlParents: enumProperties,
      defaultValueXMLRaw: "",
    },
    objectBelonging: {
      yaml: "ПринадлежностьОбъекта",
      type: "SystemEnumeration",
      typeSE: "ObjectBelonging",
      xmlParents: enumProperties,
      noImplicitValueYAML: true,
    },
    extendedConfigurationObject: {
      yaml: "ОбъектРасширяемойКонфигурации",
      type: "string",
      runtimeOnly: true,
    },
    useStandardCommands: {
      yaml: "ИспользоватьСтандартныеКоманды",
      type: "boolean",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: enumProperties,
    },
    standardAttributes: {
      yaml: "СтандартныеРеквизиты",
      type: "StandardAttributeDescriptions",
      standartAttributeNames: MetadataEnumerationStandardAttributeNames,
      xmlParents: enumProperties,
    },
    characteristics: {
      yaml: "Характеристики",
      type: "CharacteristicsDescriptions",
      xmlParents: enumProperties,
      defaultValueXMLRaw: {},
    },
    quickChoice: {
      yaml: "БыстрыйВыбор",
      type: "boolean",
      defaultValueXML: true,
      implicitValueYAML: true,
      xmlParents: enumProperties,
    },
    choiceMode: {
      yaml: "СпособВыбора",
      type: "SystemEnumeration",
      typeSE: "ChoiceMode",
      defaultValueXML: "BothWays",
      implicitValueYAML: "BothWays",
      xmlParents: enumProperties,
    },
    defaultListForm: {
      yaml: "ОсновнаяФормаСписка",
      type: "string",
      xmlParents: enumProperties,
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
    },
    defaultChoiceForm: {
      yaml: "ОсновнаяФормаДляВыбора",
      type: "string",
      xmlParents: enumProperties,
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
    },
    auxiliaryListForm: {
      yaml: "ДополнительнаяФормаСписка",
      type: "string",
      xmlParents: enumProperties,
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
    },
    auxiliaryChoiceForm: {
      yaml: "ДополнительнаяФормаДляВыбора",
      type: "string",
      xmlParents: enumProperties,
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
    },
    managerModule: {
      type: "Module",
      externalMetadata: { segment: "ManagerModule", placement: "derivedEntry" },
      nkdkPath: "МодульМенеджера.bsl",
      xmlPath: "Ext/ManagerModule.bsl",
    },
    listPresentation: {
      yaml: "ПредставлениеСписка",
      type: "I8nText",
      xmlParents: enumProperties,
      defaultValueXMLRaw: "",
    },
    extendedListPresentation: {
      yaml: "РасширенноеПредставлениеСписка",
      type: "I8nText",
      xmlParents: enumProperties,
      defaultValueXMLRaw: "",
    },
    explanation: {
      yaml: "Пояснение",
      type: "I8nText",
      xmlParents: enumProperties,
      defaultValueXMLRaw: "",
    },
    choiceHistoryOnInput: {
      yaml: "ИсторияВыбораПриВводе",
      type: "SystemEnumeration",
      typeSE: "ChoiceHistoryOnInput",
      defaultValueXML: "Auto",
      implicitValueYAML: "Auto",
      xmlParents: enumProperties,
    },
    enumValues: {
      yaml: "Значения",
      type: "MetadataEnumerationValues",
      xmlParents: enumChildObjects,
      xml: "EnumValue",
    },
    commands: {
      yaml: "Команды",
      type: "MetadataCommands",
      xmlParents: enumChildObjects,
      xml: "Command",
    },
    forms: {
      type: "ChildFormNames",
      xml: "Form",
      folderName: "Формы",
      forReferenceOnly: true,
      xmlParents: enumChildObjects,
    },
    templates: {
      type: "ChildTemplateNames",
      xml: "Template",
      folderName: "Шаблоны",
      forReferenceOnly: true,
      xmlParents: enumChildObjects,
    },
  },
  childCollections: [{ propertyKey: "commands", itemRule: MetadataCommandRules }],
} as const satisfies MetadataItemRule
