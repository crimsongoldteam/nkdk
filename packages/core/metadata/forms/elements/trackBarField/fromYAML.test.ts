import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromYAMLPartial } from "~/metadata/metadataFactory"
import { fullTrackBarField, fullTrackBarFieldPartialEnterprise } from "~/tests/fixtures/forms/trackBarField/data"
import { mockContext } from "~/tests/mockContext"

describe("importTrackBarFieldFromEnterprise", () => {
  describe("importTrackBarFieldPartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importElementFromYAMLPartial({
        context: mockContext,
        elementType: FormElementType.TrackBarField,
        data: fullTrackBarFieldPartialEnterprise,
        source: fullTrackBarField,
      })

      expect(result).toEqual(fullTrackBarField)
    })
  })
})
