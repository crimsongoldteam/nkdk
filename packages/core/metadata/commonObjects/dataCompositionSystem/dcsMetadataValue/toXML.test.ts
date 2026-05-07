import { describe, expect, it } from "vitest"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { dcsMetadataValueXMLFixtures } from "./__fixtures__/data"

describe("export MetadataDcsMetadataValue to XML", () => {
  it.each(dcsMetadataValueXMLFixtures)("exports $title", (fixture) => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule: fixture.rule,
      value: fixture.value,
      xmlRootTag: "dcscor:value",
      importMetaUrl: import.meta.url,
      path: fixture.xml,
    })

    expect(result).toEqual(expectedResult)
  })
})
