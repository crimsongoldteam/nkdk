import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToXML, testImportAppliedObjectFromXML } from "~/tests/appliedObject"
import { MetadataExchangePlanRules } from "./rules"
import { MetadataExchangePlan } from "./types"

describe("import MetadataExchangePlan from XML", () => {
  it("imports minimal exchange plan defaults and preserves ThisNode", () => {
    const result = testImportAppliedObjectFromXML<MetadataExchangePlan>({
      rule: MetadataExchangePlanRules,
      importMetaUrl: import.meta.url,
      fixture: "minimal.xml",
      forReference: true,
    })

    expect(result?.itemType).toBe("MetadataExchangePlan")
    expect(result?.name).toBe("ПланОбменаПоУмолчанию")
    expect(result?.internalInfo?.thisNode).toBe("e7c84706-69d6-4bd7-89cb-d5a0153a2b2d")
  })

  it.each(["full.xml", "minimal.xml"])("round-trip: %s — import затем export совпадает с исходным XML", (fixture) => {
    const data = testImportAppliedObjectFromXML<MetadataExchangePlan>({
      rule: MetadataExchangePlanRules,
      importMetaUrl: import.meta.url,
      fixture,
    })
    const { result, expected } = testExportAppliedObjectToXML({
      rule: MetadataExchangePlanRules,
      importMetaUrl: import.meta.url,
      fixture,
      data: data!,
    })
    expect(result.replace(/\r\n/g, "\n")).toEqual(expected.replace(/\r\n/g, "\n"))
  })
})
