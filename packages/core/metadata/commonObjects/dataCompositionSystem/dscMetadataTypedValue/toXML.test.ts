import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { dcsMetadataTypedValueFixtures } from "./__fixtures__/data"

const rule: PropertyRule = {
  type: "DcsMetadataTypedValue" as any,
  yaml: "value",
}

describe("export DcsMetadataTypedValue to XML", () => {
  it.each(dcsMetadataTypedValueFixtures)("exports $name", (fixture) => {
    const { result } = testExportPropertyToXML({
      rule,
      value: fixture.model,
      xmlRootTag: "value",
    })

    expect(result).toEqual(fixture.XML)
  })
})
