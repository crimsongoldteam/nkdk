import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../../orchestration"
import { testImportPropertyFromXML } from "../../../../tests/property/importPropertyFromXML"
import {
  fixtureDcsLocalStringRef,
  fixtureDcsLocalStringSingleLang,
  fixtureDcsLocalStringTwoLangs,
  fixtureDcsLocalStringTwoLangsRef,
  fixtureDcsStringRef,
  fixtureDcsStringSingleLang,
} from "./__fixtures__/data"

const rule: PropertyRule = { type: "DcsLocalStringType" }
const xmlRootTag = "dcsset:userSettingPresentation"

describe("importDcsLocalStringTypeFromXML", () => {
  describe("обычный импорт", () => {
    it("string.xml -> I8nText", () => {
      const result = testImportPropertyFromXML({
        rule,
        path: "string.xml",
        xmlRootTag,
        importMetaUrl: import.meta.url,
      })

      expect(result).toEqual(fixtureDcsStringSingleLang)
    })

    it("localString.xml -> I8nText с одним языком", () => {
      const result = testImportPropertyFromXML({
        rule,
        path: "localString.xml",
        xmlRootTag,
        importMetaUrl: import.meta.url,
      })

      expect(result).toEqual(fixtureDcsLocalStringSingleLang)
    })

    it("localStringTwoLangs.xml -> I8nText с двумя языками", () => {
      const result = testImportPropertyFromXML({
        rule,
        path: "localStringTwoLangs.xml",
        xmlRootTag,
        importMetaUrl: import.meta.url,
      })

      expect(result).toEqual(fixtureDcsLocalStringTwoLangs)
    })
  })

  describe("импорт референса", () => {
    it("string.xml -> строковый референс", () => {
      const result = testImportPropertyFromXML({
        rule,
        path: "string.xml",
        xmlRootTag,
        importMetaUrl: import.meta.url,
        forReference: true,
      })

      expect(result).toEqual(fixtureDcsStringRef)
    })

    it("localString.xml -> I8nText референс", () => {
      const result = testImportPropertyFromXML({
        rule,
        path: "localString.xml",
        xmlRootTag,
        importMetaUrl: import.meta.url,
        forReference: true,
      })

      expect(result).toEqual(fixtureDcsLocalStringRef)
    })

    it("localStringTwoLangs.xml -> I8nText референс", () => {
      const result = testImportPropertyFromXML({
        rule,
        path: "localStringTwoLangs.xml",
        xmlRootTag,
        importMetaUrl: import.meta.url,
        forReference: true,
      })

      expect(result).toEqual(fixtureDcsLocalStringTwoLangsRef)
    })
  })
})
