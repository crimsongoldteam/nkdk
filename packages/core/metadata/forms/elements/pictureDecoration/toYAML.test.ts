import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML } from "~/metadata/metadataFactory"
import {
  fullPictureDecoration,
  fullPictureDecorationPartialYAML,
  minimalPictureDecoration,
} from "~/tests/fixtures/forms/pictureDecoration/data"
import { mockContext } from "~/tests/mockContext"

describe("exportPictureDecorationPartialToYAML", () => {
  it("should export all fields to YAML", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: fullPictureDecoration })

    expect(result).toEqual(fullPictureDecorationPartialYAML)
  })

  it("should export minimal", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: minimalPictureDecoration })

    expect(result).toBeUndefined()
  })
})
