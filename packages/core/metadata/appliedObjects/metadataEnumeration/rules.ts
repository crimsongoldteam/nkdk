import { MetadataItemRule } from "~/metadata/orchestration/property/types"

const enumProperties = ["Enum", "Properties"]

export const MetadataEnumerationStandardAttributeNames: Record<string, string> = {
  Predefined: "Предопределенный",
  PredefinedDataName: "ИмяПредопределенныхДанных",
  Ref: "Ссылка",
}

export const MetadataEnumerationRules = {
  itemType: "MetadataEnumeration",
  itemTypePrefix: "Перечисление",
  properties: {
    uuid: {
      type: "string",
      xml: "_uuid",
      forReferenceOnly: true,
      xmlParents: ["Enum"],
    },
    auxiliaryChoiceForm: {
      yaml: "ДополнительнаяФормаДляВыбора",
      type: "string",
      xmlParents: enumProperties,
      referenceScope: { target: "this", kind: "Form" },
    },
    auxiliaryListForm: {
      yaml: "ДополнительнаяФормаСписка",
      type: "string",
      xmlParents: enumProperties,
      referenceScope: { target: "this", kind: "Form" },
    },
    comment: {
      yaml: "Комментарий",
      type: "string",
      xmlParents: enumProperties,
    },
    defaultChoiceForm: {
      yaml: "ОсновнаяФормаДляВыбора",
      type: "string",
      xmlParents: enumProperties,
      referenceScope: { target: "this", kind: "Form" },
    },
    defaultListForm: {
      yaml: "ОсновнаяФормаСписка",
      type: "string",
      xmlParents: enumProperties,
      referenceScope: { target: "this", kind: "Form" },
    },
    explanation: {
      yaml: "Пояснение",
      type: "I8nText",
      xmlParents: enumProperties,
    },
    extendedListPresentation: {
      yaml: "РасширенноеПредставлениеСписка",
      type: "I8nText",
      xmlParents: enumProperties,
    },
    extendedObjectPresentation: {
      yaml: "РасширенноеПредставлениеОбъекта",
      type: "I8nText",
      xmlParents: enumProperties,
    },
    fullTextSearch: {
      yaml: "ПолнотекстовыйПоиск",
      type: "SystemEnumeration",
      typeSE: "UseFullTextSearch",
      defaultValueXML: "Use",
      xmlParents: enumProperties,
    },
    listPresentation: {
      yaml: "ПредставлениеСписка",
      type: "I8nText",
      xmlParents: enumProperties,
    },
    name: {
      type: "string",
      xmlParents: enumProperties,
      required: true,
    },
    objectPresentation: {
      yaml: "ПредставлениеОбъекта",
      type: "I8nText",
      xmlParents: enumProperties,
    },
    standardAttributes: {
      yaml: "СтандартныеРеквизиты",
      type: "StandardAttributeDescriptions",
      standartAttributeNames: MetadataEnumerationStandardAttributeNames,
      xmlParents: enumProperties,
    },
    synonym: {
      yaml: "Синоним",
      type: "I8nText",
      xmlParents: enumProperties,
    },
    useStandardCommands: {
      yaml: "ИспользоватьСтандартныеКоманды",
      type: "boolean",
      defaultValueXML: true,
      xmlParents: enumProperties,
    },
    enumValues: {
      yaml: "Значения",
      type: "MetadataEnumerationValues",
      xmlParents: ["Enum", "EnumValues"],
      xml: "EnumValue",
    },
  },
} as const satisfies MetadataItemRule
