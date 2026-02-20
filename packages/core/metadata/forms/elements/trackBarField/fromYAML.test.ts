import { describe, expect, it } from "vitest"
import { CollectionFormElementType, importElementFromPartialYAML } from "~/metadata/metadataFactory"
import { fullTrackBarField, fullTrackBarFieldPartialYAML } from "~/tests/fixtures/forms/trackBarField/data"
import { mockContext } from "~/tests/mockContext"

describe("importTrackBarFieldFromYAML", () => {
  describe("importTrackBarFieldPartialFromYAML", () => {
    it("should import all fields from YAML", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        itemType: CollectionFormElementType.TrackBarField,
        yaml: fullTrackBarFieldPartialYAML,
        source: fullTrackBarField,
      })

      expect(result).toEqual(fullTrackBarField)
    })
  })
})
