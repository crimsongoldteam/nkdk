import { describe, expect, it } from "vitest"
import {
  fullAutoCommandBar,
  fullAutoCommandBarEnterprise,
  minimalAutoCommandBar,
} from "~/tests/fixtures/forms/autoCommandBar/data"
import { mockСontext } from "~/tests/mockContext"
import { exportAutoCommandBarToEnterprise } from "./exportToEnterprise"

describe("exportAutoCommandBarToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportAutoCommandBarToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportAutoCommandBarToEnterprise(mockСontext, fullAutoCommandBar)

    expect(result).toEqual(fullAutoCommandBarEnterprise)
  })

  it("should export minimal", () => {
    const result = exportAutoCommandBarToEnterprise(mockСontext, minimalAutoCommandBar)

    expect(result).toBeUndefined()
  })
})
