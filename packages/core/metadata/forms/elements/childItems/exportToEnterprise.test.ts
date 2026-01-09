import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/button/exportToEnterprise"
import "~/metadata/forms/elements/inputField/exportToEnterprise"
import { FormElementType } from "~/metadata/metadataFactory/types"
import {
  childItemsFixturesTable,
  differentTypesChildItemsEnterprise,
  singleChildItemsEnterprise,
} from "~/tests/fixtures/childItems/data"
import { mockСontext } from "~/tests/mockContext"
import { exportChildItemsToEnterprise } from "./exportToEnterprise"

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
    const invalidChildItems = [{ name: "InvalidElement", id: "1", elementType: FormElementType.CalendarField }]

    expect(() => {
      exportChildItemsToEnterprise(mockСontext, invalidChildItems)
    }).toThrowError("Export function not found for element type: CalendarField")
  })
})
