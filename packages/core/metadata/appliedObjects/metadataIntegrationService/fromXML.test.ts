import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToXML, testImportAppliedObjectFromXML } from "../../../tests/appliedObject"
import { MetadataIntegrationServiceRules } from "./rules"
import { MetadataIntegrationService } from "./types"

const normalizeXml = (xml: string): string => xml.replace(/\r\n/g, "\n")

describe("import MetadataIntegrationService from XML", () => {
  it("imports channel InternalInfo for reference export", () => {
    const result = testImportAppliedObjectFromXML<MetadataIntegrationService>({
      rule: MetadataIntegrationServiceRules,
      importMetaUrl: import.meta.url,
      fixture: "full.xml",
      forReference: true,
    })

    expect(result?.channels?.[0]?.internalInfo).toEqual({
      IntegrationServiceChannelManager: {
        typeId: "55761e06-fafc-4580-9f22-6fbf9d1f7c43",
        valueId: "15aef310-14ea-4dd6-9bf3-a104c6bab4f9",
      },
    })
  })

  it.each(["full.xml", "minimal.xml"])("round-trip: %s — import затем export совпадает с исходным XML", (fixture) => {
    const data = testImportAppliedObjectFromXML<MetadataIntegrationService>({
      rule: MetadataIntegrationServiceRules,
      importMetaUrl: import.meta.url,
      fixture,
    })

    const { result, expected } = testExportAppliedObjectToXML({
      rule: MetadataIntegrationServiceRules,
      importMetaUrl: import.meta.url,
      fixture,
      data: data!,
    })

    expect(normalizeXml(result)).toEqual(normalizeXml(expected))
  })
})
