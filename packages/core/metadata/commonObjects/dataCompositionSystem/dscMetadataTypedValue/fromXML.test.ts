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

  it("imports v8 Type Undefined as missing value", () => {
    const result = testImportPropertyFromXML({
      rule,
      xmlRootTag: "value",
      xmlString:
        '<value xmlns:d8p1="http://v8.1c.ru/8.2/data/types" xsi:type="v8:Type">d8p1:Undefined</value>',
    })

    expect(result).toBeUndefined()
  })

  it("imports xsi:nil as missing value", () => {
    const result = testImportPropertyFromXML({
      rule,
      xmlRootTag: "value",
      xmlString: '<value xsi:nil="true"/>',
    })

    expect(result).toBeUndefined()
  })

  it("preserves xsi:nil position inside value array", () => {
    const result = testImportPropertyFromXML({
      rule,
      xmlRootTag: "value",
      xmlString:
        '<value xsi:type="dcscor:DesignTimeValue">x</value>\n' +
        '<value xsi:nil="true"/>\n' +
        '<value xsi:type="dcscor:DesignTimeValue">y</value>',
    })

    expect(result).toEqual([
      { type: "DesignTimeValue", value: "x" },
      undefined,
      { type: "DesignTimeValue", value: "y" },
    ])
  })

  it("imports reference v8 Type Undefined as raw XML", () => {
    const result = testImportPropertyFromXML({
      rule,
      xmlRootTag: "value",
      xmlString:
        '<value xmlns:d8p1="http://v8.1c.ru/8.2/data/types" xsi:type="v8:Type">d8p1:Undefined</value>',
      forReference: true,
    })

    expect(result).toEqual({
      "_xmlns:d8p1": "http://v8.1c.ru/8.2/data/types",
      "_xsi:type": "v8:Type",
      "#text": "d8p1:Undefined",
    })
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
