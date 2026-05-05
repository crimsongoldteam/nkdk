import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML } from "~/metadata/orchestration"
import {
  fullLabelDecoration,
  fullLabelDecorationPartialYAML,
  minimalLabelDecoration,
} from "~/tests/fixtures/forms/labelDecoration/data"
import { mockContext } from "~/tests/mockContext"

describe("LabelDecoration to YAML", () => {
  describe("Partial", () => {
    it("should export all fields to YAML", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: fullLabelDecoration })

      expect(result).toEqual(fullLabelDecorationPartialYAML)
    })

    it("should export minimal", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: minimalLabelDecoration })

      expect(result).toBeUndefined()
    })
  })
})
