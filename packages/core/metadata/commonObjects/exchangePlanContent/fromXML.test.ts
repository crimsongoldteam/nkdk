import { describe, expect, it } from "vitest"
import { importMetadataItemFromXML } from "../../orchestration"
import { mockContextFromXML } from "../../../tests/mockContext"
import { readXMLFixtureAsString } from "../../../tests/readFixtureXML"
import { content } from "./__fixtures__/data"
import { ExchangePlanContentRules } from "./rules"

import "./register"

const emptyContentXML =
  '\uFEFF<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<ExchangePlanContent xmlns="http://v8.1c.ru/8.3/xcf/extrnprops" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20"/>'

const emptyContent = {
  itemType: "ExchangePlanContent" as const,
  items: [],
}

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

  it("imports empty content as an explicit empty list", () => {
    const result = importMetadataItemFromXML({
      context: mockContextFromXML(),
      rule: ExchangePlanContentRules,
      xmlString: emptyContentXML,
    })

    expect(result).toEqual(emptyContent)
  })
})
