import { describe, it, expect } from "vitest"

describe("parseElements", () => {
  it("should parse elements", () => {
    const mock = `text`

    const expectedResult = [{ content: "text" }]

    const result = parseElements(mock)

    expect(result).toEqual(expectedResult)
  })
})
