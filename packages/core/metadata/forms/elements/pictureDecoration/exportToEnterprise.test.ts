import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML } from "~/metadata/metadataFactory"
import {
  fullPictureDecoration,
  fullPictureDecorationPartialEnterprise,
  minimalPictureDecoration,
} from "~/tests/fixtures/forms/pictureDecoration/data"
import { mockContext } from "~/tests/mockContext"

describe("exportPictureDecorationPartialToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: fullPictureDecoration })

    expect(result).toEqual(fullPictureDecorationPartialEnterprise)
  })

  it("should export minimal", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: minimalPictureDecoration })

    expect(result).toBeUndefined()
  })
})
