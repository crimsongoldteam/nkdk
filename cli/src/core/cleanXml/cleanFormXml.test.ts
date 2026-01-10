import { readFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { describe, expect, it } from "vitest"
import { prepareFormXml } from "./cleanFormXml.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

describe("prepareFormXml", () => {
  it("should process form/before.xml and match form/after.xml", () => {
    const inputPath = join(__dirname, "../../../test/fixtures/form/before.xml")
    const expectedPath = join(__dirname, "../../../test/fixtures/form/after.xml")

    const inputXml = readFileSync(inputPath, "utf-8")
    const expectedXml = readFileSync(expectedPath, "utf-8")

    const result = prepareFormXml(inputXml)

    expect(result).toEqual(expectedXml)
  })
})
