import { describe, expect, it } from "vitest"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { dcsMetadataValueFixtures } from "./__fixtures__/data"

describe("export MetadataDcsMetadataValue to XML", () => {
  it.each(dcsMetadataValueFixtures)("exports $title", (fixture) => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule: fixture.rule,
      value: fixture.value,
      xmlRootTag: "root",
      path: `expected/${fixture.id}.xml`,
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })
})
