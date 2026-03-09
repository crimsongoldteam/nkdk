import fs from "fs"
import { join } from "path"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { readCatalogYAML, readFormNKDK, readFormYAML } from "~/tests/fixtures/sync/syncConfiguration/data"
import { importFormFromNKDK } from "~/tests/fromNKDK"
import { mockContextToXML, mockContextToYAML } from "~/tests/mockContext"
import { syncConfigurationFromXML } from "./convertConfigurationFromXML"
import { syncConfigurationToXML } from "./syncConfigurationToXML"

vi.mock("uuid", () => ({
  v4: vi.fn(() => "11111111-1111-4111-8111-111111111111"),
}))

describe.skip("sync configuration to xml", () => {
  const xmlInputDir = join(process.cwd(), "tests/fixtures/sync/syncConfiguration/xml")
  const yamlOutputDir = join(process.cwd(), "tests/fixtures/sync/syncConfiguration/out")
  const xmlOutputDir = join(process.cwd(), "tests/fixtures/sync/syncConfiguration/toXmlOut")
  const roundtripYamlDir = join(process.cwd(), "tests/fixtures/sync/syncConfiguration/roundtripOut")

  beforeEach(() => {
    for (const dir of [yamlOutputDir, xmlOutputDir, roundtripYamlDir]) {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true })
      }
    }
  })

  it("should produce catalog and form XML in output dir and roundtrip to same YAML/nkdk", async () => {
    fs.mkdirSync(yamlOutputDir, { recursive: true })

    await syncConfigurationFromXML({
      context: mockContextToYAML,
      inputDir: xmlInputDir,
      outputDir: yamlOutputDir,
    })

    expect(fs.readFileSync(join(yamlOutputDir, "Контрагенты", "Свойства.yaml"), "utf-8")).toBe(readCatalogYAML)
    expect(fs.readFileSync(join(yamlOutputDir, "Контрагенты", "Формы", "ФормаЭлемента", "Форма.yaml"), "utf-8")).toBe(
      readFormYAML
    )
    expect(fs.readFileSync(join(yamlOutputDir, "Контрагенты", "Формы", "ФормаЭлемента", "Форма.nkdk"), "utf-8")).toBe(
      readFormNKDK
    )

    await syncConfigurationToXML({
      context: mockContextToXML(),
      inputDir: yamlOutputDir,
      outputDir: xmlOutputDir,
      parseNkdK: importFormFromNKDK,
    })

    const catalogXmlPath = join(xmlOutputDir, "Catalogs", "Контрагенты.xml")
    const formMetadataPath = join(xmlOutputDir, "Catalogs", "Контрагенты", "Forms", "ФормаЭлемента.xml")
    const formXmlPath = join(xmlOutputDir, "Catalogs", "Контрагенты", "Forms", "ФормаЭлемента", "Ext", "Form.xml")
    expect(fs.existsSync(catalogXmlPath)).toBe(true)
    expect(fs.existsSync(formMetadataPath)).toBe(true)
    expect(fs.existsSync(formXmlPath)).toBe(true)

    await syncConfigurationFromXML({
      context: mockContextToYAML,
      inputDir: xmlOutputDir,
      outputDir: roundtripYamlDir,
    })

    const roundtripCatalogYaml = fs.readFileSync(join(roundtripYamlDir, "Контрагенты", "Свойства.yaml"), "utf-8")
    const roundtripFormYaml = fs.readFileSync(
      join(roundtripYamlDir, "Контрагенты", "Формы", "ФормаЭлемента", "Форма.yaml"),
      "utf-8"
    )
    const roundtripFormNkdk = fs.readFileSync(
      join(roundtripYamlDir, "Контрагенты", "Формы", "ФормаЭлемента", "Форма.nkdk"),
      "utf-8"
    )
    expect(roundtripCatalogYaml).toBe(readCatalogYAML)
    expect(roundtripFormYaml).toContain("Синоним: Это форма контрагента")
    expect(roundtripFormYaml).toContain("ПолеВвода1")
    expect(roundtripFormNkdk).toBe(readFormNKDK)
  })
})
