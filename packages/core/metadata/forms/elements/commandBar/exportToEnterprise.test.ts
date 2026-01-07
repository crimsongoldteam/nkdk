import { describe, expect, it } from "vitest"
import { fullCommandBar, fullCommandBarEnterprise, minimalCommandBar, minimalCommandBarEnterprise } from "~/tests/fixtures/forms/commandBar/data"
import { mockСontext } from "~/tests/mockContext"
import { exportCommandBarToEnterprise } from "./exportToEnterprise"

describe("exportCommandBarToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportCommandBarToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportCommandBarToEnterprise(mockСontext, fullCommandBar)

    expect(result).toEqual(fullCommandBarEnterprise)
  })

  it("should export minimal", () => {
    const result = exportCommandBarToEnterprise(mockСontext, minimalCommandBar)

    expect(result).toEqual(minimalCommandBarEnterprise)
  })
})

