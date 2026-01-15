import { describe, expect, it } from "vitest"
import {
  fullPopup,
  fullPopupPartialEnterprise,
  fullPopupTypedEnterprise,
  minimalPopup,
  minimalPopupPartialEnterprise,
  minimalPopupTypedEnterprise,
} from "~/tests/fixtures/forms/popup/data"
import { mockСontext } from "~/tests/mockContext"
import { importPopupPartialFromEnterprise, importPopupTypedFromEnterprise } from "./importFromEnterprise"

describe("importPopupTypedFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importPopupTypedFromEnterprise(mockСontext, undefined, fullPopup.name)

    expect(result).toBeUndefined()
  })

  it("should import all fields from Enterprise", () => {
    const result = importPopupTypedFromEnterprise(mockСontext, fullPopupTypedEnterprise, fullPopup.name)

    expect(result).toEqual(fullPopup)
  })

  it("should import minimal", () => {
    const result = importPopupTypedFromEnterprise(mockСontext, minimalPopupTypedEnterprise, minimalPopup.name)

    expect(result).toEqual(minimalPopup)
  })
})

describe("importPopupPartialFromEnterprise", () => {
  it("should return undefined when source is undefined", () => {
    const result = importPopupPartialFromEnterprise(mockСontext, undefined, fullPopupPartialEnterprise)

    expect(result).toBeUndefined()
  })

  it("should import all fields from Enterprise", () => {
    const result = importPopupPartialFromEnterprise(mockСontext, fullPopup, fullPopupPartialEnterprise)

    expect(result).toEqual(fullPopup)
  })

  it("should import minimal", () => {
    const result = importPopupPartialFromEnterprise(mockСontext, fullPopup, minimalPopupPartialEnterprise)

    expect(result).toEqual(fullPopup)
  })
})
