import { describe, expect, it } from "vitest"
import { importElementFromPartialYAML } from "~/metadata/orchestration"
import { fullTrackBarField, fullTrackBarFieldPartialYAML } from "~/metadata/forms/elements/trackBarField/__fixtures__/data"
import { mockContext } from "~/tests/mockContext"

describe("importTrackBarFieldFromYAML", () => {
  describe("importTrackBarFieldPartialFromYAML", () => {
    it("should import all fields from YAML", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        itemType: "TrackBarField",
        yaml: fullTrackBarFieldPartialYAML,
        source: fullTrackBarField,
      })

      expect(result).toEqual(fullTrackBarField)
    })
  })
})
