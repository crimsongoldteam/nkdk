import { describe, expect, it } from "vitest"
import { fullCommandInterface, fullCommandInterfaceYAML } from "~/tests/fixtures/commandInterface/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importCommandInterfaceFromYAML } from "./fromYAML"

describe("importCommandInterfaceFromYAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importCommandInterfaceFromYAML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should import full command interface", () => {
    const result = importCommandInterfaceFromYAML(mockContext, mockRule, fullCommandInterfaceYAML)

    expect(result).toEqual(fullCommandInterface)
  })
})
