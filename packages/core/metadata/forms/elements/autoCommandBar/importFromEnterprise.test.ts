import { describe, expect, it } from "vitest"
import {
  fullAutoCommandBar,
  fullAutoCommandBarEnterprise,
  minimalAutoCommandBar,
} from "~/tests/fixtures/forms/autoCommandBar/data"
import { mockСontext } from "~/tests/mockContext"
import { importAutoCommandBarFromEnterprise } from "./importFromEnterprise"

describe("importAutoCommandBarFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importAutoCommandBarFromEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import all fields from Enterprise", () => {
    const result = importAutoCommandBarFromEnterprise(mockСontext, fullAutoCommandBarEnterprise)

    expect(result).toEqual(fullAutoCommandBar)
  })

  it("should import minimal", () => {
    const result = importAutoCommandBarFromEnterprise(mockСontext, minimalAutoCommandBarEnterprise)

    expect(result).toEqual(minimalAutoCommandBar)
  })
})
