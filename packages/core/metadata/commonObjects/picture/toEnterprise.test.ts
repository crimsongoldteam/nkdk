import { describe, expect, it } from "vitest"
import { pictureTestCases } from "~/tests/fixtures/picture/data"
import { mockContext, mockRule } from "../../../tests/mockContext"
import { exportPictureToEnterprise } from "./toEnterprise"

describe("exportPictureToEnterprise", () => {
  it.each(pictureTestCases)("should import $name from YAML", ({ picture, preview }) => {
    const result = exportPictureToEnterprise(mockContext, mockRule, picture)

    expect(result).toEqual(preview)
  })
})
