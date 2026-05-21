import { describe, expect, it } from "vitest"
import { pictureTestCases } from "~/tests/fixtures/picture/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportPictureToYAML } from "./toYAML"
import { Picture } from "./types"

describe("exportPictureToYAML", () => {
  it("should return undefined for undefined input", () => {
    const result = exportPictureToYAML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it.each(pictureTestCases)("should export $name to YAML", ({ picture, expectedYAML: enterpriseExpected }) => {
    const result = exportPictureToYAML(mockContext, mockRule, picture)

    expect(result).toEqual(enterpriseExpected)
  })

  it.each(["0", "0:ca5b178d-2d5a-4cf7-b88e-6fbdb2e56065"])("should export %s as raw ref to YAML", (rawRef) => {
    const result = exportPictureToYAML(mockContext, mockRule, { rawRef })

    expect(result).toBe(rawRef)
  })

  it("exports raw picture refs with LoadTransparent as expanded YAML", () => {
    const result = exportPictureToYAML(mockContext, mockRule, {
      rawRef: "0:00000000-0000-0000-0000-000000000000",
      loadTransparent: false,
    })

    expect(result).toEqual({
      Ссылка: "0:00000000-0000-0000-0000-000000000000",
      ПрозрачныйФон: "Ложь",
    })
  })

  it("exports raw picture refs with transparent pixel as expanded YAML", () => {
    const result = exportPictureToYAML(mockContext, mockRule, {
      rawRef: "0:00000000-0000-0000-0000-000000000000",
      loadTransparent: true,
      transparentPixel: { x: 1, y: 2 },
    })

    expect(result).toEqual({
      Ссылка: "0:00000000-0000-0000-0000-000000000000",
      ПрозрачныйФон: "Истина",
      ПрозрачныйПиксель: { x: 1, y: 2 },
    })
  })

  it("should throw error when standard picture is not found", () => {
    const invalidStandardPicture = {
      ref: "NonExistentPicture",
      type: "StandardPicture",
      loadTransparent: true,
    } as Picture

    expect(() => {
      exportPictureToYAML(mockContext, mockRule, invalidStandardPicture)
    }).toThrowError()
  })
})
