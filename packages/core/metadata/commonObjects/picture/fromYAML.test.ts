import { describe, expect, it } from "vitest"
import { pictureTestCases } from "~/metadata/commonObjects/picture/__fixtures__/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importPictureFromYAML } from "./fromYAML"

describe("importPictureFromYAML", () => {
  describe("importPictureFromYAML", () => {
    it("should return undefined for undefined input", () => {
      const result = importPictureFromYAML(mockContext, mockRule, undefined)

      expect(result).toBeUndefined()
    })

    it.each(pictureTestCases.filter((tc) => tc.fixture && tc.importYAML !== false))(
      "should import $name from YAML",
      ({ pictureYAML, picture }) => {
        const result = importPictureFromYAML(mockContext, mockRule, pictureYAML)

        expect(result).toEqual(picture)
      }
    )

    it.each(["0", "0:ca5b178d-2d5a-4cf7-b88e-6fbdb2e56065"])(
      "should import %s as raw ref from YAML",
      (rawRef) => {
        const result = importPictureFromYAML(mockContext, mockRule, rawRef)

        expect(result).toEqual({ rawRef })
      }
    )

    it("imports expanded raw picture refs with LoadTransparent from YAML", () => {
      const result = importPictureFromYAML(mockContext, mockRule, {
        Ссылка: "0:00000000-0000-0000-0000-000000000000",
        ПрозрачныйФон: "Ложь",
      })

      expect(result).toEqual({
        rawRef: "0:00000000-0000-0000-0000-000000000000",
        loadTransparent: false,
      })
    })

    it("imports expanded raw picture refs with transparent pixel from YAML", () => {
      const result = importPictureFromYAML(mockContext, mockRule, {
        Ссылка: "0:00000000-0000-0000-0000-000000000000",
        ПрозрачныйФон: "Истина",
        ПрозрачныйПиксель: { x: 1, y: 2 },
      })

      expect(result).toEqual({
        rawRef: "0:00000000-0000-0000-0000-000000000000",
        loadTransparent: true,
        transparentPixel: { x: 1, y: 2 },
      })
    })

    it("imports expanded raw picture refs with transparent pixel and without LoadTransparent from YAML", () => {
      const result = importPictureFromYAML(mockContext, mockRule, {
        Ссылка: "0",
        ПрозрачныйПиксель: { x: 12, y: 2 },
      })

      expect(result).toEqual({
        rawRef: "0",
        transparentPixel: { x: 12, y: 2 },
      })
    })

    it.each(["00", "0:g", "1:ca5b178d-2d5a-4cf7-b88e-6fbdb2e56065"])(
      "should not classify %s as raw ref from YAML",
      (ref) => {
        const result = importPictureFromYAML(mockContext, mockRule, ref)

        expect(result).not.toEqual({ rawRef: ref })
      }
    )
  })
  // describe("importPictureCombinedFromYAML", () => {
  //   it("should return undefined for undefined input", () => {
  //     const result = importPictureCombinedFromYAML(mockContext, mockRule,  undefined, undefined)

  //     expect(result).toBeUndefined()
  //   })

  //   it.each(pictureTestCases.filter((tc) => tc.fixture && tc.enterpriseimport !== false))(
  //     "should import $name from YAML",
  //     ({ pictureYAML, picture }) => {
  //       const result = importPictureCombinedFromYAML(mockContext, mockRule,  pictureYAML)

  //       expect(result).toEqual(picture)
  //     }
  //   )
  // })
})
