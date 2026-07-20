import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToXML, testImportAppliedObjectFromXML } from "../../../tests/appliedObject"
import { mockContextFromXML } from "../../../tests/mockContext"
import { readAndParseXMLFixture } from "../../../tests/readFixtureXML"
import { createConfigurationIndexCollector } from "../../configurationIndex/collector/writer"
import { withConfigurationIndexCollector } from "../../configurationIndex/collector/context"
import { importMetadataItemFromXML } from "../../orchestration"
import { MetadataWebServiceRules } from "./rules"
import { MetadataWebService } from "./types"

const normalizeXml = (xml: string): string => xml.replace(/\r\n/g, "\n")

describe("import MetadataWebService from XML", () => {
  it("imports operation parameters from updated fixture", () => {
    const result = testImportAppliedObjectFromXML<MetadataWebService>({
      rule: MetadataWebServiceRules,
      importMetaUrl: import.meta.url,
      fixture: "full.xml",
    })
    expect(result?.operations?.[0]?.parameters).toEqual([
      {
        itemType: "MetadataWebServiceParameter",
        name: "ПараметрВсеСвойства",
        synonym: { items: { ru: "Синоним" } },
        comment: "Комментарий",
        xdtoValueType: {
          namespace: "http://www.w3.org/2001/XMLSchema",
          name: "time",
        },
        nillable: true,
        transferDirection: "InOut",
      },
      {
        itemType: "MetadataWebServiceParameter",
        name: "ПараметрПоУмолчанию",
        synonym: { items: { ru: "Параметр по умолчанию" } },
        comment: "",
        xdtoValueType: {
          namespace: "http://www.w3.org/2001/XMLSchema",
          name: "string",
        },
        nillable: false,
        transferDirection: "In",
      },
    ])
  })

  it.each(["full.xml", "minimal.xml"])("round-trip: %s — import затем export совпадает с исходным XML", (fixture) => {
    const data = testImportAppliedObjectFromXML<MetadataWebService>({
      rule: MetadataWebServiceRules,
      importMetaUrl: import.meta.url,
      fixture,
    })

    const { result, expected } = testExportAppliedObjectToXML({
      rule: MetadataWebServiceRules,
      importMetaUrl: import.meta.url,
      fixture,
      data: data!,
    })

    expect(normalizeXml(result)).toEqual(normalizeXml(expected))
  })

  it("пишет uuid Operation и Parameter в адреса конкретных элементов индекса", () => {
    const collector = createConfigurationIndexCollector()
    const context = withConfigurationIndexCollector(
      mockContextFromXML({ forReference: true }),
      collector,
      "WebСервис.WebСервисВсеСвойства"
    )
    const parsed = readAndParseXMLFixture<{ MetaDataObject: unknown }>(import.meta.url, "full.xml")

    importMetadataItemFromXML({
      context,
      xml: parsed.MetaDataObject,
      rule: MetadataWebServiceRules,
    })

    const identities = collector.fragment("WebServices/WebСервисВсеСвойства/Свойства.yaml").identities
    expect(identities).toEqual(
      expect.arrayContaining([
        {
          logicalAddress: "WebСервис.WebСервисВсеСвойства.Операция.ОперацияВсеСвойства",
          kind: "uuid",
          value: "9fc06009-121a-4fe7-af4b-a5640d213cb1",
        },
        {
          logicalAddress: "WebСервис.WebСервисВсеСвойства.Операция.ОперацияВсеСвойства.Параметр.ПараметрВсеСвойства",
          kind: "uuid",
          value: "58088704-401d-4567-a6de-f4ad9266d2b0",
        },
      ])
    )
  })
})
