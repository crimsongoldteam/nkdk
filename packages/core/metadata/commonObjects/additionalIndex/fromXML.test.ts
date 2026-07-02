import { describe, expect, it } from "vitest"
import { importMetadataItemFromXML } from "../../orchestration"
import { mockContextFromXML } from "../../../tests/mockContext"
import { readXMLFixtureAsString } from "../../../tests/readFixtureXML"
import { AdditionalIndexRules } from "./rules"

// Активируем регистрацию правила
import "./types"

describe("import AdditionalIndex from XML", () => {
  it("imports full.xml", () => {
    const xmlString = readXMLFixtureAsString(import.meta.url, "full.xml")
    const result = importMetadataItemFromXML({
      context: mockContextFromXML(),
      rule: AdditionalIndexRules,
      xmlString,
    })
    expect(result).toMatchObject({
      itemType: "AdditionalIndex",
      items: expect.any(Array),
    })
    expect(result?.items?.length ?? 0).toBe(1)
    const index = result!.items![0]
    expect(index).toMatchObject({
      name: "Индекс1",
      table: "Catalog.СправочникCоВсемиОбъектами",
      indexedFields: ["Ref"],
      additionalFields: ["Description"],
    })
  })
})
