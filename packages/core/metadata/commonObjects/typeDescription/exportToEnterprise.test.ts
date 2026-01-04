import { describe, expect, it } from "vitest"
import { typeFixturesTable } from "../../../tests/fixtures/typeDescription/data"
import { mockСontext } from "../../../tests/mockContext"
import { exportTypeDescriptionToEnterprise } from "./exportToEnterprise"

describe("exportTypeDescriptionToEnterprise", () => {
  it("should format undefined type description", () => {
    const result = exportTypeDescriptionToEnterprise(mockСontext, undefined)
    expect(result).toBeUndefined()
  })

  it.each(typeFixturesTable.filter((fixture) => typeof fixture.enterprise === "string"))(
    "should export type to Enterprise: $enterprise",
    ({ internal, enterprise }) => {
      const result = exportTypeDescriptionToEnterprise(mockСontext, internal)
      expect(result).toEqual(enterprise)
    }
  )

  it.each(typeFixturesTable.filter((fixture) => Array.isArray(fixture.enterprise)))(
    "should export composite type to Enterprise: $enterprise",
    ({ internal, enterprise }) => {
      const result = exportTypeDescriptionToEnterprise(mockСontext, internal)
      expect(result).toEqual(enterprise)
    }
  )
})
