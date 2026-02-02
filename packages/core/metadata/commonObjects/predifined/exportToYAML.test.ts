import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "../../../tests/mockContext"
import { exportPredefinedToYAML, exportPredefinedItemsToYAML } from "./exportToYAML"

describe("exportPredefinedToYAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportPredefinedToYAML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should export predefined item", () => {
    const data = {
      code: "Code1",
      name: "Name1",
      description: "Description",
      isFolder: false,
    }
    const result = exportPredefinedToYAML(mockContext, mockRule, data as any)
    expect(result).toEqual({
      Код: "Code1",
      Наименование: "Name1",
      ЭтоГруппа: false,
    })
  })
})

describe("exportPredefinedItemsToYAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportPredefinedItemsToYAML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should export predefined items", () => {
    const data = [
      { code: "Code1", name: "Name1", description: "Description", isFolder: false },
      { code: "Code2", name: "Name2", description: "Description", isFolder: true },
    ]
    const result = exportPredefinedItemsToYAML(mockContext, mockRule, data as any)
    expect(result).toEqual({
      Name1: { Код: "Code1", Наименование: "Name1", ЭтоГруппа: false },
      Name2: { Код: "Code2", Наименование: "Name2", ЭтоГруппа: true },
    })
  })
})
