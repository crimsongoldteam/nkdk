import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML } from "~/metadata/metadataFactory"
import {
  fullRadioButtonField,
  fullRadioButtonFieldPartialEnterprise,
  minimalRadioButtonField,
  minimalRadioButtonFieldPartialEnterprise,
} from "~/tests/fixtures/forms/radioButtonField/data"
import { mockContext } from "~/tests/mockContext"

describe("exportRadioButtonFieldToEnterprise", () => {
  describe("exportElementToPartialYAML", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: fullRadioButtonField })

      expect(result).toEqual(fullRadioButtonFieldPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: minimalRadioButtonField })

      expect(result).toEqual(minimalRadioButtonFieldPartialEnterprise)
    })
  })
})
