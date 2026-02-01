import { describe, expect, it } from "vitest"
import {
  fullCommandBar,
  fullCommandBarPartialEnterprise,
  minimalCommandBar,
  minimalCommandBarPartialEnterprise,
} from "~/tests/fixtures/forms/commandBar/data"
import { mockContext } from "~/tests/mockContext"
import { exportCommandBarPartialToEnterprise } from "./exportToEnterprise"

describe("exportCommandBarPartialToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportCommandBarPartialToEnterprise(mockContext, fullCommandBar)

    expect(result).toEqual(fullCommandBarPartialEnterprise)
  })

  it("should export minimal", () => {
    const result = exportCommandBarPartialToEnterprise(mockContext, minimalCommandBar)

    expect(result).toEqual(minimalCommandBarPartialEnterprise)
  })
})
