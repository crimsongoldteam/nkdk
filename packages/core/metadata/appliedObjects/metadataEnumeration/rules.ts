import { metadataCommandsRule } from "../metadataAccountingRegister/builders"
import { metadataEnumerationValuesRule } from "./builders"
import { characteristicsDescriptionsRule } from "../../commonObjects/characteristicsDescription/types"
import { childFormNamesRule } from "../../commonObjects/childFormNames/types"
import { childTemplateNamesRule } from "../../commonObjects/childTemplateNames/types"
import { internalInfoRule } from "../../commonObjects/internalInfo/types"
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
    uuid: uuidRule({
      xml: "_uuid",
      forReferenceOnly: true,
      xmlParents: [],
    }),
    name: stringRule({
      yaml: "Имя",
      xml: "Name",
      required: true,
      xmlParents: enumProperties,
    }),
    synonym: i8nTextRule({
      yaml: "Синоним",
      xml: "Synonym",
      xmlParents: enumProperties,
      defaultValueXMLRaw: "",
      excludeIfEqualNameYAML: true,
    }),
    comment: stringRule({
      yaml: "Комментарий",
      xml: "Comment",
      xmlParents: enumProperties,
      defaultValueXMLRaw: "",
    }),
    objectBelonging: systemEnumerationRule({
      yaml: "ПринадлежностьОбъекта",
      xml: "ObjectBelonging",
      typeSE: "ObjectBelonging",
      xmlParents: enumProperties,
      noImplicitValueYAML: true,
    }),
    extendedConfigurationObject: stringRule({
      yaml: "ОбъектРасширяемойКонфигурации",
      runtimeOnly: true,
    }),
  },
} as const satisfies MetadataItemRule
export const MetadataEnumerationRules = {
  itemType: "MetadataEnumeration",
  metadataTargetOwner: { kind: "self", root: "Enum" },
  itemTypePrefix: "Перечисление",
  xmlDir: "Enums",
  properties: {
    xmlRoot: xmlRootRule({
      container: "Enum",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
    }),
    internalInfo: internalInfoRule({
      xmlParents: [],
      forReferenceOnly: true,
      items: [
        { name: "EnumRef", category: "Ref" },
        { name: "EnumManager", category: "Manager" },
        { name: "EnumList", category: "List" },
      ],
    }),
    uuid: uuidRule({
      xml: "_uuid",
      forReferenceOnly: true,
      xmlParents: [],
    }),
    name: stringRule({
      xmlParents: enumProperties,
      required: true,
    }),
    synonym: i8nTextRule({
      yaml: "Синоним",
      xmlParents: enumProperties,
      defaultValueXMLRaw: "",
      excludeIfEqualNameYAML: true,
    }),
    comment: stringRule({
      yaml: "Комментарий",
      xmlParents: enumProperties,
      defaultValueXMLRaw: "",
    }),
    objectBelonging: systemEnumerationRule({
      yaml: "ПринадлежностьОбъекта",
      typeSE: "ObjectBelonging",
      xmlParents: enumProperties,
      noImplicitValueYAML: true,
    }),
    extendedConfigurationObject: stringRule({
      yaml: "ОбъектРасширяемойКонфигурации",
      runtimeOnly: true,
    }),
    useStandardCommands: booleanRule({
      yaml: "ИспользоватьСтандартныеКоманды",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: enumProperties,
    }),
    standardAttributes: standardAttributeDescriptionsRule({
      yaml: "СтандартныеРеквизиты",
      standartAttributeNames: MetadataEnumerationStandardAttributeNames,
      xmlParents: enumProperties,
    }),
    characteristics: characteristicsDescriptionsRule({
      yaml: "Характеристики",
      xmlParents: enumProperties,
      defaultValueXMLRaw: {},
    }),
    quickChoice: booleanRule({
      yaml: "БыстрыйВыбор",
      defaultValueXML: true,
      implicitValueYAML: true,
      xmlParents: enumProperties,
    }),
    choiceMode: systemEnumerationRule({
      yaml: "СпособВыбора",
      typeSE: "ChoiceMode",
      defaultValueXML: "BothWays",
      implicitValueYAML: "BothWays",
      xmlParents: enumProperties,
    }),
    defaultListForm: stringRule({
      yaml: "ОсновнаяФормаСписка",
      xmlParents: enumProperties,
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
    }),
    defaultChoiceForm: stringRule({
      yaml: "ОсновнаяФормаДляВыбора",
      xmlParents: enumProperties,
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
    }),
    auxiliaryListForm: stringRule({
      yaml: "ДополнительнаяФормаСписка",
      xmlParents: enumProperties,
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
    }),
    auxiliaryChoiceForm: stringRule({
      yaml: "ДополнительнаяФормаДляВыбора",
      xmlParents: enumProperties,
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
    }),
    managerModule: moduleRule({
      externalMetadata: { segment: "ManagerModule", placement: "derivedEntry" },
      nkdkPath: "МодульМенеджера.bsl",
      xmlPath: "Ext/ManagerModule.bsl",
    }),
    listPresentation: i8nTextRule({
      yaml: "ПредставлениеСписка",
      xmlParents: enumProperties,
      defaultValueXMLRaw: "",
    }),
    extendedListPresentation: i8nTextRule({
      yaml: "РасширенноеПредставлениеСписка",
      xmlParents: enumProperties,
      defaultValueXMLRaw: "",
    }),
    explanation: i8nTextRule({
      yaml: "Пояснение",
      xmlParents: enumProperties,
      defaultValueXMLRaw: "",
    }),
    choiceHistoryOnInput: systemEnumerationRule({
      yaml: "ИсторияВыбораПриВводе",
      typeSE: "ChoiceHistoryOnInput",
      defaultValueXML: "Auto",
      implicitValueYAML: "Auto",
      xmlParents: enumProperties,
    }),
    enumValues: metadataEnumerationValuesRule({
      yaml: "Значения",
      xmlParents: enumChildObjects,
      xml: "EnumValue",
      configurationIndexUidSegment: "Значение",
    }),
    commands: metadataCommandsRule({
      yaml: "Команды",
      xmlParents: enumChildObjects,
      xml: "Command",
    }),
    forms: childFormNamesRule({
      xml: "Form",
      folderName: "Формы",
      forReferenceOnly: true,
      xmlParents: enumChildObjects,
    }),
    templates: childTemplateNamesRule({
      xml: "Template",
      folderName: "Шаблоны",
      forReferenceOnly: true,
      xmlParents: enumChildObjects,
    }),
  },
  childCollections: [
    { propertyKey: "commands", configurationIndexUidSegment: "Команда", itemRule: MetadataCommandRules },
  ],
} as const satisfies MetadataItemRule
