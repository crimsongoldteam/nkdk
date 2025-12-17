import { describe, expect, it } from "vitest"
import { mockConfigurationSettings } from "../../../tests/mockConfigurationSettings"
import { exportBooleanToEnterprise } from "./exportToEnterprise"

describe("exportBooleanToEnterprise", () => {
  it("should return undefined when value is undefined", () => {
    const result = exportBooleanToEnterprise(undefined, mockConfigurationSettings)

    expect(result).toBeUndefined()
  })

  it("should return 'Истина' when value is true", () => {
    const result = exportBooleanToEnterprise(true, mockConfigurationSettings)

    expect(result).toBe("Истина")
  })

  it("should return 'Ложь' when value is false", () => {
    const result = exportBooleanToEnterprise(false, mockConfigurationSettings)

    expect(result).toBe("Ложь")
  })
})
