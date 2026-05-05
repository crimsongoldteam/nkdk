import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "~/tests/mockContext"
import {
  fixtureUserSettingsIDFull,
  fixtureUserSettingsIDYAML,
} from "./__fixtures__/data"
import { exportUserSettingsIDToYAML } from "./toYAML"

describe("exportUserSettingsIDToYAML", () => {
  it("exports Истина", () => {
    const result = exportUserSettingsIDToYAML(mockContext, mockRule, fixtureUserSettingsIDFull)

    expect(result).toEqual(fixtureUserSettingsIDYAML)
  })

  it("exports Ложь", () => {
    const result = exportUserSettingsIDToYAML(mockContext, mockRule, false)

    expect(result).toEqual("Ложь")
  })

  it("returns undefined when value is undefined", () => {
    const result = exportUserSettingsIDToYAML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })
})
