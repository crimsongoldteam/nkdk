import { i8nTextRule } from "~/metadata/commonObjects/i8nText/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { uuidPropertyRule } from "~/metadata/commonObjects/uuid/rule"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"
export const MetadataSequenceDimensionRules = {
  itemType: "MetadataSequenceDimension",
  externalMetadata: { segment: "Dimension", placement: "ownerChild" },
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
    }),
    comment: stringRule({
      yaml: "Комментарий",
      xml: "Comment",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: "",
    }),
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
