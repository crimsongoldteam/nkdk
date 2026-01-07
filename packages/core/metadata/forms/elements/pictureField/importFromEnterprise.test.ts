import { describe, expect, it } from "vitest"
import { fullPictureField, fullPictureFieldEnterprise, minimalPictureField, minimalPictureFieldEnterprise } from "~/tests/fixtures/forms/pictureField/data"
import { mockСontext } from "~/tests/mockContext"
import { importPictureFieldFromEnterprise } from "./importFromEnterprise"

describe("importPictureFieldFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importPictureFieldFromEnterprise(mockСontext, undefined, fullPictureField.name)

    expect(result).toBeUndefined()
  })

  it("should import all fields from Enterprise", () => {
    const result = importPictureFieldFromEnterprise(mockСontext, fullPictureFieldEnterprise, fullPictureField.name)
    result!.id = "1"

    expect(result).toEqual(fullPictureField)
  })

  it("should import minimal", () => {
    const result = importPictureFieldFromEnterprise(mockСontext, minimalPictureFieldEnterprise, minimalPictureField.name)
    result!.id = "1"

    expect(result).toEqual(minimalPictureField)
  })
})

