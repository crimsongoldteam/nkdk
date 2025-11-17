import { it, expect, describe } from "vitest"

import { RegionsVisitor } from "./regionsVisitor"
import { parseRegions } from "./regionsParser"

describe("regionsVisitor", () => {
  it("should group by regions", () => {
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

    const cst = parseRegions(mock)

    const visitor = new RegionsVisitor()
    const result = visitor.lines(cst)
    expect(result).toEqual(expectedResult)
  })

  it("should group by regions without first section header", () => {
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

    const cst = parseRegions(mock)

    const visitor = new RegionsVisitor()
    const result = visitor.lines(cst)
    expect(result).toEqual(expectedResult)
  })

  it("should group by only one region with empty content", () => {
    const mock = ``

    const expectedResult = [
      {
        title: "",
        content: "",
      },
    ]

    const cst = parseRegions(mock)

    const visitor = new RegionsVisitor()
    const result = visitor.lines(cst)
    expect(result).toEqual(expectedResult)
  })
})
