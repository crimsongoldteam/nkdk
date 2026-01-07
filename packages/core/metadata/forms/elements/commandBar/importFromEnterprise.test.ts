import { describe, expect, it } from "vitest"
import { fullCommandBar, fullCommandBarEnterprise, minimalCommandBar, minimalCommandBarEnterprise } from "~/tests/fixtures/forms/commandBar/data"
import { mockСontext } from "~/tests/mockContext"
import { importCommandBarFromEnterprise } from "./importFromEnterprise"

describe("importCommandBarFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importCommandBarFromEnterprise(mockСontext, undefined, fullCommandBar.name)

    expect(result).toBeUndefined()
  })

  it("should import all fields from Enterprise", () => {
    const result = importCommandBarFromEnterprise(mockСontext, fullCommandBarEnterprise, fullCommandBar.name)
    result!.id = "1"

    expect(result).toEqual(fullCommandBar)
  })

  it("should import minimal", () => {
    const result = importCommandBarFromEnterprise(mockСontext, minimalCommandBarEnterprise, minimalCommandBar.name)
    result!.id = "1"

    expect(result).toEqual(minimalCommandBar)
  })
})

