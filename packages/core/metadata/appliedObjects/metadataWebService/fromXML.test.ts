import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToXML, testImportAppliedObjectFromXML } from "~/tests/appliedObject"
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

  it.each(["full.xml", "minimal.xml"])(
    "round-trip: %s — import затем export совпадает с исходным XML",
    (fixture) => {
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
    }
  )
})
