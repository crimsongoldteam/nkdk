import { describe, expect, it } from "vitest"
import { typeFixturesTable } from "./__fixtures__/data"
import { parseTypeDescriptionYAML } from "./parseYAML"

describe("parseTypeDescriptionYAML", () => {
  it.each(typeFixturesTable)("преобразует YAML-типы по общему договору: $enterprise", ({ internal, YAML }) => {
    expect(parseTypeDescriptionYAML(YAML)).toEqual(internal)
  })

  it.each([
    undefined,
    "",
    "   ",
    123,
    { ИдентификаторТипа: "8c1e3694-da12-44d5-8b1f-d134b89a1282" },
    { ИдентификаторТипа: [123] },
  ])("не создаёт описание из структурно неподходящего значения %#", (value) => {
    expect(parseTypeDescriptionYAML(value)).toBeUndefined()
  })
})
