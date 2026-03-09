import fs from "fs"
import { join } from "path"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { readCatalogYAML } from "~/tests/fixtures/sync/syncCatalog/data"
import { mockContextFromXML, mockContextToXML } from "~/tests/mockContext"
import { convertCatalogFromXML } from "./convertCatalogFromXML"
import { convertCatalogToXML } from "./syncCatalogToXML"

vi.mock("uuid", () => ({
  v4: vi.fn(() => "11111111-1111-4111-8111-111111111111"),
}))

describe("convertCatalogToXML", () => {
  const xmlInputDir = join(process.cwd(), "tests/fixtures/sync/syncCatalog/xml/Catalogs")
  const yamlOutputDir = join(process.cwd(), "tests/fixtures/sync/syncCatalog/out")
  const xmlOutputDir = join(process.cwd(), "tests/fixtures/sync/syncCatalog/toXmlOut")
  const roundtripYamlDir = join(process.cwd(), "tests/fixtures/sync/syncCatalog/roundtripOut")
  const catalogName = "Контрагенты"

  beforeEach(() => {
    for (const dir of [yamlOutputDir, xmlOutputDir, roundtripYamlDir]) {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true })
      }
    }
  })

  it("should read catalog from YAML and export to XML file in output dir", async () => {
    await convertCatalogFromXML({
      context: mockContextFromXML(),
      inputDir: xmlInputDir,
      name: catalogName,
      outputDir: yamlOutputDir,
    })

    expect(fs.readFileSync(join(yamlOutputDir, catalogName, "Свойства.yaml"), "utf-8")).toBe(readCatalogYAML)

    await convertCatalogToXML({
      context: mockContextToXML(),
      inputDir: yamlOutputDir,
      name: catalogName,
      outputDir: xmlOutputDir,
    })

    const catalogXmlPath = join(xmlOutputDir, "Catalogs", `${catalogName}.xml`)
    expect(fs.existsSync(catalogXmlPath)).toBe(true)

    await convertCatalogFromXML({
      context: mockContextFromXML(),
      inputDir: join(xmlOutputDir, "Catalogs"),
      name: catalogName,
      outputDir: roundtripYamlDir,
    })

    const roundtripYaml = fs.readFileSync(join(roundtripYamlDir, catalogName, "Свойства.yaml"), "utf-8")
    expect(roundtripYaml).toBe(readCatalogYAML)
  })
})
