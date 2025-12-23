import { describe, expect, it } from "vitest"
import { mockConfigurationSettings } from "../../../tests/mockConfigurationSettings"
import { exportBooleanToEnterprise } from "./exportToEnterprise"

describe("exportBooleanToEnterprise", () => {
  it("should return undefined when value is undefined", () => {
    expect(exportBooleanToEnterprise(mockConfigurationSettings, undefined)).toBeUndefined()
  })

  it("should return 'Истина' when value is true", () => {
    expect(exportBooleanToEnterprise(mockConfigurationSettings, true)).toBe("Истина")
  })

  it("should return 'Ложь' when value is false", () => {
    expect(exportBooleanToEnterprise(mockConfigurationSettings, false)).toBe("Ложь")
  })
})
