import { describe, expect, it } from "vitest"
import { multipleCharacteristics, singleCharacteristic } from "./__fixtures__/data"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"

const rule = { type: "CharacteristicsDescriptions" } as const

describe("export CharacteristicsDescriptions to XML", () => {
  it("should export single characteristic (round-trip)", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: singleCharacteristic,
      xmlRootTag: "Characteristics",
      path: "single.xml",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(expectedResult)
  })

  it("should export multiple characteristics (round-trip)", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: multipleCharacteristics,
      xmlRootTag: "Characteristics",
      path: "multiple.xml",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(expectedResult)
  })
})
