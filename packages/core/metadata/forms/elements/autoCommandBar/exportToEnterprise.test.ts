import { describe, expect, it } from "vitest"
import {
  fullAutoCommandBar,
  fullAutoExportCommandBarEnterprise,
  minimalAutoCommandBar,
} from "~/tests/fixtures/forms/autoCommandBar/data"
import { mockContext } from "~/tests/mockContext"
import { exportAutoCommandBarToEnterprise } from "./exportToEnterprise"

describe("exportAutoCommandBarToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportAutoCommandBarToEnterprise(mockContext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportAutoCommandBarToEnterprise(mockContext, fullAutoCommandBar)

    expect(result).toEqual(fullAutoExportCommandBarEnterprise)
  })

  it("should export minimal", () => {
    const result = exportAutoCommandBarToEnterprise(mockContext, minimalAutoCommandBar)

    expect(result).toBeUndefined()
  })
})
