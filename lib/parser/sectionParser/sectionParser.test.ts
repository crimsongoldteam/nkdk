import { expect, it } from "vitest"
import { parseSections } from "./sectionParser"

it("should parse text with sections", () => {
  const mock = `--- Раздел 1 ---
    Содержимое раздела
    --- Раздел 2 ---
    Содержимое раздела 2`

  const result = parseSections(mock)
  expect(result).toEqual(mock)
})
