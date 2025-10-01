import { describe, it, expect, vi } from "vitest"
import { CstChildrenDictionary, createTokenInstance } from "chevrotain"
import inputFieldVisit from "./parseVisit"
import { Visitor } from "~/lib/parser/visitor"

const visitor = new Visitor()

const createMockToken = (image: string) => createTokenInstance({ name: "MockToken" }, image, 0, 0, 0, 0, 0, 0)

describe("inputFieldVisit", () => {
  it("should return empty TInputField object when no tokens", () => {
    const ctx: CstChildrenDictionary = {}

    const result = inputFieldVisit(visitor, ctx)

    expect(result).toEqual({})
  })

  it("should handle only InputHeader tokens", () => {
    const ctx: CstChildrenDictionary = {
      InputHeader: [createMockToken("Field title"), createMockToken(" input")],
    }

    const result = inputFieldVisit(visitor, ctx)

    expect(result).toEqual({
      title: { ru: "Field title input" },
    })
  })

  it("should handle only InputValue tokens", () => {
    const ctx: CstChildrenDictionary = {
      InputValue: [createMockToken("Value"), createMockToken(" text")],
    }

    const result = inputFieldVisit(visitor, ctx)

    expect(result).toEqual({
      value: "Value text",
    })
  })

  it("should handle both InputHeader and InputValue tokens", () => {
    const ctx: CstChildrenDictionary = {
      InputHeader: [createMockToken("Title")],
      InputValue: [createMockToken("Text")],
    }

    const result = inputFieldVisit(visitor, ctx)

    expect(result).toEqual({
      title: { ru: "Title" },
      value: "Text",
    })
  })
})
