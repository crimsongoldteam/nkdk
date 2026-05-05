import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"
import {
  fixtureUSPLocalStringRef,
  fixtureUSPLocalStringSingleLang,
  fixtureUSPLocalStringTwoLangs,
  fixtureUSPStringRef,
  fixtureUSPStringSingleLang,
} from "./__fixtures__/data"

const rule: PropertyRule = { type: "UserSettingPresentation" }
const xmlRootTag = "dcsset:userSettingPresentation"

describe("importUserSettingPresentationFromXML", () => {
  describe("обычный импорт (forReference=false)", () => {
    it("string.xml → I8nText", () => {
      const result = testImportPropertyFromXML({
        rule,
        path: "string.xml",
        xmlRootTag,
        importMetaUrl: import.meta.url,
      })

      expect(result).toEqual(fixtureUSPStringSingleLang)
    })

    it("localString.xml → I8nText (один язык)", () => {
      const result = testImportPropertyFromXML({
        rule,
        path: "localString.xml",
        xmlRootTag,
        importMetaUrl: import.meta.url,
      })

      expect(result).toEqual(fixtureUSPLocalStringSingleLang)
    })

    it("localStringTwoLangs.xml → I8nText (два языка)", () => {
      const result = testImportPropertyFromXML({
        rule,
        path: "localStringTwoLangs.xml",
        xmlRootTag,
        importMetaUrl: import.meta.url,
      })

      expect(result).toEqual(fixtureUSPLocalStringTwoLangs)
    })
  })

  describe("импорт для референса (forReference=true)", () => {
    it("string.xml → true (был xs:string)", () => {
      const result = testImportPropertyFromXML({
        rule,
        path: "string.xml",
        xmlRootTag,
        importMetaUrl: import.meta.url,
        forReference: true,
      })

      expect(result).toEqual(fixtureUSPStringRef)
    })

    it("localString.xml → I8nText (был LocalStringType)", () => {
      const result = testImportPropertyFromXML({
        rule,
        path: "localString.xml",
        xmlRootTag,
        importMetaUrl: import.meta.url,
        forReference: true,
      })

      expect(result).toEqual(fixtureUSPLocalStringRef)
    })

    it("localStringTwoLangs.xml → I8nText (был LocalStringType)", () => {
      const result = testImportPropertyFromXML({
        rule,
        path: "localStringTwoLangs.xml",
        xmlRootTag,
        importMetaUrl: import.meta.url,
        forReference: true,
      })

      expect(result).toEqual(fixtureUSPLocalStringTwoLangs)
    })
  })
})
