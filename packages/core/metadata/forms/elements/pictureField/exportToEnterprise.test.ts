import { describe, expect, it } from "vitest"
import {
  fullPictureField,
  fullPictureFieldPartialEnterprise,
  fullPictureFieldTypedEnterprise,
  minimalPictureField,
  minimalPictureFieldPartialEnterprise,
} from "~/tests/fixtures/forms/pictureField/data"
import { mockСontext } from "~/tests/mockContext"
import { exportPictureFieldPartialToEnterprise, exportPictureFieldTypedToEnterprise } from "./exportToEnterprise"

describe("exportPictureFieldPartialToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportPictureFieldPartialToEnterprise(mockСontext, fullPictureField)

    expect(result).toEqual(fullPictureFieldPartialEnterprise)
  })

  it("should export minimal", () => {
    const result = exportPictureFieldPartialToEnterprise(mockСontext, minimalPictureField)

    expect(result).toEqual(minimalPictureFieldPartialEnterprise)
  })
})

describe("exportPictureFieldTypedToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportPictureFieldTypedToEnterprise(mockСontext, fullPictureField)

    expect(result).toEqual(fullPictureFieldTypedEnterprise)
  })

  it("should return undefined when data is undefined", () => {
    const result = exportPictureFieldTypedToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })
})
