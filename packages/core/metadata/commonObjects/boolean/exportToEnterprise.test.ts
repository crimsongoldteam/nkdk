import { describe, expect, it } from "vitest"
import { mockСontext } from "../../../tests/mockContext"
import { exportBooleanToEnterprise } from "./exportToEnterprise"

describe("exportBooleanToEnterprise", () => {
  it("should return undefined when value is undefined", () => {
    const result = exportBooleanToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should return 'Истина' when value is true", () => {
    const result = exportBooleanToEnterprise(mockСontext, true)

    expect(result).toBe("Истина")
  })

  it("should return 'Ложь' when value is false", () => {
    const result = exportBooleanToEnterprise(mockСontext, false)

    expect(result).toBe("Ложь")
  })
})
