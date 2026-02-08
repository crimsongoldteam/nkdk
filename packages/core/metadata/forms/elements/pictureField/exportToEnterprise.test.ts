import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML } from "~/metadata/metadataFactory"
import {
  fullPictureField,
  fullPictureFieldPartialEnterprise,
  minimalPictureField,
  minimalPictureFieldPartialEnterprise,
} from "~/tests/fixtures/forms/pictureField/data"
import { mockContext } from "~/tests/mockContext"

describe("exportPictureFieldToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: fullPictureField })

    expect(result).toEqual(fullPictureFieldPartialEnterprise)
  })

  it("should export minimal", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: minimalPictureField })

    expect(result).toEqual(minimalPictureFieldPartialEnterprise)
  })
})
