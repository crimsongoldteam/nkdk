import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"
import {
  fixtureUserSettingsIDFull,
  fixtureUserSettingsIDRefFull,
} from "./__fixtures__/data"
import { userSettingIdRefValueDrop } from "./__fixtures__/userSettingIdRefValueDrop"

const rule: PropertyRule = {
  type: "UserSettingsID",
}

const xmlRootTag = "dcsset:userSettingID"

describe("importUserSettingsIDFromXML", () => {
  it("imports full.xml when not for reference", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "full.xml",
      xmlRootTag,
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(fixtureUserSettingsIDFull)
  })

  it("imports empty.xml when not for reference", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "empty.xml",
      xmlRootTag,
      importMetaUrl: import.meta.url,
    })

    expect(result).toBeUndefined()
  })

  it("imports full.xml for reference", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "full.xml",
      xmlRootTag,
      importMetaUrl: import.meta.url,
      forReference: true,
    })

    expect(result).toEqual(fixtureUserSettingsIDRefFull)
  })

  it("imports empty.xml for reference", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "empty.xml",
      xmlRootTag,
      importMetaUrl: import.meta.url,
      forReference: true,
    })

    expect(result).toBeUndefined()
  })

  it("import userSettingIdRefValueDrop", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "userSettingIdRefValueDrop.xml",
      xmlRootTag,
      importMetaUrl: import.meta.url,
      forReference: true,
    })

    expect(result).toEqual(userSettingIdRefValueDrop)
  })
})
