import { describe, expect, it } from "vitest"
import {
  fullCommandInterface,
  fullCommandInterfaceEnterprise,
} from "~/tests/fixtures/commandInterface/data"
import { mockСontext } from "~/tests/mockContext"
import { importCommandInterfaceFromEnterprise } from "./importFromEnterprise"

describe("importCommandInterfaceFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importCommandInterfaceFromEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import full command interface", () => {
    const result = importCommandInterfaceFromEnterprise(mockСontext, fullCommandInterfaceEnterprise)

    expect(result).toEqual(fullCommandInterface)
  })
})
