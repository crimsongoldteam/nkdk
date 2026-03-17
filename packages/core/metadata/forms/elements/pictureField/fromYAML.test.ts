import { describe, expect, it } from "vitest"
import { importElementFromPartialYAML, importElementFromTypedYAML } from "~/metadata/orchestration"
import {
  fullPictureField,
  fullPictureFieldPartialYAML,
  fullTablePictureField,
  fullTablePictureFieldTypedYAML,
  minimalPictureField,
  minimalPictureFieldPartialYAML,
  minimalTablePictureField,
  minimalTablePictureFieldTypedYAML,
} from "~/tests/fixtures/forms/pictureField/data"
import { mockContext } from "~/tests/mockContext"
import { TablePictureField } from "./types"

describe("importPictureFieldFromYAML", () => {
  describe("importPictureFieldPartialFromYAML", () => {
    it("should import all fields from YAML", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        itemType: "PictureField",
        yaml: fullPictureFieldPartialYAML,
        source: fullPictureField,
      })

      expect(result).toEqual(fullPictureField)
    })

    it("should import minimal", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        itemType: "PictureField",
        yaml: minimalPictureFieldPartialYAML,
        source: minimalPictureField,
      })

      expect(result).toEqual(minimalPictureField)
    })
  })

  describe("importTablePictureFieldTypedFromYAML", () => {
    it("should import all fields from YAML", () => {
      const result = importElementFromTypedYAML<TablePictureField>({
        context: mockContext,
        yaml: fullTablePictureFieldTypedYAML,
        name: "ПолеКартинки",
      })

      expect(result).toEqual(fullTablePictureField)
    })

    it("should import minimal", () => {
      const result = importElementFromTypedYAML<TablePictureField>({
        context: mockContext,
        yaml: minimalTablePictureFieldTypedYAML,
        name: "ПолеКартинки",
      })

      expect(result).toEqual(minimalTablePictureField)
    })
  })
})
