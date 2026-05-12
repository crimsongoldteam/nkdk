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

  it("rejects non-empty ValueListType", () => {
    expect(() =>
      testImportPropertyFromXML({
        rule,
        xmlRootTag: "value",
        xmlString: `<value xsi:type="v8:ValueListType">
	<v8:valueType/>
	<v8:lastId xsi:type="xs:decimal">0</v8:lastId>
	<v8:item>
		<v8:id>0</v8:id>
	</v8:item>
</value>`,
      })
    ).toThrow("DcsMetadataTypedValue XML: unsupported non-empty v8:ValueListType")
  })
})
