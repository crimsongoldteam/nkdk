import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import {
  fixtureUSPLocalStringSingleLang,
  fixtureUSPLocalStringTwoLangs,
  fixtureUSPStringSingleLang,
} from "./__fixtures__/data"

const rule: PropertyRule = { type: "UserSettingPresentation" }
const xmlRootTag = "dcsset:userSettingPresentation"

describe("exportUserSettingPresentationToXML", () => {
  describe("один язык + referenceMetadata=true → xs:string", () => {
    it("совпадает с эталоном string.xml", () => {
      const { expectedResult, result } = testExportPropertyToXML({
        rule,
        value: fixtureUSPStringSingleLang,
        xmlRootTag,
        path: "string.xml",
        importMetaUrl: import.meta.url,
        referenceMetadata: true,
      })

      expect(result).toEqual(expectedResult?.trimEnd())
    })
  })

  describe("один язык + referenceMetadata=false → v8:LocalStringType", () => {
    it("совпадает с эталоном localString.xml", () => {
      const { expectedResult, result } = testExportPropertyToXML({
        rule,
        value: fixtureUSPLocalStringSingleLang,
        xmlRootTag,
        path: "localString.xml",
        importMetaUrl: import.meta.url,
        referenceMetadata: false,
      })

      expect(result).toEqual(expectedResult?.trimEnd())
    })
  })

  describe("один язык + без референса → v8:LocalStringType", () => {
    it("совпадает с эталоном localString.xml", () => {
      const { expectedResult, result } = testExportPropertyToXML({
        rule,
        value: fixtureUSPLocalStringSingleLang,
        xmlRootTag,
        path: "localString.xml",
        importMetaUrl: import.meta.url,
        referenceMetadata: undefined,
      })

      expect(result).toEqual(expectedResult?.trimEnd())
    })
  })

  describe("два языка → v8:LocalStringType (всегда)", () => {
    it("совпадает с эталоном localStringTwoLangs.xml", () => {
      const { expectedResult, result } = testExportPropertyToXML({
        rule,
        value: fixtureUSPLocalStringTwoLangs,
        xmlRootTag,
        path: "localStringTwoLangs.xml",
        importMetaUrl: import.meta.url,
      })

      expect(result).toEqual(expectedResult?.trimEnd())
    })

    it("два языка + referenceMetadata=true всё равно LocalString", () => {
      const { expectedResult, result } = testExportPropertyToXML({
        rule,
        value: fixtureUSPLocalStringTwoLangs,
        xmlRootTag,
        path: "localStringTwoLangs.xml",
        importMetaUrl: import.meta.url,
        referenceMetadata: true,
      })

      expect(result).toEqual(expectedResult?.trimEnd())
    })
  })

  describe("граничные случаи", () => {
    it("undefined → пустой элемент", () => {
      const { result } = testExportPropertyToXML({
        rule,
        value: undefined,
        xmlRootTag,
        referenceMetadata: true,
      })

      expect(result).toBe("")
    })

    it("пустой items → пустой элемент", () => {
      const { result } = testExportPropertyToXML({
        rule,
        value: { items: {} },
        xmlRootTag,
        referenceMetadata: true,
      })

      expect(result).toBe("")
    })
  })
})
