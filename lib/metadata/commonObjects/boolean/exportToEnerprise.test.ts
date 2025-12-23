import { describe, expect, it } from "vitest"
import { mockcontext } from "../../../tests/mockContext"
import { exportBooleanToEnterprise } from "./exportToEnterprise"

describe("exportBooleanToEnterprise", () => {
  it("should return undefined when value is undefined", () => {
    expect(exportBooleanToEnterprise(mockcontext, undefined)).toBeUndefined()
  })

  it("should return 'Истина' when value is true", () => {
    expect(exportBooleanToEnterprise(mockcontext, true)).toBe("Истина")
  })

  it("should return 'Ложь' when value is false", () => {
    expect(exportBooleanToEnterprise(mockcontext, false)).toBe("Ложь")
  })
})
