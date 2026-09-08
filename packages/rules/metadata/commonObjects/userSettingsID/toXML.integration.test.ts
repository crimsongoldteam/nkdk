import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../ruleRuntime"
import { testAtomicToXML } from "../../../tests/property/atomicToXML"
import { fixtureUserSettingsIDFull, fixtureUserSettingsIDRefFull } from "./__fixtures__/data"

const rule: PropertyRule = {
  type: "UserSettingsID",
}

const xmlRootTag = "dcsset:userSettingID"

describe("exportUserSettingsIDToXML", () => {
  it("с идентификатором из YAML совпадает с full.xml", () => {
    const { expectedResult, result } = testAtomicToXML({
      rule,
      value: fixtureUserSettingsIDRefFull,
      xmlRootTag,
      path: "full.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult?.trimEnd())
  })

  it("не подменяет идентификатор YAML значением reference", () => {
    const { expectedResult, result } = testAtomicToXML({
      rule,
      value: fixtureUserSettingsIDRefFull,
      xmlRootTag,
      path: "full.xml",
      importMetaUrl: import.meta.url,
      referenceMetadata: "00000000-0000-0000-0000-000000000001",
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

  it("не добавляет идентификатор из reference при отсутствии его в YAML", () => {
    const otherGuid = "00000000-0000-0000-0000-000000000001"
    const { result } = testAtomicToXML({
      rule,
      value: fixtureUserSettingsIDFull,
      xmlRootTag,
      referenceMetadata: otherGuid,
    })

    expect(result).toBe("")
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
