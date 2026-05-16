import { describe, expect, it } from "vitest"
import { exportMetadataItemToXML } from "~/metadata/orchestration"
import { testExportAppliedObjectToXML } from "~/tests/appliedObject"
import { mockContextToXML } from "~/tests/mockContext"
import { xmlExport } from "~/xml/export/exporter"
import { full } from "./__fixtures__/full"
import { minimal } from "./__fixtures__/minimal"
import { MetadataEventSubscriptionRules } from "./rules"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("export MetadataEventSubscription to XML", () => {
  it("exports full", () => {
    const { result, expected } = testExportAppliedObjectToXML({
      rule: MetadataEventSubscriptionRules,
      importMetaUrl: import.meta.url,
      fixture: "full.xml",
      data: full,
    })
    expect(normalizeLineEndings(result)).toEqual(normalizeLineEndings(expected))
  })

  it("exports minimal", () => {
    const { result, expected } = testExportAppliedObjectToXML({
      rule: MetadataEventSubscriptionRules,
      importMetaUrl: import.meta.url,
      fixture: "minimal.xml",
      data: minimal,
    })
    expect(normalizeLineEndings(result)).toEqual(normalizeLineEndings(expected))
  })

  it("exports new single Source without reference canonically as v8:Type", () => {
    const xmlData = exportMetadataItemToXML({
      context: mockContextToXML(),
      data: {
        ...minimal,
        name: "ПодпискаНаСобытиеНовая",
        source: { type: ["DocumentObject.ЗаказКлиента"] },
      },
      rule: MetadataEventSubscriptionRules,
    })

    const result = xmlExport(xmlData!)

    expect(result).toContain("<Source>")
    expect(result).toContain("<v8:Type>cfg:DocumentObject.ЗаказКлиента</v8:Type>")
    expect(result).not.toContain("<v8:TypeSet>")
    expect(result).not.toContain('xsi:type="v8:TypeSet"')
  })
})
