import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { definePropertyStateItemCapabilities } from "./propertyStateCapabilities"

export const clearedReferenceRule = {
  itemType: "MetadataTaskAddressingAttribute",
  properties: {
    addressingDimension: {
      type: "string",
      yaml: "ИзмерениеАдресации",
      xml: "AddressingDimension",
      xmlParents: ["Properties"],
      metadataTarget: {
        kind: "member",
        owner: "explicit",
        objectRoots: ["InformationRegister"],
        memberKinds: ["Dimension"],
      },
    },
  },
} as const satisfies MetadataItemRule

export const clearedReferencePropertyStateCapabilities = definePropertyStateItemCapabilities(
  clearedReferenceRule,
  {
    properties: {
      addressingDimension: {
        availability: "borrowed",
        modes: ["control", "notify", "extend"],
        representation: "tagged",
      },
    },
  },
)
