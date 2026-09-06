import { describe, expect, it } from "vitest"
import { testImportPropertyFromXML } from "../../../../tests/property/importPropertyFromXML"
import { dcsMetadataValueFromXMLFixtures } from "./__fixtures__/data"
import { parseXmlDocumentWithSaxes, xmlElementChildren } from "@nkdk/runtime"
import { readXMLFixtureAsString } from "../../../../tests/readFixtureXML"
import { mockContextFromXML } from "../../../../tests/mockContext"
import { importDcsMetadataValueFromDcsXML } from "./fromXML"

describe("import MetadataDcsMetadataValue from XML", () => {
  it.each(dcsMetadataValueFromXMLFixtures)("imports structural $title", (fixture) => {
    const source = parseXmlDocumentWithSaxes(readXMLFixtureAsString(import.meta.url, fixture.xml)).roots[0]!
    const nodes = [source]
    for (const node of nodes) {
      nodes.push(...xmlElementChildren(node))
      Object.defineProperty(node, "compatibilityValue", { get() { throw new Error("Compatibility XML must not be read") } })
    }
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
