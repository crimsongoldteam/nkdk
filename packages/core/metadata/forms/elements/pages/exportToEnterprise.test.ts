import { describe, expect, it } from "vitest"
import { fullPages, fullPagesEnterprise, minimalPages, minimalPagesEnterprise } from "~/tests/fixtures/forms/pages/data"
import { mockСontext } from "~/tests/mockContext"
import { exportPagesToEnterprise } from "./exportToEnterprise"

describe("exportPagesToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportPagesToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportPagesToEnterprise(mockСontext, fullPages)

    expect(result).toEqual(fullPagesEnterprise)
  })

  it("should export minimal", () => {
    const result = exportPagesToEnterprise(mockСontext, minimalPages)

    expect(result).toEqual(minimalPagesEnterprise)
  })
})
