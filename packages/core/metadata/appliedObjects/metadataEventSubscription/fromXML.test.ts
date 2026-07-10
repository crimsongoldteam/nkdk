import { describe, expect, it } from "vitest"
import { exportMetadataItemToXML } from "../../orchestration"
import { testExportAppliedObjectToXML, testImportAppliedObjectFromXML } from "../../../tests/appliedObject"
import { mockContextToXML } from "../../../tests/mockContext"
import { xmlExport } from "../../../xml/export/exporter"
import { full } from "./__fixtures__/full"
import { minimal } from "./__fixtures__/minimal"
import { MetadataEventSubscriptionRules } from "./rules"
import { MetadataEventSubscription } from "./types"

const normalizeLineEndings = (value: string) =>
  value
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .trimEnd()

describe("import MetadataEventSubscription from XML", () => {
  it("should import full", () => {
    expect(
      testImportAppliedObjectFromXML<MetadataEventSubscription>({
        rule: MetadataEventSubscriptionRules,
        importMetaUrl: import.meta.url,
        fixture: "full.xml",
      })
    ).toEqual(full)
  })

  it("should import minimal", () => {
    expect(
      testImportAppliedObjectFromXML<MetadataEventSubscription>({
        rule: MetadataEventSubscriptionRules,
        importMetaUrl: import.meta.url,
        fixture: "minimal.xml",
      })
    ).toEqual(minimal)
  })

  it.each(["full.xml", "minimal.xml"])("round-trip: %s — import затем export совпадает с исходным XML", (fixture) => {
    const data = testImportAppliedObjectFromXML<MetadataEventSubscription>({
      rule: MetadataEventSubscriptionRules,
      importMetaUrl: import.meta.url,
      fixture,
    })
    const { result, expected } = testExportAppliedObjectToXML({
      rule: MetadataEventSubscriptionRules,
      importMetaUrl: import.meta.url,
      fixture,
      data: data!,
    })
    expect(normalizeLineEndings(result)).toEqual(normalizeLineEndings(expected))
  })

  it.each([
    ["source-typeset.xml", '<Source xsi:type="v8:TypeSet">'],
    ["source-child-typeset.xml", "<v8:TypeSet>cfg:DocumentObject.ЗаказКлиента</v8:TypeSet>"],
  ])("round-trip: Source с TypeSet сохраняет XML-контейнер при той же семантике: %s", (fixture, xml) => {
    const data = testImportAppliedObjectFromXML<MetadataEventSubscription>({
      rule: MetadataEventSubscriptionRules,
      importMetaUrl: import.meta.url,
      fixture,
    })

    expect(data?.source).toEqual({ type: ["DocumentObject.ЗаказКлиента"] })
    expect(JSON.stringify(data?.source)).toEqual('{"type":["DocumentObject.ЗаказКлиента"]}')
    expect(Object.keys(data?.source ?? {})).toEqual(["type"])

    const { result, expected } = testExportAppliedObjectToXML({
      rule: MetadataEventSubscriptionRules,
      importMetaUrl: import.meta.url,
      fixture,
      data: data!,
    })

    expect(normalizeLineEndings(result)).toEqual(normalizeLineEndings(expected))
    expect(result).toContain(xml)
  })

  it("export: Source не наследует TypeSet из reference, если семантика изменилась", () => {
    const referenceData = testImportAppliedObjectFromXML<MetadataEventSubscription>({
      rule: MetadataEventSubscriptionRules,
      importMetaUrl: import.meta.url,
      fixture: "source-typeset.xml",
      forReference: true,
    })
    const data: MetadataEventSubscription = {
      ...referenceData!,
      source: { type: ["DocumentObject.ДругойЗаказ"] },
    }

    const xmlData = exportMetadataItemToXML({
      context: mockContextToXML(),
      data,
      referenceData,
      rule: MetadataEventSubscriptionRules,
    })
    const result = xmlExport(xmlData!)

    expect(result).toContain("<v8:Type>cfg:DocumentObject.ДругойЗаказ</v8:Type>")
    expect(result).not.toContain('<Source xsi:type="v8:TypeSet">')
    expect(result).not.toContain("<v8:TypeSet>")
  })
})
