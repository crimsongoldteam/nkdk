import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../../orchestration"
import { testExportPropertyToXML } from "../../../../tests/property/exportPropertyToXML"
import {
  fixtureDcsLocalStringSingleLang,
  fixtureDcsLocalStringTwoLangs,
  fixtureDcsStringSingleLang,
} from "./__fixtures__/data"

const rule: PropertyRule = { type: "DcsLocalStringType" }
const xmlRootTag = "dcsset:userSettingPresentation"

describe("exportDcsLocalStringTypeToXML", () => {
  it("один язык + string reference -> xs:string", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: fixtureDcsStringSingleLang,
      xmlRootTag,
      path: "string.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult?.trimEnd())
  })

  it("один язык + LocalString reference -> v8:LocalStringType", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: fixtureDcsLocalStringSingleLang,
      xmlRootTag,
      path: "localString.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult?.trimEnd())
  })

  it("один язык без референса -> v8:LocalStringType", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: fixtureDcsLocalStringSingleLang,
      xmlRootTag,
      path: "localString.xml",
      importMetaUrl: import.meta.url,
      referenceMetadata: undefined,
    })

    expect(result).toEqual(expectedResult?.trimEnd())
  })

  it("два языка -> v8:LocalStringType", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: fixtureDcsLocalStringTwoLangs,
      xmlRootTag,
      path: "localStringTwoLangs.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult?.trimEnd())
  })

  it("undefined -> пустой элемент", () => {
    const { result } = testExportPropertyToXML({
      rule,
      value: undefined,
      xmlRootTag,
      referenceMetadata: "reference",
    })

    expect(result).toBe("")
  })

  it("пустой items -> пустой элемент", () => {
    const { result } = testExportPropertyToXML({
      rule,
      value: { items: {} },
      xmlRootTag,
      referenceMetadata: "reference",
    })

    expect(result).toBe("")
  })
})
