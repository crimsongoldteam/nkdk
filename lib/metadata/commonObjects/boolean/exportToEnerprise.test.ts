import { describe, expect, it } from "vitest"
import { mockConfigurationSettings } from "../../../tests/mockConfigurationSettings"
import { exportBooleanToEnterprise } from "./exportToEnterprise"

describe("exportBooleanToEnterprise", () => {
  it("should return undefined when value is undefined", () => {
    expect(exportBooleanToEnterprise(undefined, mockConfigurationSettings)).toBeUndefined()
  })

  it("should return 'Истина' when value is true", () => {
    expect(exportBooleanToEnterprise(true, mockConfigurationSettings)).toBe("Истина")
  })

  it("should return 'Ложь' when value is false", () => {
    expect(exportBooleanToEnterprise(false, mockConfigurationSettings)).toBe("Ложь")
  })
})
