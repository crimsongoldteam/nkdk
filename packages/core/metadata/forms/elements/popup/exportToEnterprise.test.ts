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
import { exportPopupPartialToEnterprise, exportPopupTypedToEnterprise } from "./exportToEnterprise"

describe("exportPopupPartialToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportPopupPartialToEnterprise(mockContext, mockRule, fullPopup)

    expect(result).toEqual(fullPopupPartialEnterprise)
  })

  it("should export minimal", () => {
    const result = exportPopupPartialToEnterprise(mockContext, mockRule, minimalPopup)

    expect(result).toEqual(minimalPopupPartialEnterprise)
  })
})

describe("exportPopupTypedToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportPopupTypedToEnterprise(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportPopupTypedToEnterprise(mockContext, mockRule, fullPopup)

    expect(result).toEqual(fullPopupTypedEnterprise)
  })

  it("should export minimal", () => {
    const result = exportPopupTypedToEnterprise(mockContext, mockRule, minimalPopup)

    expect(result).toEqual(minimalPopupTypedEnterprise)
  })
})
