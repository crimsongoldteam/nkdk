import { describe, expect, it } from "vitest"
import { fullFormCommands, fullFormCommandsYAML, minimalFormCommandYAML } from "~/tests/fixtures/forms/commands/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importCommandsFromYAML } from "./fromYAML"
import { FormCommand } from "./types"

describe("importCommandFromYAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importCommandsFromYAML(mockContext, mockRule, undefined)

    expect(result).toEqual([])
  })

  it("should import all fields from YAML", () => {
    const result = importCommandsFromYAML(mockContext, mockRule, fullFormCommandsYAML)
    expect(result).toEqual(fullFormCommands)
  })

  it("should import minimal", () => {
    const result = importCommandsFromYAML(mockContext, mockRule, minimalFormCommandYAML)
    const expectedFromYAML: FormCommand[] = [
      {
        itemType: "FormCommand",
        name: "СоставКомплектаПодобратьФайлы",
        title: { items: { ru: "Состав комплекта подобрать файлы" } },
      },
    ]
    expect(result).toEqual(expectedFromYAML)
  })
})
