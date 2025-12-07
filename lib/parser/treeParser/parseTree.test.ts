import { describe, expect, it } from "vitest"
import { parseTree } from "./parseTree"

describe("parseTree", () => {
  it("should parse one item", () => {
    const mock = `text`

    const expectedResult = [{ content: "text" }]

    const result = parseTree(mock)

    expect(result).toEqual(expectedResult)
  })

  it("should parse two lines", () => {
    const mock = `text
text2`

    const expectedResult = [{ content: "text" }, { content: "text2" }]

    const result = parseTree(mock)

    expect(result).toEqual(expectedResult)
  })

  it("should parse two line items with one indent", () => {
    const mock = `text1
 text2`
    const expectedResult = [
      { content: "text1", childItems: [{ content: "text2" }] },
    ]

    const result = parseTree(mock)

    expect(result).toEqual(expectedResult)
  })

  it("should parse two line items with two indent", () => {
    const mock = `text1
  text2`
    const expectedResult = [
      { content: "text1", childItems: [{ content: "text2" }] },
    ]

    const result = parseTree(mock)

    expect(result).toEqual(expectedResult)
  })

  it("should parse two line items with tab indent", () => {
    const mock = `text1
	\ttext2`
    const expectedResult = [
      { content: "text1", childItems: [{ content: "text2" }] },
    ]

    const result = parseTree(mock)

    expect(result).toEqual(expectedResult)
  })

  it("should parse hierarchical content", () => {
    const mock = `text1
  text2
  text3`
    const expectedResult = [
      {
        content: "text1",
        childItems: [{ content: "text2" }, { content: "text3" }],
      },
    ]

    const result = parseTree(mock)

    expect(result).toEqual(expectedResult)
  })

  it("should parse different hierarchical content", () => {
    const mock = `text1
  text2
  text3
    text4`

    const expectedResult = [
      {
        content: "text1",
        childItems: [
          { content: "text2" },
          { content: "text3", childItems: [{ content: "text4" }] },
        ],
      },
    ]

    const result = parseTree(mock)

    expect(result).toEqual(expectedResult)
  })

  it("should parse one line group item without header and name", () => {
    const mock = `=; text1; text2`

    const expectedResult = [
      {
        content: "%{}",
        childItems: [{ content: "text1" }, { content: "text2" }],
      },
    ]

    const result = parseTree(mock)

    expect(result).toEqual(expectedResult)
  })

  it("should parse one line group item with header and name", () => {
    const mock = `=group header{GroupName}; text1; text2`

    const expectedResult = [
      {
        content: "%%%group header{GroupName}",
        childItems: [{ content: "text1" }, { content: "text2" }],
      },
    ]

    const result = parseTree(mock)

    expect(result).toEqual(expectedResult)
  })
})
