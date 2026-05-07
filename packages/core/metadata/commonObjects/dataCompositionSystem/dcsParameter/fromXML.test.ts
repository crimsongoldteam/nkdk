import { describe, expect, it } from "vitest"
import { exportPropertyToXML, PropertyRule } from "~/metadata/orchestration"
import { mockContextToXML } from "~/tests/mockContext"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"
import { xmlExport } from "~/xml/export/exporter"
import { fullDCSParameters, minimalDCSParameters } from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = { type: "DCSParameters" }

const xmlWithStringTitle = `<Settings>
	<Parameter>
		<dcssch:name>StringTitleParameter</dcssch:name>
		<dcssch:title xsi:type="xs:string">String title</dcssch:title>
	</Parameter>
</Settings>`

const exportDCSParameters = (value: unknown, referenceMetadata?: unknown): string => {
  const xmlData = exportPropertyToXML({
    context: mockContextToXML(),
    rule,
    value,
    referenceMetadata,
  })

  return xmlExport({ Settings: xmlData }, false)
}

describe("import DCSParameter from XML", () => {
  it("imports full.xml", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "full.xml",
      importMetaUrl: import.meta.url,
      xmlRootTag: "Settings",
    })
    expect(result).toEqual(fullDCSParameters)
  })

  it("imports minimal.xml", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "minimal.xml",
      importMetaUrl: import.meta.url,
      xmlRootTag: "Settings",
    })
    expect(result).toEqual(minimalDCSParameters)
  })

  it("imports and exports xs:string title", () => {
    const result = testImportPropertyFromXML({
      rule,
      xmlString: xmlWithStringTitle,
      xmlRootTag: "Settings",
    })
    const referenceMetadata = testImportPropertyFromXML({
      rule,
      xmlString: xmlWithStringTitle,
      xmlRootTag: "Settings",
      forReference: true,
    })

    expect(result).toEqual([
      {
        itemType: "DCSParameter",
        name: "StringTitleParameter",
        title: { items: { ru: "String title" } },
      },
    ])

    const exported = exportDCSParameters(result, referenceMetadata)
    expect(exported).toContain(`<dcssch:title xsi:type="xs:string">String title</dcssch:title>`)
    expect(exported).not.toContain(`<dcssch:title xsi:type="v8:LocalStringType">`)
  })
})
