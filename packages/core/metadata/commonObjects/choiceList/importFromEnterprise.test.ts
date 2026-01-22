import { describe, expect, it } from "vitest"
import {
  emptyValueChoiceList,
  emptyValueChoiceListEnterprise,
  oneItemChoiceList,
  oneItemChoiceListEnterprise,
  twoItemsChoiceList,
  twoItemsChoiceListEnterprise,
} from "~/tests/fixtures/choiceList/data"
import { mockСontext } from "~/tests/mockContext"
import { importChoiceListFromEnterprise } from "./importFromEnterprise"

describe("importChoiceListFromEnterprise", () => {
  it("should return undefined for undefined input", () => {
    const result = importChoiceListFromEnterprise(mockСontext, undefined)
    expect(result).toBeUndefined()
  })

  it("should import one item choice list", () => {
    const result = importChoiceListFromEnterprise(mockСontext, oneItemChoiceListEnterprise)

    expect(result).toEqual(oneItemChoiceList)
  })

  it("should import two items choice list", () => {
    const result = importChoiceListFromEnterprise(mockСontext, twoItemsChoiceListEnterprise)

    expect(result).toEqual(twoItemsChoiceList)
  })

  it("should import empty value choice list", () => {
    const result = importChoiceListFromEnterprise(mockСontext, emptyValueChoiceListEnterprise)

    expect(result).toEqual(emptyValueChoiceList)
  })
})
