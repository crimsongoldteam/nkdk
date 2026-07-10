import { metadataItemLinksRule } from "../metadataPath/types"
import { typeDescriptionRule } from "../typeDescription/types"
import { i8nTextRule } from "../i8nText/types"
import { stringRule } from "../string/types"
import { uuidPropertyRule } from "../uuid/rule"
import type { MetadataItemRule } from "../../orchestration/property/types"
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
    documentMap: metadataItemLinksRule({
      yaml: "СоответствиеРеквизитамДокументов",
      xml: "DocumentMap",
      metadataTarget: { kind: "member", owner: "explicit" },
      xmlParents: ["Properties"],
      defaultValueXMLRaw: "",
    }),
    registerRecordsMap: metadataItemLinksRule({
      yaml: "СоответствиеРеквизитамДвижений",
      xml: "RegisterRecordsMap",
      metadataTarget: { kind: "member", owner: "explicit" },
      xmlParents: ["Properties"],
      defaultValueXMLRaw: "",
    }),
  },
} as const satisfies MetadataItemRule
