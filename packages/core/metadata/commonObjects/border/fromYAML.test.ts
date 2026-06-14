import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "../../../tests/mockContext"
import { importBorderFromYAML } from "./fromYAML"

describe("importBorderFromYAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importBorderFromYAML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("imports project style item refs with Russian metadata root", () => {
    const result = importBorderFromYAML(mockContext, mockRule, {
      Имя: "ЭлементСтиля.Solid",
      Ширина: 1,
      ТипРамки: "Двойная",
    })

    expect(result).toEqual({
      ref: "Solid",
      width: 1,
      controlBorderType: "Double",
    })
  })

  it("rejects raw XML style refs from YAML", () => {
    expect(() =>
      importBorderFromYAML(mockContext, mockRule, {
        Имя: "style:Solid",
      } as never)
    ).toThrow('Неизвестный корень "style:Solid"')
  })
})
