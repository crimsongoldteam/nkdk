import { describe, expect, it } from "vitest"
import { XML_PRESENT_TAG_VALUE, serializeYAMLDocument } from "@nkdk/runtime"

import {
  readAppliedObjectFixture,
  testMetadataItemFromXMLToYAML,
  testPropertyFromXMLToYAML,
} from "../../../tests/directConversion"
import { contentYAML } from "./__fixtures__/data"
import { ExchangePlanContentRules } from "./rules"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"

import "./register"

describe("ExchangePlanContent XML → YAML", () => {
  const ownerRule = {
    itemType: "ExchangePlanContentOwnerProbe",
    properties: {
      content: {
        type: "ExchangePlanContent",
        yaml: "Состав",
        xml: "Content",
      },
    },
  } as const satisfies MetadataItemRule

  it("выводит пустой файл состава владельца как !xml/present", () => {
    const result = testPropertyFromXMLToYAML({
      rule: ownerRule,
      xml: { Content: { ExchangePlanContent: {} } },
    }).yaml

    expect(result).toEqual({ Состав: XML_PRESENT_TAG_VALUE })
    expect(serializeYAMLDocument(result).text).toBe("Состав: !xml/present")
  })

  it("не создаёт Состав при отсутствии файла", () => {
    expect(testPropertyFromXMLToYAML({ rule: ownerRule, xml: {} }).yaml).toEqual({})
  })

  it("imports content items with Allow and Deny auto record", () => {
    const xml = readAppliedObjectFixture(import.meta.url, "content.xml")

    expect(testMetadataItemFromXMLToYAML({ rule: ExchangePlanContentRules, xml }).yaml).toEqual(contentYAML)
  })

  it("imports empty content as an explicit empty list", () => {
    const xml = { ExchangePlanContent: {} }

    expect(testMetadataItemFromXMLToYAML({ rule: ExchangePlanContentRules, xml }).yaml).toEqual([])
  })

  it("exports content items with current AutoChangeRecord YAML values", () => {
    const xml = readAppliedObjectFixture(import.meta.url, "content.xml")

    expect(testMetadataItemFromXMLToYAML({ rule: ExchangePlanContentRules, xml }).yaml).toEqual(contentYAML)
  })

  it("exports empty content as []", () => {
    expect(
      testMetadataItemFromXMLToYAML({ rule: ExchangePlanContentRules, xml: { ExchangePlanContent: {} } }).yaml
    ).toEqual([])
  })
})
