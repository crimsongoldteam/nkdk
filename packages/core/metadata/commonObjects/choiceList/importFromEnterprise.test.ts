import { describe, expect, it } from "vitest"
import {
  emptyValueChoiceList,
  emptyValueChoiceListYAML,
  oneItemChoiceList,
  oneItemChoiceListYAML,
  twoItemsChoiceList,
  twoItemsChoiceListYAML,
} from "~/tests/fixtures/choiceList/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importChoiceListFromYAML } from "./fromYAML"

describe("importChoiceListFromYAML", () => {
  it("should return undefined for undefined input", () => {
    const result = importChoiceListFromYAML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should import one item choice list", () => {
    const result = importChoiceListFromYAML(mockContext, mockRule, oneItemChoiceListYAML)

    expect(result).toEqual(oneItemChoiceList)
  })

  it("should import two items choice list", () => {
    const result = importChoiceListFromYAML(mockContext, mockRule, twoItemsChoiceListYAML)

    expect(result).toEqual(twoItemsChoiceList)
  })

  it("should import empty value choice list", () => {
    const result = importChoiceListFromYAML(mockContext, mockRule, emptyValueChoiceListYAML)

    expect(result).toEqual(emptyValueChoiceList)
  })
})
