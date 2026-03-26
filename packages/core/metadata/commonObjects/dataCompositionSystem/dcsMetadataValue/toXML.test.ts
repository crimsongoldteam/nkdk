import { describe, expect, it } from "vitest"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { importContentFromXML } from "~/xml/import/importer"
import { dcsMetadataValueFixtures } from "./__fixtures__/data"

describe("export MetadataDcsMetadataValue to XML", () => {
  it.each(dcsMetadataValueFixtures)("exports $title", (fixture) => {
    const { result } = testExportPropertyToXML({
      rule: fixture.rule,
      value: fixture.value,
      xmlRootTag: "root",
      applyNumberingIds: false,
    })

    expect(importContentFromXML(result)).toEqual(importContentFromXML(`<root>${fixture.xml}</root>`))
  })
})
