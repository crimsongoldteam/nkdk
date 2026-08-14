import { metadataItemLinksRule } from "../metadataPath/types"
import { typeDescriptionRule } from "../typeDescription/types"
import { i8nTextRule } from "../i8nText/types"
import { stringRule } from "../string/types"
import { systemEnumerationRule } from "../../systemEnumerations/types"
import { uuidPropertyRule } from "../uuid/rule"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
export const MetadataDocumentJournalColumnRules = {
  itemType: "MetadataDocumentJournalColumn",
  xmlOrder: [
    "objectBelonging",
    "name",
    "synonym",
    "comment",
    "indexing",
    "references",
    "uuid",
  ],
  properties: {
    name: stringRule({
      xml: "Name",
      description: "Имя колонки журнала документов.",
      required: true,
      xmlParents: ["Properties"],
    }),
    synonym: i8nTextRule({
      yaml: "Синоним",
      xml: "Synonym",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: "",
      excludeIfEqualNameYAML: true,
    }),
    references: metadataItemLinksRule({
      yaml: "Ссылки",
      xml: "References",
      metadataTarget: { kind: "member", owner: "explicit" },
      xmlParents: ["Properties"],
      defaultValueXMLRaw: {},
    }),
    comment: stringRule({
      yaml: "Комментарий",
      xml: "Comment",
      description: "Комментарий колонки журнала документов.",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: "",
      defaultValueAdoptedXML: "",
    }),
    type: typeDescriptionRule({
      yaml: "Тип",
      xml: "Type",
      xmlParents: ["Properties"],
    }),
    uuid: uuidPropertyRule,
    indexing: systemEnumerationRule({
      yaml: "Индексирование",
      xml: "Indexing",
      typeSE: "Indexing",
      xmlParents: ["Properties"],
      defaultValueXML: "DontIndex",
      implicitValueYAML: "DontIndex",
    }),
    objectBelonging: systemEnumerationRule({
      yaml: "ПринадлежностьОбъекта",
      xml: "ObjectBelonging",
      typeSE: "ObjectBelonging",
      xmlParents: ["Properties"],
      toYAML: false,
      fromYAML: false,
      implicitValueYAML: "Native",
    }),
  },
} as const satisfies MetadataItemRule
