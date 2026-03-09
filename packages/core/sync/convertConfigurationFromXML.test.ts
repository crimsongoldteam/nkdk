import fs from "fs"
import { join } from "path"
import { beforeEach, describe, expect, it } from "vitest"
import { readCatalogYAML, readFormNKDK, readFormYAML } from "~/tests/fixtures/sync/syncConfiguration/data"
import { syncConfigurationFromXML } from "./convertConfigurationFromXML"
import { mockContextFromXML } from "~/tests/mockContext"

describe("sync configuration from xml", () => {
  const inputDir = join(process.cwd(), "tests/fixtures/sync/syncConfiguration/xml")
  const outputDir = join(process.cwd(), "tests/fixtures/sync/syncConfiguration/out")

  beforeEach(() => {
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true })
    }
  })

  it("should produce catalog and form YAML/nkdk in output dir", async () => {
    fs.mkdirSync(outputDir, { recursive: true })

    await syncConfigurationFromXML({
      context: mockContextFromXML(),
      inputDir,
      outputDir,
    })

    const catalogYamlPath = join(outputDir, "Контрагенты", "Свойства.yaml")
    const formYamlPath = join(outputDir, "Контрагенты", "Формы", "ФормаЭлемента", "Форма.yaml")
    const formNkdkPath = join(outputDir, "Контрагенты", "Формы", "ФормаЭлемента", "Форма.nkdk")

    expect(fs.readFileSync(catalogYamlPath, "utf-8")).toBe(readCatalogYAML)

    expect(fs.readFileSync(formYamlPath, "utf-8")).toBe(readFormYAML)

    expect(fs.readFileSync(formNkdkPath, "utf-8")).toBe(readFormNKDK)
  })
})
