import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToXML, testImportAppliedObjectFromXML } from "../../../tests/appliedObject"
import { mockContextFromXML } from "../../../tests/mockContext"
import { readAndParseXMLFixture } from "../../../tests/readFixtureXML"
import { createConfigurationIndexCollector } from "../../configurationIndex/collector/writer"
import { withConfigurationIndexCollector } from "../../configurationIndex/collector/context"
import { importMetadataItemFromXML } from "../../orchestration"
import { fullFromXML } from "./__fixtures__/full"
import { minimal } from "./__fixtures__/minimal"
import { MetadataHTTPServiceRules } from "./rules"
import { MetadataHTTPService } from "./types"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("import MetadataHTTPService from XML", () => {
  it("should import full with URL templates and methods", () => {
    expect(
      testImportAppliedObjectFromXML<MetadataHTTPService>({
        rule: MetadataHTTPServiceRules,
        importMetaUrl: import.meta.url,
        fixture: "full.xml",
      })
    ).toEqual(fullFromXML)
  })

  it("should import minimal", () => {
    expect(
      testImportAppliedObjectFromXML<MetadataHTTPService>({
        rule: MetadataHTTPServiceRules,
        importMetaUrl: import.meta.url,
        fixture: "minimal.xml",
      })
    ).toEqual(minimal)
  })

  it.each(["full.xml", "minimal.xml"])("round-trip: %s — import затем export совпадает с исходным XML", (fixture) => {
    const data = testImportAppliedObjectFromXML<MetadataHTTPService>({
      rule: MetadataHTTPServiceRules,
      importMetaUrl: import.meta.url,
      fixture,
    })
    const { result, expected } = testExportAppliedObjectToXML({
      rule: MetadataHTTPServiceRules,
      importMetaUrl: import.meta.url,
      fixture,
      data: data!,
    })
    expect(normalizeLineEndings(result)).toEqual(normalizeLineEndings(expected))
  })

  it("пишет uuid URLTemplate и Method в адреса конкретных элементов индекса", () => {
    const collector = createConfigurationIndexCollector()
    const context = withConfigurationIndexCollector(
      mockContextFromXML({ forReference: true }),
      collector,
      "HTTPСервис.HTTPСервисВсеСвойства"
    )
    const parsed = readAndParseXMLFixture<{ MetaDataObject: unknown }>(import.meta.url, "full.xml")

    importMetadataItemFromXML({
      context,
      xml: parsed.MetaDataObject,
      rule: MetadataHTTPServiceRules,
    })

    const identities = collector.fragment("HTTPServices/HTTPСервисВсеСвойства/Свойства.yaml").identities
    expect(identities).toEqual(
      expect.arrayContaining([
        {
          logicalAddress: "HTTPСервис.HTTPСервисВсеСвойства.ШаблонURL.ШаблонURLВсеСвойства",
          kind: "uuid",
          value: "aee983bf-4532-4484-af10-18bec3476e5f",
        },
        {
          logicalAddress: "HTTPСервис.HTTPСервисВсеСвойства.ШаблонURL.ШаблонURLВсеСвойства.Метод.МетодВсеСвойства",
          kind: "uuid",
          value: "5cea292e-474f-4e14-9b79-46832cf8447b",
        },
      ])
    )
  })
})
