import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML } from "~/metadata/metadataFactory"
import {
  fullTrackBarField,
  fullTrackBarFieldPartialYAML,
  minimalTrackBarField,
} from "~/tests/fixtures/forms/trackBarField/data"
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
