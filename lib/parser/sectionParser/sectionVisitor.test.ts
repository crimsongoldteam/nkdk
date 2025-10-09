import { it, expect } from "vitest"

import { SectionVisitor } from "./sectionVisitor"
import { parseSections } from "./sectionParser"

it("should group by sections", () => {
  const mock = `--- Раздел 1 ---
    Содержимое раздела 1.1
    Содержимое раздела 1.2
    --- Раздел 2 ---
    Содержимое раздела 2`

  const expectedResult = [
    {
      title: "Раздел 1",
      content: "Содержимое раздела 1.1\nСодержимое раздела 1.2",
    },
    {
      title: "Раздел 2",
      content: "Содержимое раздела 2",
    },
  ]

  const cst = parseSections(mock)

  const visitor = new SectionVisitor()
  const result = visitor.lines(cst)
  expect(result).toEqual(expectedResult)
})

it("should group by sections without first section header", () => {
  const mock = ` Содержимое раздела 1.1
      Содержимое раздела 1.2
      --- Раздел 2 ---
      Содержимое раздела 2`

  const expectedResult = [
    {
      title: "",
      content: "Содержимое раздела 1.1\nСодержимое раздела 1.2",
    },
    {
      title: "Раздел 2",
      content: "Содержимое раздела 2",
    },
  ]

  const cst = parseSections(mock)

  const visitor = new SectionVisitor()
  const result = visitor.lines(cst)
  expect(result).toEqual(expectedResult)
})

it("should group by only one section with empty content", () => {
  const mock = ``

  const expectedResult = [
    {
      title: "",
      content: "",
    },
  ]

  const cst = parseSections(mock)

  const visitor = new SectionVisitor()
  const result = visitor.lines(cst)
  expect(result).toEqual(expectedResult)
})
