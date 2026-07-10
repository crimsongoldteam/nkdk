import { describe, expect, it } from "vitest"
import { fullFieldsList, fullFieldsListYAML } from "./__fixtures__/data"
import { mockContext, mockRule } from "../../../tests/mockContext"
import { importFieldsListFromYAML } from "./fromYAML"

describe("importFieldsListFromYAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importFieldsListFromYAML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should import full", () => {
    const result = importFieldsListFromYAML(mockContext, mockRule, fullFieldsListYAML)

    expect(result).toEqual(fullFieldsList)
  })
})
