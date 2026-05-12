import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"
import { dcsMetadataTypedValueFixtures, emptyValueListTypedValue } from "./__fixtures__/data"

const rule: PropertyRule = {
  type: "DcsMetadataTypedValue" as any,
  yaml: "value",
}

describe("import DcsMetadataTypedValue from XML", () => {
  it.each(dcsMetadataTypedValueFixtures)("imports $name", (fixture) => {
    expect(
      testImportPropertyFromXML({
        rule,
        xmlRootTag: "value",
        xmlString: fixture.XML,
      })
    ).toEqual(fixture.model)
  })

  it("imports empty ValueListType", () => {
    expect(
      testImportPropertyFromXML({
        rule,
        xmlRootTag: "value",
        path: "emptyValueList.xml",
        importMetaUrl: import.meta.url,
      })
    ).toEqual(emptyValueListTypedValue)
  })
})
