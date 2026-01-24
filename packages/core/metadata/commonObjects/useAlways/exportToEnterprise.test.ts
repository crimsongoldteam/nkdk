import { describe, expect, it } from "vitest"
import { fullUseAlways, fullUseAlwaysEnterprise } from "~/tests/fixtures/useAlways/data"
import { mockСontext } from "~/tests/mockContext"
import { exportUseAlwaysToEnterprise } from "./exportToEnterprise"

describe("exportUseAlwaysToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportUseAlwaysToEnterprise(mockСontext, undefined)
    expect(result).toBeUndefined()
  })

  it("should export full", () => {
    const result = exportUseAlwaysToEnterprise(mockСontext, fullUseAlways)

    expect(result).toEqual(fullUseAlwaysEnterprise)
  })
})
