import { describe, expect, it } from "vitest"
import {
  emptyValueChoiceList,
  emptyValueChoiceListEnterprise,
  oneItemChoiceList,
  oneItemChoiceListEnterprise,
  twoItemsChoiceList,
  twoItemsChoiceListEnterprise,
} from "~/tests/fixtures/choiceList/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportChoiceListToEnterprise } from "./exportToEnterprise"

describe("exportChoiceListToEnterprise", () => {
  it("should return undefined for undefined input", () => {
    const result = exportChoiceListToEnterprise(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should export one item choice list", () => {
    const result = exportChoiceListToEnterprise(mockContext, mockRule, oneItemChoiceList)

    expect(result).toEqual(oneItemChoiceListEnterprise)
  })

  it("should export two items choice list", () => {
    const result = exportChoiceListToEnterprise(mockContext, mockRule, twoItemsChoiceList)

    expect(result).toEqual(twoItemsChoiceListEnterprise)
  })

  it("should export empty value choice list", () => {
    const result = exportChoiceListToEnterprise(mockContext, mockRule, emptyValueChoiceList)

    expect(result).toEqual(emptyValueChoiceListEnterprise)
  })
})
