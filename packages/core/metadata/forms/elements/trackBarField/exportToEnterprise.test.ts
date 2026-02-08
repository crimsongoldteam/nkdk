import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML } from "~/metadata/metadataFactory"
import {
  fullTrackBarField,
  fullTrackBarFieldPartialEnterprise,
  minimalTrackBarField,
  minimalTrackBarFieldPartialEnterprise,
} from "~/tests/fixtures/forms/trackBarField/data"
import { mockContext } from "~/tests/mockContext"

describe("exportTrackBarFieldToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: fullTrackBarField })

    expect(result).toEqual(fullTrackBarFieldPartialEnterprise)
  })

  it("should export minimal", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: minimalTrackBarField })

    expect(result).toEqual(minimalTrackBarFieldPartialEnterprise)
  })
})
