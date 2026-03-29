import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML } from "~/metadata/orchestration"
import {
  fullTrackBarField,
  fullTrackBarFieldPartialYAML,
  minimalTrackBarField,
} from "~/metadata/forms/elements/trackBarField/__fixtures__/data"
import { mockContext } from "~/tests/mockContext"

describe("exportTrackBarFieldToYAML", () => {
  it("should export all fields to YAML", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: fullTrackBarField })

    expect(result).toEqual(fullTrackBarFieldPartialYAML)
  })

  it("should export minimal", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: minimalTrackBarField })

    expect(result).toBeUndefined()
  })
})
