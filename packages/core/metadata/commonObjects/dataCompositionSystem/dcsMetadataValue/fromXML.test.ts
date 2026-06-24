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

  it("imports LocalFormattedStringType DesignTimeValue", () => {
    const result = testImportPropertyFromXML({
      rule: { type: "MetadataDcsMetadataValue", valueType: "DesignTimeValue", yaml: "value" },
      xmlRootTag: "dcscor:value",
      xmlString: `<dcscor:value xsi:type="v8:LocalFormattedStringType">
\t<v8:lws>
\t\t<v8:item>
\t\t\t<v8:lang>ru</v8:lang>
\t\t\t<v8:content>Многоязычная форматированная строка</v8:content>
\t\t</v8:item>
\t</v8:lws>
\t<v8:formatted>true</v8:formatted>
</dcscor:value>`,
    })

    expect(result).toEqual({
      type: "LocalFormattedStringType",
      value: {
        formatted: true,
        items: { ru: "Многоязычная форматированная строка" },
      },
    })
  })
})
