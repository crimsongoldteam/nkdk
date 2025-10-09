import { expect, it } from "vitest"
import { parseSections } from "./sectionParser"
import { ZodError } from "zod"
import { ZCSTSections } from "./types"

it("should parse text with sections", () => {
  const mock = `--- Раздел 1 ---
  Содержимое раздела 1
  --- Раздел 2 ---
  Содержимое раздела 2`

  const cst = parseSections(mock)

  expect(() => ZCSTSections.parse(cst)).not.toThrow(ZodError)
  expect(cst[0].children.sectionHeader?.[0].children.Text?.[0].image).to.equal("Раздел 1 ")
  expect(cst[1].children.text?.[0].children.Text?.[0].image).to.equal("Содержимое раздела 1")
  expect(cst[2].children.sectionHeader?.[0].children.Text?.[0].image).to.equal("Раздел 2 ")
  expect(cst[3].children.text?.[0].children.Text?.[0].image).to.equal("Содержимое раздела 2")
})

it("should parse text without first section", () => {
  const mock = `Содержимое раздела 1
  --- Раздел 2 ---
  Содержимое раздела 2`

  const cst = parseSections(mock)

  expect(() => ZCSTSections.parse(cst)).not.toThrow(ZodError)
  expect(cst[0].children.text?.[0].children.Text?.[0].image).to.equal("Содержимое раздела 1")
  expect(cst[1].children.sectionHeader?.[0].children.Text?.[0].image).to.equal("Раздел 2 ")
  expect(cst[2].children.text?.[0].children.Text?.[0].image).to.equal("Содержимое раздела 2")
})
