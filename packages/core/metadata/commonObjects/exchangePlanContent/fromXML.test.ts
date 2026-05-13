import { describe, expect, it } from "vitest"
import { importMetadataItemFromXML } from "~/metadata/orchestration"
import { mockContextFromXML } from "~/tests/mockContext"
import { readXMLFixtureAsString } from "~/tests/readFixtureXML"
import { content } from "./__fixtures__/data"
import { ExchangePlanContentRules } from "./rules"

import "./register"

describe("import ExchangePlanContent from XML", () => {
  it("imports content items with Allow and Deny auto record", () => {
    const xmlString = readXMLFixtureAsString(import.meta.url, "content.xml")

    const result = importMetadataItemFromXML({
      context: mockContextFromXML(),
      rule: ExchangePlanContentRules,
      xmlString,
    })

    expect(result).toEqual(content)
  })
})
