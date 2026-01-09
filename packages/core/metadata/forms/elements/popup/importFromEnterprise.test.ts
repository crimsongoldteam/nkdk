import { describe, expect, it } from "vitest"
import { fullPopup, fullPopupEnterprise, minimalPopup, minimalPopupEnterprise } from "~/tests/fixtures/forms/popup/data"
import { mockСontext } from "~/tests/mockContext"
import { importPopupFromEnterprise } from "./importFromEnterprise"

describe("importPopupFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importPopupFromEnterprise(mockСontext, undefined, fullPopup.name)

    expect(result).toBeUndefined()
  })

  it("should import all fields from Enterprise", () => {
    const result = importPopupFromEnterprise(mockСontext, fullPopupEnterprise, fullPopup.name)

    expect(result).toEqual(fullPopup)
  })

  it("should import minimal", () => {
    const result = importPopupFromEnterprise(mockСontext, minimalPopupEnterprise, minimalPopup.name)

    expect(result).toEqual(minimalPopup)
  })
})


