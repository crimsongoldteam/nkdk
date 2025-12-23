import { describe, expect, it } from "vitest"
import { mockСontext } from "../../../tests/mockContext"
import { exportBooleanToEnterprise } from "./exportToEnterprise"

describe("exportBooleanToEnterprise", () => {
  it("should return undefined when value is undefined", () => {
    expect(exportBooleanToEnterprise(mockСontext, undefined)).toBeUndefined()
  })

  it("should return 'Истина' when value is true", () => {
    expect(exportBooleanToEnterprise(mockСontext, true)).toBe("Истина")
  })

  it("should return 'Ложь' when value is false", () => {
    expect(exportBooleanToEnterprise(mockСontext, false)).toBe("Ложь")
  })
})
