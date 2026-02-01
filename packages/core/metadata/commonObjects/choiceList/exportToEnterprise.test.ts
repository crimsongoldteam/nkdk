import { describe, expect, it } from "vitest"
import {
  emptyValueChoiceList,
  emptyValueChoiceListEnterprise,
  oneItemChoiceList,
  oneItemChoiceListEnterprise,
  twoItemsChoiceList,
  twoItemsChoiceListEnterprise,
} from "~/tests/fixtures/choiceList/data"
import { mockContext } from "~/tests/mockContext"
import { exportChoiceListToEnterprise } from "./exportToEnterprise"

describe("exportChoiceListToEnterprise", () => {
  it("should return undefined for undefined input", () => {
    const result = exportChoiceListToEnterprise(mockContext, undefined)
    expect(result).toBeUndefined()
  })

  it("should export one item choice list", () => {
    const result = exportChoiceListToEnterprise(mockContext, oneItemChoiceList)

    expect(result).toEqual(oneItemChoiceListEnterprise)
  })

  it("should export two items choice list", () => {
    const result = exportChoiceListToEnterprise(mockContext, twoItemsChoiceList)

    expect(result).toEqual(twoItemsChoiceListEnterprise)
  })

  it("should export empty value choice list", () => {
    const result = exportChoiceListToEnterprise(mockContext, emptyValueChoiceList)

    expect(result).toEqual(emptyValueChoiceListEnterprise)
  })
})
