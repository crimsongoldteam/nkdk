import { describe, expect, it } from "vitest"
import { pictureTestCases } from "~/tests/fixtures/picture/data"
import { exportPictureToEnterprise } from "./toEnterprise"

describe("exportPictureToEnterprise", () => {
  it.each(pictureTestCases)("should import $name from YAML", ({ picture, preview }) => {
    const result = exportPictureToEnterprise({ value: picture })

    expect(result).toEqual(preview)
  })
})
