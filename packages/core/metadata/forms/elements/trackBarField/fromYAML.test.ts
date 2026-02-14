import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromPartialYAML } from "~/metadata/metadataFactory"
import { fullTrackBarField, fullTrackBarFieldPartialEnterprise } from "~/tests/fixtures/forms/trackBarField/data"
import { mockContext } from "~/tests/mockContext"

describe("importTrackBarFieldFromEnterprise", () => {
  describe("importTrackBarFieldPartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        itemType: FormElementType.TrackBarField,
        yaml: fullTrackBarFieldPartialEnterprise,
        source: fullTrackBarField,
      })

      expect(result).toEqual(fullTrackBarField)
    })
  })
})
