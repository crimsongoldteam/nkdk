import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/exportToEnterprise"
import {
  childItemsFixturesTable,
  differentTypesChildItemsEnterprise,
  singleChildItemsEnterprise,
} from "~/tests/fixtures/childItems/data"
import { mockСontext } from "~/tests/mockContext"
import { exportChildItemsToEnterprise } from "./exportToEnterprise"
import { ChildItems } from "./types"

describe("exportChildItemsToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportChildItemsToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should return undefined when data is empty array", () => {
    const result = exportChildItemsToEnterprise(mockСontext, [])

    expect(result).toBeUndefined()
  })

  it("should export single child item to Enterprise", () => {
    const fixture = childItemsFixturesTable.find((f) => f.name === "single")
    const result = exportChildItemsToEnterprise(mockСontext, fixture!.element!)

    expect(result).toEqual(singleChildItemsEnterprise)
  })

  it("should export different types to Enterprise", () => {
    const fixture = childItemsFixturesTable.find((f) => f.name === "different types")
    const result = exportChildItemsToEnterprise(mockСontext, fixture!.element!)

    expect(result).toEqual(differentTypesChildItemsEnterprise)
  })

  it("should throw error when export function not found for element type", () => {
    const invalidChildItems = [{ name: "InvalidElement", elementType: "InvalidElementType" }] as unknown as ChildItems

    expect(() => {
      exportChildItemsToEnterprise(mockСontext, invalidChildItems)
    }).toThrow()
  })
})
