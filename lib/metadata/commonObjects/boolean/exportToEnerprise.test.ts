import { describe, expect, it } from "vitest"
import { exportBooleanToEnterprise } from "./exportToEnterprise"

describe("exportBooleanToEnterprise", () => {
  it("should return undefined when value is undefined", () => {
    expect(exportBooleanToEnterprise(undefined)).toBeUndefined()
  })

  it("should return 'Истина' when value is true", () => {
    expect(exportBooleanToEnterprise(true)).toBe("Истина")
  })

  it("should return 'Ложь' when value is false", () => {
    expect(exportBooleanToEnterprise(false)).toBe("Ложь")
  })
})
