import { uuidPropertyRule } from "~/metadata/commonObjects/uuid/rule"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"

export const MetadataSequenceDimensionRules = {
  itemType: "MetadataSequenceDimension",
  externalMetadata: { segment: "Dimension", placement: "ownerChild" },
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
    documentMap: {
      yaml: "СоответствиеРеквизитамДокументов",
      xml: "DocumentMap",
      type: "MetadataItemLinks",
      metadataTarget: { kind: "member", owner: "explicit" },
      xmlParents: ["Properties"],
      defaultValueXMLRaw: "",
    },
    registerRecordsMap: {
      yaml: "СоответствиеРеквизитамДвижений",
      xml: "RegisterRecordsMap",
      type: "MetadataItemLinks",
      metadataTarget: { kind: "member", owner: "explicit" },
      xmlParents: ["Properties"],
      defaultValueXMLRaw: "",
    },
  },
} as const satisfies MetadataItemRule
