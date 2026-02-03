import { describe, expect, it } from "vitest"
import {
  fullPopup,
  fullPopupPartialEnterprise,
  fullPopupTypedEnterprise,
  minimalPopup,
  minimalPopupPartialEnterprise,
  minimalPopupTypedEnterprise,
} from "~/tests/fixtures/forms/popup/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importPopupPartialFromEnterprise, importPopupTypedFromEnterprise } from "./importFromEnterprise"

describe("importPopupTypedFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importPopupTypedFromEnterprise(mockContext, mockRule, undefined, fullPopup.name)

    expect(result).toBeUndefined()
  })

  it("should import all fields from Enterprise", () => {
    const result = importPopupTypedFromEnterprise(mockContext, mockRule, fullPopupTypedEnterprise, fullPopup.name)

    expect(result).toEqual(fullPopup)
  })

  it("should import minimal", () => {
    const result = importPopupTypedFromEnterprise(mockContext, mockRule, minimalPopupTypedEnterprise, minimalPopup.name)

    expect(result).toEqual(minimalPopup)
  })
})

describe("importPopupPartialFromEnterprise", () => {
  // it("should return undefined when source is undefined", () => {
  //   const result = importPopupPartialFromEnterprise(mockContext, mockRule,  undefined, fullPopupPartialEnterprise)

  //   expect(result).toBeUndefined()
  // })

  it("should import all fields from Enterprise", () => {
    const result = importPopupPartialFromEnterprise(mockContext, mockRule, fullPopup, fullPopupPartialEnterprise)

    expect(result).toEqual(fullPopup)
  })

  it("should import minimal", () => {
    const result = importPopupPartialFromEnterprise(mockContext, mockRule, fullPopup, minimalPopupPartialEnterprise)

    expect(result).toEqual(fullPopup)
  })
})
