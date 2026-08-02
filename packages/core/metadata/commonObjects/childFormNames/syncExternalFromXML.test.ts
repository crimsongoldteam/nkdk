import fs from "node:fs"
import os from "node:os"
import { dirname, join } from "node:path"
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"
import { mockContextFromXML } from "../../../tests/mockContext"
import { getXMLFixturePath } from "../../../tests/readAndParseXMLFile"
import { createXmlImportWorkerTestPool } from "../../../tests/xmlImportWorkerTestPool"
import { importConfigurationFromXml } from "../../importFromXml/importConfiguration"
import "../../appliedObjects/metadataCatalog/register"
import { syncChildFormNamesFromXML } from "./syncExternalFromXML"
import { childFormNamesRule } from "./types"

const temporaryDirectories: string[] = []
const xmlImportWorkerPoolHandle = createXmlImportWorkerTestPool()

afterAll(async () => {
  await xmlImportWorkerPoolHandle.close()
})

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => fs.promises.rm(directory, { recursive: true, force: true }))
  )
})

describe("ChildFormNames: единый импорт XML → YAML", () => {
  const sourceDir = getXMLFixturePath("sync/syncConfiguration/xml")
  const name = "Контрагенты"
  const directContext = () => ({
    ...mockContextFromXML(),
    exportToYAML: {
      toTyped: false,
      metadataTargetOwners: [
        {
          itemType: "MetadataCatalog" as const,
          name,
          owner: { root: "Catalog" as const, objectName: name },
        },
      ],
    },
  })
  const rule = childFormNamesRule({
    xml: "Form",
    folderName: "Формы",
    forReferenceOnly: true,
    toYAML: false,
    fromYAML: false,
    xmlParents: ["ChildObjects"] as string[],
  })
  let importedFormPath = ""
  let importFailures: unknown[] = []

  beforeAll(async () => {
    const inputDir = preparedInputDirectory(sourceDir)
    const projectDir = temporaryDirectory("nkdk-child-form-project-")
    importedFormPath = join(projectDir, "cf", "Справочник", name, "Формы", "ФормаЭлемента", "Форма.yaml")
    const result = await importConfigurationFromXml({
      context: mockContextFromXML(),
      inputDir,
      projectDir,
      concurrency: 1,
      xmlImportWorkerPoolHandle,
    })
    importFailures = result.failed
  })

  it("записывает Формы/<form>/Форма.yaml для каталога", () => {
    expect(importFailures).toEqual([])
    expect(fs.existsSync(importedFormPath)).toBe(true)
  })

  it("экспортирует ссылку на текущую форму в настройках формы локальным именем", async () => {
    const inputDir = preparedInputDirectory(sourceDir)
    const outputDir = temporaryDirectory("nkdk-child-form-output-")

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

    await syncChildFormNamesFromXML({
      context: directContext(),
      rule,
      xmlDir: join(inputDir, "Catalogs"),
      nkdkDir: outputDir,
      name,
    })

    const yaml = fs.readFileSync(join(outputDir, "Формы", "ФормаЭлемента", "Форма.yaml"), "utf-8")
    expect(yaml).toContain("ХранилищеНастроек: ФормаЭлемента")
  })

  it("импортирует только страницы справки формы, перечисленные в Forms/<form>/Ext/Help.xml", async () => {
    const inputDir = preparedInputDirectory(sourceDir)
    const outputDir = temporaryDirectory("nkdk-child-form-output-")

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

    await syncChildFormNamesFromXML({
      context: directContext(),
      rule,
      xmlDir: join(inputDir, "Catalogs"),
      nkdkDir: outputDir,
      name,
    })

    const formHelpDir = join(outputDir, "Формы", "ФормаЭлемента", "Справка")
    expect(fs.existsSync(join(formHelpDir, "ru.html"))).toBe(true)
    expect(fs.existsSync(join(formHelpDir, "stale.html"))).toBe(false)
  })

  it("копирует модуль формы в каталог YAML-формы", async () => {
    const inputDir = preparedInputDirectory(sourceDir)
    const outputDir = temporaryDirectory("nkdk-child-form-output-")
    const modulePath = join(inputDir, "Catalogs", name, "Forms", "ФормаЭлемента", "Ext", "Form", "Module.bsl")
    fs.mkdirSync(dirname(modulePath), { recursive: true })
    fs.writeFileSync(modulePath, "Процедура ПриОткрытии()\nКонецПроцедуры\n", "utf-8")

    await syncChildFormNamesFromXML({
      context: directContext(),
      rule,
      xmlDir: join(inputDir, "Catalogs"),
      nkdkDir: outputDir,
      name,
    })

    expect(fs.readFileSync(join(outputDir, "Формы", "ФормаЭлемента", "Модуль.bsl"), "utf-8")).toContain(
      "ПриОткрытии"
    )
  })

  it("читает Forms напрямую, когда xmlDir уже указывает на текущий объект", async () => {
    const inputDir = preparedInputDirectory(sourceDir)
    const outputDir = temporaryDirectory("nkdk-child-form-output-")

    await syncChildFormNamesFromXML({
      context: directContext(),
      rule,
      xmlDir: join(inputDir, "Catalogs", name),
      nkdkDir: outputDir,
      name: "",
    })

    expect(fs.existsSync(join(outputDir, "Формы", "ФормаЭлемента", "Форма.yaml"))).toBe(true)
  })
})

function temporaryDirectory(prefix: string): string {
  const directory = fs.mkdtempSync(join(os.tmpdir(), prefix))
  temporaryDirectories.push(directory)
  return directory
}

function preparedInputDirectory(sourceDir: string): string {
  const inputDir = temporaryDirectory("nkdk-child-form-input-")
  fs.cpSync(sourceDir, inputDir, { recursive: true })
  writeMinimalConfigurationXml(inputDir)
  return inputDir
}

function writeMinimalConfigurationXml(inputDir: string): void {
  fs.copyFileSync(
    getXMLFixturePath("configuration/minimal.xml"),
    join(inputDir, "Configuration.xml")
  )
}
