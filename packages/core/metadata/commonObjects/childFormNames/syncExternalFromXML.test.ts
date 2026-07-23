import fs from "node:fs"
import os from "node:os"
import { dirname, join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { mockContextFromXML } from "../../../tests/mockContext"
import { getXMLFixturePath } from "../../../tests/readAndParseXMLFile"
import { importConfigurationFromXml } from "../../importFromXml/importConfiguration"
import "../../appliedObjects/metadataCatalog/register"

const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => fs.promises.rm(directory, { recursive: true, force: true }))
  )
})

describe("ChildFormNames: единый импорт XML → YAML", () => {
  const sourceDir = getXMLFixturePath("sync/syncConfiguration/xml")
  const name = "Контрагенты"

  it("записывает Формы/<form>/Форма.yaml для каталога", async () => {
    const outputDir = temporaryDirectory("nkdk-child-form-output-")

    const result = await importConfigurationFromXml({
      context: mockContextFromXML(),
      inputDir: sourceDir,
      outputDir,
      concurrency: 1,
    })

    expect(result.failed).toEqual([])
    expect(fs.existsSync(join(outputDir, "Справочник", name, "Формы", "ФормаЭлемента", "Форма.yaml"))).toBe(true)
  })

  it("экспортирует ссылку на текущую форму в настройках формы локальным именем", async () => {
    const inputDir = temporaryDirectory("nkdk-child-form-input-")
    const outputDir = temporaryDirectory("nkdk-child-form-output-")
    fs.cpSync(sourceDir, inputDir, { recursive: true })

    const formPath = join(inputDir, "Catalogs", name, "Forms", "ФормаЭлемента", "Ext", "Form.xml")
    const formXml = fs.readFileSync(formPath, "utf-8")
    fs.writeFileSync(
      formPath,
      formXml.replace(
        /(<Form\b[^>]*>\s*)/,
        `$1\n\t<SettingsStorage>Catalog.${name}.Form.ФормаЭлемента</SettingsStorage>`
      ),
      "utf-8"
    )

    const result = await importConfigurationFromXml({
      context: mockContextFromXML(),
      inputDir,
      outputDir,
      concurrency: 1,
    })

    expect(result.failed).toEqual([])
    const yaml = fs.readFileSync(join(outputDir, "Справочник", name, "Формы", "ФормаЭлемента", "Форма.yaml"), "utf-8")
    expect(yaml).toContain("ХранилищеНастроек: ФормаЭлемента")
  })

  it("импортирует только страницы справки формы, перечисленные в Forms/<form>/Ext/Help.xml", async () => {
    const inputDir = temporaryDirectory("nkdk-child-form-input-")
    const outputDir = temporaryDirectory("nkdk-child-form-output-")
    fs.cpSync(sourceDir, inputDir, { recursive: true })

    const helpXmlPath = join(inputDir, "Catalogs", name, "Forms", "ФормаЭлемента", "Ext", "Help.xml")
    const helpDir = join(inputDir, "Catalogs", name, "Forms", "ФормаЭлемента", "Ext", "Help")
    fs.mkdirSync(dirname(helpXmlPath), { recursive: true })
    fs.mkdirSync(helpDir, { recursive: true })
    fs.writeFileSync(
      helpXmlPath,
      `<?xml version="1.0" encoding="UTF-8"?>\n<Help xmlns="http://v8.1c.ru/8.3/xcf/extrnprops" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">\n\t<Page>ru</Page>\n</Help>`,
      "utf-8"
    )
    fs.writeFileSync(join(helpDir, "ru.html"), "<html>current</html>", "utf-8")
    fs.writeFileSync(join(helpDir, "stale.html"), "<html>stale</html>", "utf-8")

    const result = await importConfigurationFromXml({
      context: mockContextFromXML(),
      inputDir,
      outputDir,
      concurrency: 1,
    })

    expect(result.failed).toEqual([])
    const formHelpDir = join(outputDir, "Справочник", name, "Формы", "ФормаЭлемента", "Справка")
    expect(fs.existsSync(join(formHelpDir, "ru.html"))).toBe(true)
    expect(fs.existsSync(join(formHelpDir, "stale.html"))).toBe(false)
  })
})

function temporaryDirectory(prefix: string): string {
  const directory = fs.mkdtempSync(join(os.tmpdir(), prefix))
  temporaryDirectories.push(directory)
  return directory
}
