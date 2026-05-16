import { describe, expect, it } from "vitest"
import { pictureTestCases } from "~/tests/fixtures/picture/data"
import { exportPictureToEnterprise } from "./toEnterprise"

describe("exportPictureToEnterprise", () => {
  it.each(pictureTestCases)("should import $name from YAML", ({ picture, preview }) => {
    const result = exportPictureToEnterprise({ value: picture })

    expect(result).toEqual(preview)
  })

  it("should not export raw ref to Enterprise", () => {
    const result = exportPictureToEnterprise({ value: { rawRef: "0:ca5b178d-2d5a-4cf7-b88e-6fbdb2e56065" } })

    expect(result).toBeUndefined()
  })
})
