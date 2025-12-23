import { readFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { describe, expect, it } from "vitest"
import { processXmlContent } from "./xmlProcessor.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

describe("processXmlContent", () => {
  it("should process catalogIn.xml and match catalogOut.xml", () => {
    const inputPath = join(__dirname, "../test/fixtures/catalogIn.xml")
    const expectedPath = join(__dirname, "../test/fixtures/catalogOut.xml")

    const inputXml = readFileSync(inputPath, "utf-8")
    const expectedXml = readFileSync(expectedPath, "utf-8")

    const result = processXmlContent(inputXml)

    expect(result).toEqual(expectedXml)
  })
})
