import { metadataItemLinksRule } from "~/metadata/commonObjects/metadataPath/types"
import { typeDescriptionRule } from "~/metadata/commonObjects/typeDescription/types"
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
