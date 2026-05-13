import { uuidPropertyRule } from "~/metadata/commonObjects/uuid/rule"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"

export const MetadataDocumentJournalColumnRules = {
  itemType: "MetadataDocumentJournalColumn",
  properties: {
    uuid: uuidPropertyRule,
    name: {
      xml: "Name",
      type: "string",
      required: true,
      xmlParents: ["Properties"],
    },
    synonym: {
      yaml: "Синоним",
      xml: "Synonym",
      type: "I8nText",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: "",
    },
    comment: {
      yaml: "Комментарий",
      xml: "Comment",
      type: "string",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: "",
    },
    type: {
      yaml: "Тип",
      xml: "Type",
      type: "TypeDescription",
      xmlParents: ["Properties"],
    },
    references: {
      yaml: "Ссылки",
      xml: "References",
      type: "MetadataItemLinks",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: {},
    },
    indexing: {
      yaml: "Индексирование",
      xml: "Indexing",
      type: "SystemEnumeration",
      typeSE: "Indexing",
      xmlParents: ["Properties"],
      defaultValueXML: "DontIndex",
      defaultValueYAML: "DontIndex",
    },
    objectBelonging: {
      yaml: "ПринадлежностьОбъекта",
      xml: "ObjectBelonging",
      type: "SystemEnumeration",
      typeSE: "ObjectBelonging",
      xmlParents: ["Properties"],
      toYAML: false,
      fromYAML: false,
      defaultValueYAML: "Native",
    },
  },
} as const satisfies MetadataItemRule
