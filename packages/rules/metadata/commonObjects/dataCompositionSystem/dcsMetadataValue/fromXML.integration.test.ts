import { describe, expect, it } from "vitest"
import { testImportPropertyFromXML } from "../../../../tests/property/importPropertyFromXML"
import { dcsMetadataValueFromXMLFixtures } from "./__fixtures__/data"
import { parseXmlDocumentWithSaxes } from "@nkdk/runtime"
import { parseStructuralXMLWithoutCompatibility } from "../../../../tests/structuralXML"
import { readXMLFixtureAsString } from "../../../../tests/readFixtureXML"
import { mockContextFromXML } from "../../../../tests/mockContext"
import { importDcsMetadataValueFromDcsXML } from "./fromXML"

describe("import MetadataDcsMetadataValue from XML", () => {
  it("does not turn a single wrapped value into an array", () => {
    const source = parseStructuralXMLWithoutCompatibility('<Root><dcscor:value xsi:type="xs:decimal">1</dcscor:value></Root>')
    expect(importDcsMetadataValueFromDcsXML(mockContextFromXML(), { type: "MetadataDcsMetadataValue", valueType: "Primitive" }, source)).toEqual({ type: "decimal", value: 1 })
  })

  it.each([
    ['<dcscor:value/>', "DCS MetadataValue: missing dcscor:value"],
    ['<dcscor:value xsi:type="Unknown"/>', "DCS MetadataValue: unsupported xsi:type Unknown"],
    ['<dcscor:value xsi:type="dcscor:DesignTimeValue"><![CDATA[]]></dcscor:value>', "DCS MetadataValue: invalid DesignTimeValue"],
  ])("reports structural value errors without serializing XML: %s", (xml, message) => {
    expect(() => importDcsMetadataValueFromDcsXML(mockContextFromXML(), { type: "MetadataDcsMetadataValue", valueType: "Primitive" }, parseStructuralXMLWithoutCompatibility(xml))).toThrow(message)
  })

  it.each(dcsMetadataValueFromXMLFixtures)("imports structural $title", (fixture) => {
    const source = parseStructuralXMLWithoutCompatibility(readXMLFixtureAsString(import.meta.url, fixture.xml))
    expect(importDcsMetadataValueFromDcsXML(mockContextFromXML(), fixture.rule, source)).toEqual(fixture.value)
  })

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

  it("imports repeated structural values without XML wrappers", () => {
    const source = parseXmlDocumentWithSaxes('<Root><dcscor:value xsi:type="xs:decimal">1</dcscor:value><dcscor:value xsi:nil="true"/></Root>').roots[0]!
    expect(importDcsMetadataValueFromDcsXML(mockContextFromXML(), { type: "MetadataDcsMetadataValue", valueType: "Primitive" }, source))
      .toEqual([{ type: "decimal", value: 1 }, null])
  })

  it.each([false, true])("imports LocalFormattedStringType DesignTimeValue, structural: %s", (structural) => {
    const rule = { type: "MetadataDcsMetadataValue", valueType: "DesignTimeValue", yaml: "value" } as const
    const xmlString = `<dcscor:value xsi:type="v8:LocalFormattedStringType">
\t<v8:lws>
\t\t<v8:item>
\t\t\t<v8:lang>ru</v8:lang>
\t\t\t<v8:content>Многоязычная форматированная строка</v8:content>
\t\t</v8:item>
\t</v8:lws>
\t<v8:formatted>true</v8:formatted>
</dcscor:value>`
    const result = structural
      ? importDcsMetadataValueFromDcsXML(mockContextFromXML(), rule, parseXmlDocumentWithSaxes(xmlString).roots[0]!)
      : testImportPropertyFromXML({ rule, xmlRootTag: "dcscor:value", xmlString })

    expect(result).toEqual({
      type: "LocalFormattedStringType",
      value: {
        formatted: true,
        items: { ru: "Многоязычная форматированная строка" },
      },
    })
  })
})
