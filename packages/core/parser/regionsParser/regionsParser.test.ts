import { describe, expect, it } from "vitest"
import { parseRegions } from "./regionsParser"

describe("regionsParser", () => {
  it("should parse text with sections", () => {
    const mock = `--- Раздел 1 ---
  Содержимое раздела 1
  --- Раздел 2 ---
  Содержимое раздела 2`

    const cst = parseRegions(mock)

    expect(cst[0].children.header?.[0].children.Text?.[0].image).to.equal("Раздел 1 ")
    expect(cst[1].children.text?.[0].children.Text?.[0].image).to.equal("Содержимое раздела 1")
    expect(cst[2].children.header?.[0].children.Text?.[0].image).to.equal("Раздел 2 ")
    expect(cst[3].children.text?.[0].children.Text?.[0].image).to.equal("Содержимое раздела 2")
  })

  it("should parse text without first section", () => {
    const mock = `Содержимое раздела 1
  --- Раздел 2 ---
  Содержимое раздела 2`

    const cst = parseRegions(mock)

    expect(cst[0].children.text?.[0].children.Text?.[0].image).to.equal("Содержимое раздела 1")
    expect(cst[1].children.header?.[0].children.Text?.[0].image).to.equal("Раздел 2 ")
    expect(cst[2].children.text?.[0].children.Text?.[0].image).to.equal("Содержимое раздела 2")
  })
})
