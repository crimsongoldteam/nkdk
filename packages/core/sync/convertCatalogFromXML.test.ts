import fs from "fs"
import { join } from "path"
import { describe, expect, it, vi } from "vitest"
import { readCatalogYAML } from "~/tests/fixtures/sync/readCatalog/data"
import { mockContextToYAML } from "~/tests/mockContext"
import { convertCatalogFromXML } from "./convertCatalogFromXML"

describe("convertCatalogFromXML", () => {
  const inputDir = join(process.cwd(), "tests/fixtures/sync/readCatalog/Catalogs")
  const outputDir = join(process.cwd(), "tests/fixtures/sync/out/Справочник")
  const catalogName = "Контрагенты"

  it("should read catalog from XML and export to YAML file in output dir", async () => {
    const spy = vi.spyOn(fs, "writeFileSync").mockImplementation(() => {})
    await convertCatalogFromXML({
      context: mockContextToYAML,
      inputDir: inputDir,
      name: catalogName,
      outputDir: outputDir,
    })

    expect(spy).toHaveBeenCalledWith(join(outputDir, catalogName, "Свойства.yaml"), readCatalogYAML, "utf-8")
  })
})
