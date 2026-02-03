import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/exportToEnterprise"
import { fullTable, fullTableEnterprise, minimalTable, minimalTableEnterprise } from "~/tests/fixtures/forms/table/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportTableToEnterprise } from "./exportToEnterprise"

describe("exportTableToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportTableToEnterprise(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportTableToEnterprise(mockContext, mockRule, fullTable)

    expect(result).toEqual(fullTableEnterprise)
  })

  it("should export minimal", () => {
    const result = exportTableToEnterprise(mockContext, mockRule, minimalTable)

    expect(result).toEqual(minimalTableEnterprise)
  })
})
