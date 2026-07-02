import { metadataItemLinksRule } from "~/metadata/commonObjects/metadataPath/types"
import { typeDescriptionRule } from "~/metadata/commonObjects/typeDescription/types"
import { i8nTextRule } from "~/metadata/commonObjects/i8nText/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
import { uuidPropertyRule } from "~/metadata/commonObjects/uuid/rule"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"
export const MetadataDocumentJournalColumnRules = {
  itemType: "MetadataDocumentJournalColumn",
  properties: {
    uuid: uuidPropertyRule,
    name: stringRule({
      xml: "Name",
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
    comment: stringRule({
      yaml: "Комментарий",
      xml: "Comment",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: "",
    }),
    type: typeDescriptionRule({
      yaml: "Тип",
      xml: "Type",
      xmlParents: ["Properties"],
    }),
    references: metadataItemLinksRule({
      yaml: "Ссылки",
      xml: "References",
      metadataTarget: { kind: "member", owner: "explicit" },
      xmlParents: ["Properties"],
      defaultValueXMLRaw: {},
    }),
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
