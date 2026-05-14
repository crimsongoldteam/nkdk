import { describe, expect, it } from "vitest"
import { testImportAppliedObjectFromXML } from "~/tests/appliedObject"
import { MetadataWebServiceRules } from "./rules"
import { MetadataWebService } from "./types"

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
        xdtoValueType: "xs:time",
        nillable: true,
        transferDirection: "InOut",
      },
      {
        itemType: "MetadataWebServiceParameter",
        name: "ПараметрПоУмолчанию",
        synonym: { items: { ru: "Параметр по умолчанию" } },
        comment: "",
        xdtoValueType: "xs:string",
        nillable: false,
        transferDirection: "In",
      },
    ])
  })
})
