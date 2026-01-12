import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/exportToEnterprise"
import {
  childItemsFixturesTable,
  differentTypesChildItemsEnterprise,
  singleChildItemsEnterprise,
} from "~/tests/fixtures/childItems/data"
import { mockСontext } from "~/tests/mockContext"
import { exportPartialChildItemsToEnterprise, exportTypedChildItemsToEnterprise } from "./exportToEnterprise"
import { ChildItems } from "./types"

describe("exportTypedChildItemsToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportTypedChildItemsToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should return undefined when data is empty array", () => {
    const result = exportTypedChildItemsToEnterprise(mockСontext, [])

    expect(result).toBeUndefined()
  })

  it("should export single child item to Enterprise", () => {
    const fixture = childItemsFixturesTable.find((f) => f.name === "single")
    const result = exportTypedChildItemsToEnterprise(mockСontext, fixture!.element!)

    expect(result).toEqual(singleChildItemsEnterprise)
  })

  it("should export different types to Enterprise", () => {
    const fixture = childItemsFixturesTable.find((f) => f.name === "different types")
    const result = exportTypedChildItemsToEnterprise(mockСontext, fixture!.element!)

    expect(result).toEqual(differentTypesChildItemsEnterprise)
  })

  it("should throw error when export function not found for element type", () => {
    const invalidChildItems = [{ name: "InvalidElement", elementType: "InvalidElementType" }] as unknown as ChildItems

    expect(() => {
      exportTypedChildItemsToEnterprise(mockСontext, invalidChildItems)
    }).toThrow()
  })
})

describe("exportPartialChildItemsToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportPartialChildItemsToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should return undefined when data is empty array", () => {
    const result = exportPartialChildItemsToEnterprise(mockСontext, [])

    expect(result).toBeUndefined()
  })

  it("should export single child item to Enterprise", () => {
    const fixture = childItemsFixturesTable.find((f) => f.name === "single")
    const result = exportPartialChildItemsToEnterprise(mockСontext, fixture!.element!)

    expect(result).toEqual(singleChildItemsEnterprise)
  })

  it("should export different types to Enterprise", () => {
    const fixture = childItemsFixturesTable.find((f) => f.name === "different types")
    const result = exportPartialChildItemsToEnterprise(mockСontext, fixture!.element!)

    expect(result).toEqual(differentTypesChildItemsEnterprise)
  })

  it("should throw error when export function not found for element type", () => {
    const invalidChildItems = [{ name: "InvalidElement", elementType: "InvalidElementType" }] as unknown as ChildItems

    expect(() => {
      exportPartialChildItemsToEnterprise(mockСontext, invalidChildItems)
    }).toThrow()
  })
})
