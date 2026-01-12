import { describe, expect, it } from "vitest"
import {
  fullButton,
  fullButtonChildEnterprise,
  minimalButton,
  minimalButtonEnterprise,
} from "~/tests/fixtures/forms/button/data"
import { mockСontext } from "~/tests/mockContext"
import { exportButtonToEnterprise } from "./exportToEnterprise"

describe("exportButtonToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportButtonToEnterprise(mockСontext, fullButton)

    expect(result).toEqual(fullButtonChildEnterprise)
  })

  it("should export minimal", () => {
    const result = exportButtonToEnterprise(mockСontext, minimalButton)

    expect(result).toEqual(minimalButtonEnterprise)
  })
})
