import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToXML, testImportAppliedObjectFromXML } from "~/tests/appliedObject"
import { MetadataInformationRegisterRules } from "./rules"
import { MetadataInformationRegister } from "./types"

describe("import MetadataInformationRegister from XML", () => {
  it("imports minimal register defaults and keeps resource fixture content explicit", () => {
    const result = testImportAppliedObjectFromXML<MetadataInformationRegister>({
      rule: MetadataInformationRegisterRules,
      importMetaUrl: import.meta.url,
      fixture: "minimal.xml",
    })

    expect(result?.itemType).toBe("MetadataInformationRegister")
    expect(result?.name).toBe("РегистрСведенийПоУмолчанию")
    expect(result?.useStandardCommands).toBeUndefined()
    expect(result?.writeMode).toBeUndefined()
    expect(result?.resources?.[0]?.name).toBe("Ресурс1")
  })

  it.each(["full.xml", "minimal.xml", "reg.xml"])(
    "round-trip: %s — import затем export совпадает с исходным XML",
    (fixture) => {
      const data = testImportAppliedObjectFromXML<MetadataInformationRegister>({
        rule: MetadataInformationRegisterRules,
        importMetaUrl: import.meta.url,
        fixture,
      })
      const { result, expected } = testExportAppliedObjectToXML({
        rule: MetadataInformationRegisterRules,
        importMetaUrl: import.meta.url,
        fixture,
        data: data!,
      })
      expect(result.replace(/\r\n/g, "\n")).toEqual(expected.replace(/\r\n/g, "\n"))
    }
  )
})
