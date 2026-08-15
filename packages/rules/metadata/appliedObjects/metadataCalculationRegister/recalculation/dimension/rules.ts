import type { MetadataItemRule, YAMLPropertySource } from "@nkdk/runtime/rule-kit"
import { i8nTextRule } from "../../../../commonObjects/i8nText/types"
import { metadataItemLinkRule, metadataItemLinksRule } from "../../../../commonObjects/metadataPath/types"
import { stringRule } from "../../../../commonObjects/string/types"
import { uuidPropertyRule } from "../../../../commonObjects/uuid/rule"
import { systemEnumerationRule } from "../../../../systemEnumerations/types"

const properties = ["Properties"]

const hasOwnProperty =
  (propertyKey: string) =>
  (source: YAMLPropertySource | unknown): boolean =>
    source !== null &&
    source !== undefined &&
    typeof source === "object" &&
    ("has" in source && typeof source.has === "function"
      ? source.has(propertyKey)
      : Object.prototype.hasOwnProperty.call(source, propertyKey))

export const MetadataCalculationRegisterRecalculationDimensionRules = {
  itemType: "MetadataCalculationRegisterRecalculationDimension",
  metadataTargetOwner: { kind: "inherit" },
  externalMetadata: { segment: "Dimension", placement: "ownerChild" },
  xmlOrder: [
    "objectBelonging",
    "name",
    "synonym",
    "comment",
    "registerDimension",
    "leadingRegisterData",
    "extendedConfigurationObject",
    "uuid",
  ],
  properties: {
    uuid: uuidPropertyRule,
    name: stringRule({
      xml: "Name",
      required: true,
      xmlParents: properties,
    }),
    synonym: i8nTextRule({
      yaml: "Синоним",
      xml: "Synonym",
      xmlParents: properties,
      defaultValueXMLRaw: "",
      excludeIfEqualNameYAML: true,
    }),
    comment: stringRule({
      yaml: "Комментарий",
      xml: "Comment",
      xmlParents: properties,
      defaultValueXMLRaw: "",
      defaultValueAdoptedXML: "",
    }),
    registerDimension: metadataItemLinkRule({
      yaml: "ИзмерениеРегистра",
      xml: "RegisterDimension",
      xmlParents: properties,
      required: true,
      metadataTarget: {
        kind: "member",
        owner: "this",
        roots: ["CalculationRegister"],
        memberKinds: ["Dimension"],
      },
      toXML: hasOwnProperty("registerDimension"),
    }),
    leadingRegisterData: metadataItemLinksRule({
      yaml: "ДанныеВедущихРегистров",
      xml: "LeadingRegisterData",
      xmlParents: properties,
      defaultValueXMLRaw: "",
      metadataTarget: {
        kind: "member",
        owner: "this",
        roots: ["CalculationRegister"],
        memberKinds: ["Dimension"],
        allowedMemberPaths: [
          ["CalculationRegister", "Dimension"],
          ["CalculationRegister", "Attribute"],
        ],
      },
      toXML: hasOwnProperty("leadingRegisterData"),
    }),
    objectBelonging: systemEnumerationRule({
      yaml: "ПринадлежностьОбъекта",
      xml: "ObjectBelonging",
      typeSE: "ObjectBelonging",
      xmlParents: properties,
      toYAML: false,
      fromYAML: false,
      implicitValueYAML: "Native",
    }),
    extendedConfigurationObject: stringRule({
      xml: "ExtendedConfigurationObject",
      xmlParents: properties,
      runtimeOnly: true,
    }),
  },
} as const satisfies MetadataItemRule
