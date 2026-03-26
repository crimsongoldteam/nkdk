import { describe, expect, it } from "vitest"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"
import { dcsMetadataValueFixtures } from "./__fixtures__/data"

describe("import MetadataDcsMetadataValue from XML", () => {
  it.each(dcsMetadataValueFixtures)("imports $title", (fixture) => {
    expect(
      testImportPropertyFromXML({
        rule: fixture.rule,
        xmlRootTag: "root",
        xmlString: `<root>${fixture.xml}</root>`,
      })
    ).toEqual(fixture.value)
  })
})
