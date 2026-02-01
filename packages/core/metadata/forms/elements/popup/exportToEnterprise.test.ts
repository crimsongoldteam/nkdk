import { describe, expect, it } from "vitest"
import {
  fullPopup,
  fullPopupPartialEnterprise,
  fullPopupTypedEnterprise,
  minimalPopup,
  minimalPopupPartialEnterprise,
  minimalPopupTypedEnterprise,
} from "~/tests/fixtures/forms/popup/data"
import { mockContext } from "~/tests/mockContext"
import { exportPopupPartialToEnterprise, exportPopupTypedToEnterprise } from "./exportToEnterprise"

describe("exportPopupPartialToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportPopupPartialToEnterprise(mockContext, fullPopup)

    expect(result).toEqual(fullPopupPartialEnterprise)
  })

  it("should export minimal", () => {
    const result = exportPopupPartialToEnterprise(mockContext, minimalPopup)

    expect(result).toEqual(minimalPopupPartialEnterprise)
  })
})

describe("exportPopupTypedToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportPopupTypedToEnterprise(mockContext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportPopupTypedToEnterprise(mockContext, fullPopup)

    expect(result).toEqual(fullPopupTypedEnterprise)
  })

  it("should export minimal", () => {
    const result = exportPopupTypedToEnterprise(mockContext, minimalPopup)

    expect(result).toEqual(minimalPopupTypedEnterprise)
  })
})
