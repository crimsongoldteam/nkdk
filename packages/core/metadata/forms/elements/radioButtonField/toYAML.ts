import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML } from "~/metadata/orchestration"
import {
  fullRadioButtonField,
  fullRadioButtonFieldPartialYAML,
  minimalRadioButtonField,
} from "~/tests/fixtures/forms/radioButtonField/data"
import { mockContext } from "~/tests/mockContext"

describe("exportRadioButtonFieldToYAML", () => {
  describe("exportElementToPartialYAML", () => {
    it("should export all fields to YAML", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: fullRadioButtonField })

      expect(result).toEqual(fullRadioButtonFieldPartialYAML)
    })

    it("should export minimal", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: minimalRadioButtonField })

      expect(result).toBeUndefined()
    })
  })
})
