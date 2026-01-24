import { readFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { describe, expect, it } from "vitest"
import { cleanForm } from "./cleanForm.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

describe("cleanForm", () => {
  it("should process form/before.xml and match form/after.xml", () => {
    const inputPath = join(__dirname, "../../../test/fixtures/form/before.xml")
    const expectedPath = join(__dirname, "../../../test/fixtures/form/after.xml")

    const inputXml = readFileSync(inputPath, "utf-8")
    const expectedXml = readFileSync(expectedPath, "utf-8")

    const result = cleanForm(inputXml)

    expect(result).toEqual(expectedXml)
  })

  it("should remove Period from Table in form/tablePeriod.xml", () => {
    const inputPath = join(__dirname, "../../../test/fixtures/form/tablePeriod.xml")
    const inputXml = readFileSync(inputPath, "utf-8")

    const result = cleanForm(inputXml)

    expect(result).not.toContain("<Period>")
    expect(result).toContain("<Table")
  })
})
