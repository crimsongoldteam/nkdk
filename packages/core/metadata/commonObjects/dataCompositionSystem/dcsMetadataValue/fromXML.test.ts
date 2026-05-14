import { describe, expect, it } from "vitest"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"
import { dcsMetadataValueFromXMLFixtures } from "./__fixtures__/data"

describe("import MetadataDcsMetadataValue from XML", () => {
  it.each(dcsMetadataValueFromXMLFixtures)("imports $title", (fixture) => {
    expect(
      testImportPropertyFromXML({
        rule: fixture.rule,
        xmlRootTag: "dcscor:value",
        importMetaUrl: import.meta.url,
        path: fixture.xml,
      })
    ).toEqual(fixture.value)
  })
})
