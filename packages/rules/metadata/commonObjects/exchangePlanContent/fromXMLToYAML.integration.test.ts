import { describe, expect, it } from "vitest"

import { readAppliedObjectFixture, testMetadataItemFromXMLToYAML } from "../../../tests/directConversion"
import { contentYAML } from "./__fixtures__/data"
import { ExchangePlanContentRules } from "./rules"

import "./register"

describe("ExchangePlanContent XML → YAML", () => {
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
