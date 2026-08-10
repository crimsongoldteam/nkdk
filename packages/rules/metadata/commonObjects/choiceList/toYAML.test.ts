import { describe, expect, it } from "vitest"
import {
  emptyValueChoiceList,
  emptyValueChoiceListYAML,
  oneItemChoiceList,
  oneItemChoiceListYAML,
  twoItemsChoiceList,
  twoItemsChoiceListYAML,
} from "./__fixtures__/data"
import { mockContext, mockRule } from "../../../tests/mockContext"
import { exportChoiceListToYAML } from "./toYAML"

describe("exportChoiceListToYAML", () => {
  it("should return undefined for undefined input", () => {
    const result = exportChoiceListToYAML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should export one item choice list", () => {
    const result = exportChoiceListToYAML(mockContext, mockRule, oneItemChoiceList)

    expect(result).toEqual(oneItemChoiceListYAML)
  })

  it("should export two items choice list", () => {
    const result = exportChoiceListToYAML(mockContext, mockRule, twoItemsChoiceList)

    expect(result).toEqual(twoItemsChoiceListYAML)
  })

  it("should export empty value choice list", () => {
    const result = exportChoiceListToYAML(mockContext, mockRule, emptyValueChoiceList)

    expect(result).toEqual(emptyValueChoiceListYAML)
  })
})
