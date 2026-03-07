import fs from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { readCatalogYAML, readFormNKDK, readFormYAML } from "~/tests/fixtures/sync/importConfiguration/data"
import { mockContextToYAML } from "~/tests/mockContext"
import { syncConfigurationFromXML } from "./syncConfigurationFromXML"

describe("sync configuration from xml", () => {
  const inputDir = join(process.cwd(), "tests/fixtures/sync/importConfiguration/input")
  const outputDir = join(process.cwd(), "tests/fixtures/sync/importConfiguration/out")

  it("should produce catalog and form YAML/nkdk in output dir", async () => {
    fs.mkdirSync(outputDir, { recursive: true })

    await syncConfigurationFromXML({
      context: mockContextToYAML,
      inputDir,
      outputDir,
    })

    const catalogYamlPath = join(outputDir, "Контрагенты", "Свойства.yaml")
    const formYamlPath = join(outputDir, "Контрагенты", "Формы", "ФормаЭлемента", "Форма.yaml")
    const formNkdkPath = join(outputDir, "Контрагенты", "Формы", "ФормаЭлемента", "Форма.nkdk")

    expect(fs.existsSync(catalogYamlPath)).toBe(true)
    expect(fs.readFileSync(catalogYamlPath, "utf-8")).toBe(readCatalogYAML)

    expect(fs.existsSync(formYamlPath)).toBe(true)
    expect(fs.readFileSync(formYamlPath, "utf-8")).toBe(readFormYAML)

    expect(fs.existsSync(formNkdkPath)).toBe(true)
    expect(fs.readFileSync(formNkdkPath, "utf-8")).toBe(readFormNKDK)
  })
})
