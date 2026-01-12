import { describe, expect, it } from "vitest"
import {
  fullButton,
  fullButtonPartialEnterprise,
  minimalButton,
  minimalButtonTypedEnterprise,
} from "~/tests/fixtures/forms/button/data"
import { mockСontext } from "~/tests/mockContext"
import { exportButtonPartialToEnterprise } from "./exportToEnterprise"

describe("exportButtonToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportButtonPartialToEnterprise(mockСontext, fullButton)

    expect(result).toEqual(fullButtonPartialEnterprise)
  })

  it("should export minimal", () => {
    const result = exportButtonPartialToEnterprise(mockСontext, minimalButton)

    expect(result).toEqual(minimalButtonTypedEnterprise)
  })
})
