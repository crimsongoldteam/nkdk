import { describe, expect, it } from "vitest"
import { fullTable, fullTableEnterprise, minimalTable, minimalTableEnterprise } from "~/tests/fixtures/forms/table/data"
import { mockСontext } from "~/tests/mockContext"
import { exportTableToEnterprise } from "./exportToEnterprise"

describe("exportTableToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportTableToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportTableToEnterprise(mockСontext, fullTable)

    expect(result).toEqual(fullTableEnterprise)
  })

  it("should export minimal", () => {
    const result = exportTableToEnterprise(mockСontext, minimalTable)

    expect(result).toEqual(minimalTableEnterprise)
  })
})

