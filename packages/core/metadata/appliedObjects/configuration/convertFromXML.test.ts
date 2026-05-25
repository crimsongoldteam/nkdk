import fs from "fs"
import os from "os"
import { join } from "path"
import { beforeEach, describe, expect, it } from "vitest"
import { mockContextFromXML } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { syncConfigurationFromXML } from "./convertFromXML"
import { CONFIGURATION_XML_FILE, CONFIGURATION_YAML_FILE } from "./rootIO"

describe("sync configuration from xml", () => {
  const inputDir = join(__dirname, "../../../tests/fixtures/sync/syncConfiguration/xml")
  const outputDir = join(__dirname, "../../../tests/fixtures/sync/syncConfiguration/out")

  beforeEach(() => {
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true })
    }
  })

  it("should produce catalog and form YAML in output dir", async () => {
    fs.mkdirSync(outputDir, { recursive: true })

    await syncConfigurationFromXML({
      context: mockContextFromXML(),
      inputDir,
      outputDir,
    })

    const expectedFormYaml = readXMLFileAsString(
      join("sync/syncConfiguration/yaml/Справочник/Контрагенты/Формы/ФормаЭлемента", "Форма.yaml")
    )

    const expectedCatalogYaml = readXMLFileAsString(
      join("sync/syncConfiguration/yaml/Справочник/Контрагенты", "Свойства.yaml")
    )

    const resultFormYaml = fs.readFileSync(
      join(outputDir, "Справочник", "Контрагенты", "Формы", "ФормаЭлемента", "Форма.yaml"),
      "utf-8"
    )
    const resultCatalogYaml = fs.readFileSync(join(outputDir, "Справочник", "Контрагенты", "Свойства.yaml"), "utf-8")

    expect(resultCatalogYaml).toBe(expectedCatalogYaml)
    expect(resultFormYaml).toBe(expectedFormYaml)
  })

  it("импортирует Document, DocumentNumerator и Sequence в соответствующие YAML-папки", async () => {
    fs.mkdirSync(outputDir, { recursive: true })

    await syncConfigurationFromXML({
      context: mockContextFromXML(),
      inputDir,
      outputDir,
    })

    expect(fs.existsSync(join(outputDir, "Документ", "ДокументПоУмолчанию", "Свойства.yaml"))).toBe(true)
    expect(fs.existsSync(join(outputDir, "Нумератор", "НумераторПоУмолчанию", "Свойства.yaml"))).toBe(true)
    expect(
      fs.existsSync(join(outputDir, "Последовательность", "ПоследовательностьПоУмолчанию", "Свойства.yaml")),
    ).toBe(true)
  })

  it("не падает на дампе без некоторых корневых разделов", async () => {
    const partialInput = join(__dirname, "../../../tests/fixtures/sync/_partial_xml_tmp")
    if (fs.existsSync(partialInput)) fs.rmSync(partialInput, { recursive: true })
    fs.mkdirSync(join(partialInput, "Catalogs"), { recursive: true })
    fs.mkdirSync(outputDir, { recursive: true })

    const result = await syncConfigurationFromXML({
      context: mockContextFromXML(),
      inputDir: partialInput,
      outputDir,
    })

    expect(result.failed).toEqual([])

    fs.rmSync(partialInput, { recursive: true })
  })

  it("пишет корневой файл Конфигурация.yaml из Configuration.xml", async () => {
    const tmp = fs.mkdtempSync(join(os.tmpdir(), "nkdk-root-from-xml-"))
    const rootInput = join(tmp, "xml")
    const rootOutput = join(tmp, "yaml")
    try {
      fs.mkdirSync(rootInput, { recursive: true })
      fs.copyFileSync(
        join(__dirname, "../../../tests/fixtures/configuration/full.xml"),
        join(rootInput, CONFIGURATION_XML_FILE)
      )

      await syncConfigurationFromXML({
        context: mockContextFromXML(),
        inputDir: rootInput,
        outputDir: rootOutput,
      })

      const yaml = fs.readFileSync(join(rootOutput, CONFIGURATION_YAML_FILE), "utf-8")
      expect(yaml).toContain("Имя: Конфигурация")
      expect(yaml).not.toContain("ChildObjects")
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })
})
