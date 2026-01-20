import { describe, expect, it } from "vitest"
import {
  fullCommandBar,
  fullCommandBarPartialEnterprise,
  minimalCommandBar,
  minimalCommandBarPartialEnterprise,
} from "~/tests/fixtures/forms/commandBar/data"
import { mockСontext } from "~/tests/mockContext"
import { exportCommandBarPartialToEnterprise } from "./exportToEnterprise"

describe("exportCommandBarPartialToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportCommandBarPartialToEnterprise(mockСontext, fullCommandBar)

    expect(result).toEqual(fullCommandBarPartialEnterprise)
  })

  it("should export minimal", () => {
    const result = exportCommandBarPartialToEnterprise(mockСontext, minimalCommandBar)

    expect(result).toEqual(minimalCommandBarPartialEnterprise)
  })
})
