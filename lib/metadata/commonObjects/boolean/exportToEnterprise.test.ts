import { describe, expect, it } from "vitest"
import { mockcontext } from "../../../tests/mockContext"
import { exportBooleanToEnterprise } from "./exportToEnterprise"

describe("exportBooleanToEnterprise", () => {
  it("should return undefined when value is undefined", () => {
    const result = exportBooleanToEnterprise(mockcontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should return 'Истина' when value is true", () => {
    const result = exportBooleanToEnterprise(mockcontext, true)

    expect(result).toBe("Истина")
  })

  it("should return 'Ложь' when value is false", () => {
    const result = exportBooleanToEnterprise(mockcontext, false)

    expect(result).toBe("Ложь")
  })
})
