import { describe, expect, it } from "vitest"
import { guideDefinitions } from "./index"

describe("guide definitions", () => {
  it("contains the four first-version guides", () => {
    expect(guideDefinitions.map((guide) => guide.uri)).toEqual([
      "nkdk://guides/config-edit-yaml",
      "nkdk://guides/config-import-from-xml",
      "nkdk://guides/config-sync-to-xml",
      "nkdk://guides/config-validate-yaml",
    ])
  })
})
