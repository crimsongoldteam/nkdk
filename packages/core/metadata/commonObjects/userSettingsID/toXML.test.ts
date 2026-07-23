import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../orchestration"
import { testAtomicToXML } from "../../../tests/property/atomicToXML"
import { fixtureUserSettingsIDFull, fixtureUserSettingsIDRefFull } from "./__fixtures__/data"

const rule: PropertyRule = {
  type: "UserSettingsID",
}

const xmlRootTag = "dcsset:userSettingID"

describe("exportUserSettingsIDToXML", () => {
  it("с референсом из full.xml (forReference) совпадает с эталоном", () => {
    const { expectedResult, result } = testAtomicToXML({
      rule,
      value: fixtureUserSettingsIDFull,
      xmlRootTag,
      path: "full.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult?.trimEnd())
  })

  it("с явным referenceMetadata (GUID) совпадает с full.xml", () => {
    const { expectedResult, result } = testAtomicToXML({
      rule,
      value: fixtureUserSettingsIDFull,
      xmlRootTag,
      path: "full.xml",
      importMetaUrl: import.meta.url,
      referenceMetadata: fixtureUserSettingsIDRefFull,
    })

    expect(result).toEqual(expectedResult?.trimEnd())
  })

  it("без референса при true не сериализует элемент", () => {
    const { result } = testAtomicToXML({
      rule,
      value: fixtureUserSettingsIDFull,
      xmlRootTag,
    })

    expect(result).toBe("")
  })

  it("с явным referenceMetadata: undefined при true не сериализует элемент", () => {
    const { result } = testAtomicToXML({
      rule,
      value: fixtureUserSettingsIDFull,
      xmlRootTag,
      referenceMetadata: undefined,
    })

    expect(result).toBe("")
  })

  it("подставляет GUID из referenceMetadata, а не из модели (другой GUID)", () => {
    const otherGuid = "00000000-0000-0000-0000-000000000001"
    const { result } = testAtomicToXML({
      rule,
      value: fixtureUserSettingsIDFull,
      xmlRootTag,
      referenceMetadata: otherGuid,
    })

    expect(result).toContain(otherGuid)
    expect(result).not.toContain(fixtureUserSettingsIDRefFull)
  })

  it("выгружает GUID из модели без referenceMetadata", () => {
    const { result } = testAtomicToXML({
      rule,
      value: fixtureUserSettingsIDRefFull,
      xmlRootTag,
    })

    expect(result).toContain(fixtureUserSettingsIDRefFull)
  })

  it("с референсом из empty.xml при undefined не сериализует элемент", () => {
    const { expectedResult, result } = testAtomicToXML({
      rule,
      value: undefined,
      xmlRootTag,
      path: "empty.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toBe("")
    expect(expectedResult?.trim()).toBe("<dcsset:userSettingID></dcsset:userSettingID>")
  })
})
