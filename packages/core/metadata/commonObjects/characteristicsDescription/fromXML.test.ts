import { describe, expect, it } from "vitest"
import { multipleCharacteristics, singleCharacteristic } from "./__fixtures__/data"
import { testImportPropertyFromXML } from "../../../tests/property/importPropertyFromXML"

const rule = { type: "CharacteristicsDescriptions" } as const

describe("import CharacteristicsDescriptions from XML", () => {
  it("round-trip: single (import → re-import equals original)", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "single.xml",
      xmlRootTag: "Characteristics",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(singleCharacteristic)
  })

  it("round-trip: multiple (import → re-import equals original)", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "multiple.xml",
      xmlRootTag: "Characteristics",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(multipleCharacteristics)
  })

  it("should import single characteristic", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "single.xml",
      xmlRootTag: "Characteristics",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(singleCharacteristic)
  })

  it("should import multiple characteristics", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "multiple.xml",
      xmlRootTag: "Characteristics",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(multipleCharacteristics)
  })
})
