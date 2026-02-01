import { describe, expect, it } from "vitest"
import { typeFixturesTable } from "../../../tests/fixtures/typeDescription/data"
import { mockContext } from "../../../tests/mockContext"
import { exportTypeDescriptionToEnterprise } from "./exportToEnterprise"

describe("exportTypeDescriptionToEnterprise", () => {
  it("should format undefined type description", () => {
    const result = exportTypeDescriptionToEnterprise(mockContext, undefined)
    expect(result).toBeUndefined()
  })

  it.each(typeFixturesTable)("should export composite type to Enterprise: $enterprise", ({ internal, enterprise }) => {
    const result = exportTypeDescriptionToEnterprise(mockContext, internal)
    expect(result).toEqual(enterprise)
  })
})
