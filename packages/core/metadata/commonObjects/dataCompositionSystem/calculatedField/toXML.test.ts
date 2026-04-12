import { describe, expect, it } from "vitest"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { fullCalculatedField } from "./__fixtures__/data"
import "./types"

describe("export CalculatedField to XML", () => {
  it("exports full.xml", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule: { type: "CalculatedField" },
      value: fullCalculatedField,
      xmlRootTag: "CalculatedField",
      path: "full.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })
})
