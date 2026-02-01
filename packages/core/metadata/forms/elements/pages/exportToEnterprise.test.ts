import { describe, expect, it } from "vitest"
import {
  fullPages,
  fullPagesPartialEnterprise,
  fullPagesTypedEnterprise,
  minimalPages,
  minimalPagesPartialEnterprise,
  minimalPagesTypedEnterprise,
} from "~/tests/fixtures/forms/pages/data"
import { mockContext } from "~/tests/mockContext"
import { exportPagesPartialToEnterprise, exportPagesTypedToEnterprise } from "./exportToEnterprise"

describe("exportPagesPartialToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportPagesPartialToEnterprise(mockContext, fullPages)

    expect(result).toEqual(fullPagesPartialEnterprise)
  })

  it("should export minimal", () => {
    const result = exportPagesPartialToEnterprise(mockContext, minimalPages)

    expect(result).toEqual(minimalPagesPartialEnterprise)
  })
})

describe("exportPagesTypedToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportPagesTypedToEnterprise(mockContext, fullPages)

    expect(result).toEqual(fullPagesTypedEnterprise)
  })

  it("should return undefined when data is undefined", () => {
    const result = exportPagesTypedToEnterprise(mockContext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export minimal", () => {
    const result = exportPagesTypedToEnterprise(mockContext, minimalPages)

    expect(result).toEqual(minimalPagesTypedEnterprise)
  })
})
