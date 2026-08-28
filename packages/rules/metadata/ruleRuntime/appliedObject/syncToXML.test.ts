import { describe, expect, it } from "vitest"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"

import { createDirectRoundTripContexts } from "../../../tests/directConversion"
import { withOperationRegistrySet } from "../../operations/operationExecutionContext"
import {
  createPropertyStateCapabilityRegistry,
  definePropertyStateItemCapabilities,
} from "../../appliedObjects/configurationExtension/propertyStateCapabilities"
import { isEmptySemanticConfigurationExtensionProperty } from "./syncToXML"

describe("isEmptySemanticConfigurationExtensionProperty", () => {
  it.each([
    ["full", false],
    ["adopted", true],
  ] as const)("для варианта %s возвращает %s", (variant, expected) => {
    const logicalAddress = "Catalog.Товары"
    const rule = {
      itemType: "SemanticVariantProbe",
      properties: {
        content: { type: "ExchangePlanContent", yaml: "Состав", xml: "Content" },
      },
    } as MetadataItemRule
    const contribution = definePropertyStateItemCapabilities(rule, {
      properties: {
        content: {
          availability: "borrowed",
          modes: ["extend"],
          representation: "semantic",
        },
      },
    })
    const contexts = createDirectRoundTripContexts({ logicalAddress })
    const base = contexts.exportContext()
    const context = {
      ...base,
      exportToXML: {
        ...base.exportToXML,
        componentKind: "configurationExtension",
        xmlDefaultVariantByLogicalAddress: { [logicalAddress]: variant },
      },
    }

    const result = withOperationRegistrySet({
      propertyStates: createPropertyStateCapabilityRegistry([contribution]),
    }, () => isEmptySemanticConfigurationExtensionProperty({
      context,
      itemType: rule.itemType,
      propertyKey: "content",
      yaml: [],
    }))

    expect(result).toBe(expected)
  })
})
