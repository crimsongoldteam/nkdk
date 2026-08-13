import { describe, expect, it } from "vitest"
import { yamlScalarTagAt } from "../../../yaml/scalarTags"
import { readExplicitElementXMLName, writeExplicitElementXMLName } from "./explicitName"

describe("явное XML-имя встроенного элемента формы", () => {
  it.each(["СтароеИмя", ""])("сохраняет имя %j дословно", (name) => {
    const yaml: Record<string, unknown> = {}

    writeExplicitElementXMLName(yaml, name)

    expect(readExplicitElementXMLName(yaml)).toBe(name)
    expect(yamlScalarTagAt(yaml, "Имя")).toBe("xml")
  })

  it("отклоняет обычное поле Имя", () => {
    expect(() => readExplicitElementXMLName({ Имя: "СтароеИмя" }))
      .toThrow("Поле Имя встроенного элемента допустимо только с тегом !xml")
  })
})
