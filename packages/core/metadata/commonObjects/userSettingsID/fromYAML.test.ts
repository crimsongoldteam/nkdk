import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../orchestration"
import { testAtomicFromYAML } from "../../../tests/property/atomicFromYAML"
import {
  fixtureUserSettingsIDFalseYAML,
  fixtureUserSettingsIDFull,
  fixtureUserSettingsIDRefFull,
  fixtureUserSettingsIDYAML,
} from "./__fixtures__/data"

const rule: PropertyRule = {
  type: "UserSettingsID",
}

describe("importUserSettingsIDFromYAML", () => {
  it("imports Истина", () => {
    const result = testAtomicFromYAML({
      rule,
      value: fixtureUserSettingsIDYAML,
    })

    expect(result).toEqual(fixtureUserSettingsIDFull)
  })

  it("imports Ложь", () => {
    const result = testAtomicFromYAML({
      rule,
      value: fixtureUserSettingsIDFalseYAML,
    })

    expect(result).toEqual(false)
  })

  it("imports UID string", () => {
    const result = testAtomicFromYAML({
      rule,
      value: fixtureUserSettingsIDRefFull,
    })

    expect(result).toEqual(fixtureUserSettingsIDRefFull)
  })

  it("returns undefined when value is undefined", () => {
    const result = testAtomicFromYAML({
      rule,
      value: undefined,
    })

    expect(result).toBeUndefined()
  })
})
