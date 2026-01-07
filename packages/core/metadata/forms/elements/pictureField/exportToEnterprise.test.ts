import { describe, expect, it } from "vitest"
import { fullPictureField, fullPictureFieldEnterprise, minimalPictureField, minimalPictureFieldEnterprise } from "~/tests/fixtures/forms/pictureField/data"
import { mockСontext } from "~/tests/mockContext"
import { exportPictureFieldToEnterprise } from "./exportToEnterprise"

describe("exportPictureFieldToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportPictureFieldToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportPictureFieldToEnterprise(mockСontext, fullPictureField)

    expect(result).toEqual(fullPictureFieldEnterprise)
  })

  it("should export minimal", () => {
    const result = exportPictureFieldToEnterprise(mockСontext, minimalPictureField)

    expect(result).toEqual(minimalPictureFieldEnterprise)
  })
})

