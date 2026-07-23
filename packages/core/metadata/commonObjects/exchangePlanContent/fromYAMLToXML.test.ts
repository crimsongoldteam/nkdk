import { describe, expect, it } from "vitest"

import {
  readAppliedObjectFixture,
  serializeDirectXML,
  testMetadataItemFromYAMLToXML,
} from "../../../tests/directConversion"
import { readXMLFixtureAsString } from "../../../tests/readFixtureXML"
import { contentYAML } from "./__fixtures__/data"
import { ExchangePlanContentRules } from "./rules"

import "./register"

describe("ExchangePlanContent YAML → XML", () => {
  it("round-trips content items with Allow and Deny auto record", () => {
    const referenceXML = readAppliedObjectFixture(import.meta.url, "content.xml")
    const result = testMetadataItemFromYAMLToXML({
      rule: ExchangePlanContentRules,
      yaml: contentYAML,
      referenceXML,
    })

    expect(normalizeXML(serializeDirectXML(result.xml))).toBe(
      normalizeXML(readXMLFixtureAsString(import.meta.url, "content.xml"))
    )
  })

  it("imports content items with current AutoChangeRecord YAML values", () => {
    const result = testMetadataItemFromYAMLToXML({ rule: ExchangePlanContentRules, yaml: contentYAML })

    expect(result.xml).toMatchObject({
      ExchangePlanContent: {
        Item: expect.arrayContaining([
          expect.objectContaining({ Metadata: expect.any(String), AutoRecord: expect.any(String) }),
        ]),
      },
    })
  })

  it("imports [] as explicit empty content", () => {
    const result = testMetadataItemFromYAMLToXML({ rule: ExchangePlanContentRules, yaml: [] })

    expect(result.xml).toHaveProperty("ExchangePlanContent")
    expect(serializeDirectXML(result.xml)).not.toContain("<Item>")
  })

  it("exports empty content as an empty ExchangePlanContent container", () => {
    const result = testMetadataItemFromYAMLToXML({ rule: ExchangePlanContentRules, yaml: [] })
    const xml = serializeDirectXML(result.xml)

    expect(xml).toContain("<ExchangePlanContent")
    expect(xml).not.toContain("<Item>")
  })
})

const normalizeXML = (value: string): string => value.replace(/\r\n/g, "\n").trimEnd()
