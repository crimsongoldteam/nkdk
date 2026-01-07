import { describe, expect, it } from "vitest"
import { fullPopup, fullPopupEnterprise, minimalPopup, minimalPopupEnterprise } from "~/tests/fixtures/forms/popup/data"
import { mockСontext } from "~/tests/mockContext"
import { exportPopupToEnterprise } from "./exportToEnterprise"

describe("exportPopupToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportPopupToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportPopupToEnterprise(mockСontext, fullPopup)

    expect(result).toEqual(fullPopupEnterprise)
  })

  it("should export minimal", () => {
    const result = exportPopupToEnterprise(mockСontext, minimalPopup)

    expect(result).toEqual(minimalPopupEnterprise)
  })
})


