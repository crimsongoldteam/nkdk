import { describe, expect, it } from "vitest"
import {
  fullButton,
  fullButtonEnterprise,
  minimalButton,
  minimalButtonChildEnterprise,
} from "~/tests/fixtures/forms/button/data"
import { mockСontext } from "~/tests/mockContext"
import { exportButtonToEnterprise } from "./exportToEnterprise"

describe("exportButtonToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportButtonToEnterprise(mockСontext, fullButton)

    expect(result).toEqual(fullButtonEnterprise)
  })

  it("should export minimal", () => {
    const result = exportButtonToEnterprise(mockСontext, minimalButton)

    expect(result).toEqual(minimalButtonChildEnterprise)
  })
})
