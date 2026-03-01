import { describe, expect, it } from "vitest"
import { borderTestCases } from "~/tests/fixtures/border/data"
import { exportBorderToEnterprise } from "./toEnterprise"

describe("exportBorderToEnterprise", () => {
  it.each(borderTestCases)("should export $name to Enterprise", ({ border, preview }) => {
    const result = exportBorderToEnterprise({ value: border })

    expect(result).toEqual(preview)
  })

  it("should return undefined for undefined value", () => {
    expect(exportBorderToEnterprise({ value: undefined })).toBeUndefined()
  })
})
