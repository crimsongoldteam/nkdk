import { readFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { describe, expect, it } from "vitest"
import { cleanMetadata } from "./cleanMetadata.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

describe("cleanMetadata", () => {
  it("should process catalogIn.xml and match catalogOut.xml", () => {
    const inputPath = join(__dirname, "../../../test/fixtures/metadata/before.xml")
    const expectedPath = join(__dirname, "../../../test/fixtures/metadata/after.xml")

    const inputXml = readFileSync(inputPath, "utf-8")
    const expectedXml = readFileSync(expectedPath, "utf-8")

    const result = cleanMetadata(inputXml)

    expect(result).toEqual(expectedXml)
  })
})
