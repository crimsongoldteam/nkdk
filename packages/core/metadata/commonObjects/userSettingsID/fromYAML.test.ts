import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"
import {
  fixtureUserSettingsIDFalseYAML,
  fixtureUserSettingsIDFull,
  fixtureUserSettingsIDYAML,
} from "./__fixtures__/data"

const rule: PropertyRule = {
  type: "UserSettingsID",
}

describe("importUserSettingsIDFromYAML", () => {
  it("imports Истина", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: fixtureUserSettingsIDYAML,
    })

    expect(result).toEqual(fixtureUserSettingsIDFull)
  })

  it("imports Ложь", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: fixtureUserSettingsIDFalseYAML,
    })

    expect(result).toEqual(false)
  })

  it("returns undefined when value is undefined", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: undefined,
    })

    expect(result).toBeUndefined()
  })
})
