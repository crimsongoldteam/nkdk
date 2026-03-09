import fs from "fs"
import { join } from "path"
import { beforeEach, describe, expect, it } from "vitest"
import { readCatalogYAML } from "~/tests/fixtures/sync/syncCatalog/data"
import { mockContextFromXML } from "~/tests/mockContext"
import { convertCatalogFromXML } from "./convertFromXML"

describe("convertCatalogFromXML", () => {
  const inputDir = join(process.cwd(), "tests/fixtures/sync/syncCatalog/xml/Catalogs")
  const outputDir = join(process.cwd(), "tests/fixtures/sync/syncCatalog/out")
  const catalogName = "Контрагенты"

  beforeEach(() => {
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true })
    }
  })

  it("should read catalog from XML and export to YAML file in output dir", async () => {
    await convertCatalogFromXML({
      context: mockContextFromXML(),
      inputDir: inputDir,
      name: catalogName,
      outputDir: outputDir,
    })

    expect(fs.readFileSync(join(outputDir, catalogName, "Свойства.yaml"), "utf-8")).toBe(readCatalogYAML)
  })
})
