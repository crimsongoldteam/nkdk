import { describe, expect, it } from "vitest"
import { readXMLFixtureAsString } from "~/tests/readFixtureXML"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { importContentFromXML } from "~/xml/import/importer"
import { typedNumberRule, typedNumberValue } from "./__fixtures__/data"

describe("exportNumberToXML", () => {
  it("exports typed decimal to XML", () => {
    const { result } = testExportPropertyToXML({
      rule: typedNumberRule,
      value: typedNumberValue,
      xmlRootTag: "MinValue",
    })

    expect(importContentFromXML(result)).toEqual(
      importContentFromXML(readXMLFixtureAsString(import.meta.url, "typed.xml"))
    )
  })
})
