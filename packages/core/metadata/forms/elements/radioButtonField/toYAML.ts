import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML } from "~/metadata/orchestration"
import {
  fullRadioButtonField,
  fullRadioButtonFieldPartialYAML,
  minimalRadioButtonField,
} from "~/metadata/forms/elements/radioButtonField/__fixtures__/data"
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
