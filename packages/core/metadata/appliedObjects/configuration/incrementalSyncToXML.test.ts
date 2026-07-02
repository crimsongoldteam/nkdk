import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { getXMLFixturePath } from "../../../tests/readAndParseXMLFile"
import { registerCoreMetadata } from "../../register"
import { syncConfigurationIncrementallyToXML } from "./incrementalSyncToXML"
import { CONFIGURATION_XML_FILE, CONFIGURATION_YAML_FILE } from "./rootIO"
import { hashProjectFiles, readXmlSyncState, writeXmlSyncState } from "./syncState"

describe("syncConfigurationIncrementallyToXML", () => {
  const dirs: string[] = []

  beforeEach(() => {
    registerCoreMetadata()
  })

  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  function tempDir(): string {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-incremental-sync-"))
    dirs.push(dir)
    return dir
  }

  it("returns an error when state is missing", async () => {
    const result = await syncConfigurationIncrementallyToXML({
      context: baseContext(),
      inputDir: tempDir(),
      outputDir: tempDir(),
    })

    expect(result.failed[0]?.error.message).toContain(".nkdk-sync.yaml")
  })

  it("does not write XML when there are no changes", async () => {
    const yamlDir = tempDir()
    const xmlDir = tempDir()
    mkdirSync(join(yamlDir, "Справочник", "Товары"), { recursive: true })
    writeFileSync(join(yamlDir, "Справочник", "Товары", "Свойства.yaml"), "Имя: Товары\n", "utf-8")
    const current = await hashProjectFiles(yamlDir)
    await writeXmlSyncState(xmlDir, { version: 1, files: current })

    const result = await syncConfigurationIncrementallyToXML({
      context: baseContext(),
      inputDir: yamlDir,
      outputDir: xmlDir,
    })

    expect(result.failed).toEqual([])
    expect(result.succeeded).toBe(0)
    await expect(readXmlSyncState(xmlDir)).resolves.toEqual({ version: 1, files: current })
    expect(existsSync(join(xmlDir, "Catalogs"))).toBe(false)
  })

  it("writes only changed object module external file", async () => {
    const yamlDir = tempDir()
    const xmlDir = tempDir()
    mkdirSync(join(yamlDir, "Справочник", "Товары"), { recursive: true })
    writeFileSync(join(yamlDir, "Справочник", "Товары", "Свойства.yaml"), "Имя: Товары\n", "utf-8")
    writeFileSync(
      join(yamlDir, "Справочник", "Товары", "МодульОбъекта.bsl"),
      "Процедура Новая()\nКонецПроцедуры\n",
      "utf-8"
    )
    const current = await hashProjectFiles(yamlDir)
    await writeXmlSyncState(xmlDir, {
      version: 1,
      files: {
        ...current,
        "Справочник/Товары/МодульОбъекта.bsl": "xxh3-64:0000000000000000",
      },
    })
    writeFileSync(
      join(xmlDir, "ConfigDumpInfo.xml"),
      `<?xml version="1.0" encoding="UTF-8"?>
<ConfigDumpInfo xmlns="http://v8.1c.ru/8.3/xcf/dumpinfo">
  <ConfigVersions>
    <Metadata name="Catalog.Товары" id="owner" configVersion="old-owner"/>
    <Metadata name="Catalog.Товары.ObjectModule" id="owner.0" configVersion="old-module"/>
    <Metadata name="Language.Русский" id="lang" configVersion="old-lang"/>
  </ConfigVersions>
</ConfigDumpInfo>`,
      "utf-8"
    )

    const result = await syncConfigurationIncrementallyToXML({
      context: baseContext(),
      inputDir: yamlDir,
      outputDir: xmlDir,
    })

    expect(result.failed).toEqual([])
    expect(readFileSync(join(xmlDir, "Catalogs", "Товары", "Ext", "ObjectModule.bsl"), "utf-8")).toBe(
      "Процедура Новая()\nКонецПроцедуры\n"
    )
    const dumpInfo = readFileSync(join(xmlDir, "ConfigDumpInfo.xml"), "utf-8")
    expect(dumpInfo).not.toContain('name="Catalog.Товары" id="owner" configVersion="old-owner"')
    expect(dumpInfo).not.toContain('name="Catalog.Товары.ObjectModule" id="owner.0" configVersion="old-module"')
    expect(dumpInfo).toContain('name="Language.Русский" id="lang" configVersion="old-lang"')
    expect(existsSync(join(xmlDir, "Catalogs", "Товары.xml"))).toBe(false)
  })

  it("writes changed form file item and reports changed XML files", async () => {
    const yamlDir = tempDir()
    const xmlDir = tempDir()
    cpSync(getXMLFixturePath("sync/syncConfiguration/yaml"), yamlDir, { recursive: true })
    cpSync(getXMLFixturePath("sync/syncConfiguration/xml"), xmlDir, { recursive: true })
    const formYamlPath = join(yamlDir, "Справочник", "Контрагенты", "Формы", "ФормаЭлемента", "Форма.yaml")
    writeFileSync(
      formYamlPath,
      readFileSync(formYamlPath, "utf-8").replace("Синоним: Это форма контрагента", "Синоним: Измененная форма"),
      "utf-8"
    )
    const current = await hashProjectFiles(yamlDir)
    await writeXmlSyncState(xmlDir, {
      version: 1,
      files: {
        ...current,
        "Справочник/Контрагенты/Формы/ФормаЭлемента/Форма.yaml": "xxh3-64:0000000000000000",
      },
    })
    const formXmlPath = join(xmlDir, "Catalogs", "Контрагенты", "Forms", "ФормаЭлемента.xml")
    const beforeXml = readFileSync(formXmlPath, "utf-8")

    const result = await syncConfigurationIncrementallyToXML({
      context: baseContext(),
      inputDir: yamlDir,
      outputDir: xmlDir,
    })

    expect(result.failed).toEqual([])
    expect(readFileSync(formXmlPath, "utf-8")).not.toBe(beforeXml)
    expect(readFileSync(formXmlPath, "utf-8")).toContain("Измененная форма")
    expect(result.changedXmlFiles).toContainEqual({
      path: "Catalogs/Контрагенты/Forms/ФормаЭлемента.xml",
      change: "changed",
    })
    expect(existsSync(join(xmlDir, "Catalogs", "Контрагенты.xml"))).toBe(true)
  })

  it("применяет неприменённые миграции даже без разницы в YAML-состоянии", async () => {
    const yamlDir = tempDir()
    const xmlDir = tempDir()
    mkdirSync(join(yamlDir, "Справочник", "Номенклатура"), { recursive: true })
    mkdirSync(join(xmlDir, "Catalogs"), { recursive: true })
    writeFileSync(join(yamlDir, "Справочник", "Номенклатура", "Свойства.yaml"), "", "utf-8")
    writeFileSync(
      join(xmlDir, "Catalogs", "Товары.xml"),
      `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" version="2.20">
  <Catalog uuid="00000000-0000-0000-0000-000000000001">
    <Properties><Name>Товары</Name><Synonym/><Comment/></Properties>
  </Catalog>
</MetaDataObject>`,
      "utf-8"
    )
    const current = await hashProjectFiles(yamlDir)
    await writeXmlSyncState(xmlDir, { version: 1, files: current })
    mkdirSync(join(yamlDir, "Миграции"), { recursive: true })
    writeFileSync(join(yamlDir, "Миграции", "2026-05-05-143000.yaml"), '"Справочник.Товары": "Номенклатура"\n', "utf-8")

    const result = await syncConfigurationIncrementallyToXML({
      context: baseContext(),
      inputDir: yamlDir,
      outputDir: xmlDir,
    })

    expect(result.failed).toEqual([])
    expect(result.migrationsApplied).toEqual([
      { fileName: "2026-05-05-143000.yaml", from: "Справочник.Товары", to: "Справочник.Номенклатура" },
    ])
    expect(readFileSync(join(xmlDir, ".nakidka-migrations.yaml"), "utf-8")).toBe(
      ["applied:", "  - 2026-05-05-143000.yaml", ""].join("\n")
    )
    expect(existsSync(join(xmlDir, "Catalogs", "Номенклатура.xml"))).toBe(true)
    expect(existsSync(join(xmlDir, "Catalogs", "Товары.xml"))).toBe(false)
    expect(result.changedXmlFiles).toEqual(
      expect.arrayContaining([
        { path: "Catalogs/Номенклатура.xml", change: "added" },
        { path: "Catalogs/Товары.xml", change: "deleted" },
      ])
    )
  })

  it("does not rewrite root Configuration.xml for changed owner properties", async () => {
    const yamlDir = tempDir()
    const xmlDir = tempDir()
    mkdirSync(join(yamlDir, "Справочник", "Товары"), { recursive: true })
    writeFileSync(join(yamlDir, CONFIGURATION_YAML_FILE), "Имя: Конфигурация\n", "utf-8")
    writeFileSync(join(yamlDir, "Справочник", "Товары", "Свойства.yaml"), "Имя: Товары\n", "utf-8")
    const current = await hashProjectFiles(yamlDir)
    await writeXmlSyncState(xmlDir, {
      version: 1,
      files: {
        ...current,
        "Справочник/Товары/Свойства.yaml": "xxh3-64:0000000000000000",
      },
    })
    const existingConfiguration = "<Configuration>reference</Configuration>"
    writeFileSync(join(xmlDir, CONFIGURATION_XML_FILE), existingConfiguration, "utf-8")

    const result = await syncConfigurationIncrementallyToXML({
      context: baseContext(),
      inputDir: yamlDir,
      outputDir: xmlDir,
    })

    expect(result.failed).toEqual([])
    expect(readFileSync(join(xmlDir, CONFIGURATION_XML_FILE), "utf-8")).toBe(existingConfiguration)
    expect(existsSync(join(xmlDir, "Catalogs", "Товары.xml"))).toBe(true)
  })

  it("uses current XML directory as reference when rebuilding root Configuration.xml", async () => {
    const yamlDir = tempDir()
    const xmlDir = tempDir()
    mkdirSync(join(yamlDir, "Справочник", "Товары"), { recursive: true })
    writeFileSync(join(yamlDir, CONFIGURATION_YAML_FILE), "Имя: Конфигурация\n", "utf-8")
    writeFileSync(join(yamlDir, "Справочник", "Товары", "Свойства.yaml"), "Имя: Товары\n", "utf-8")
    const current = await hashProjectFiles(yamlDir)
    const previous = { ...current }
    delete previous["Справочник/Товары/Свойства.yaml"]
    await writeXmlSyncState(xmlDir, { version: 1, files: previous })
    const referenceConfiguration = readFileSync(getXMLFixturePath("configuration/full.xml"), "utf-8")
    const referenceUuid = referenceConfiguration.match(/<Configuration uuid="([^"]+)">/)?.[1]
    writeFileSync(join(xmlDir, CONFIGURATION_XML_FILE), referenceConfiguration, "utf-8")

    const result = await syncConfigurationIncrementallyToXML({
      context: baseContext(),
      inputDir: yamlDir,
      outputDir: xmlDir,
    })

    expect(result.failed).toEqual([])
    expect(readFileSync(join(xmlDir, CONFIGURATION_XML_FILE), "utf-8")).toContain(
      `<Configuration uuid="${referenceUuid}">`
    )
  })
})

function baseContext() {
  return {
    defaultLanguage: "ru" as const,
    version: "2.20" as const,
    exportToYAML: { toTyped: false as const },
    exportToXML: {
      itemsTree: [],
      configDumpInfo: new Map(),
      version: "2.20" as const,
      context: { forms: [], templates: [], parentName: "", metadataForNumbering: [] },
    },
  }
}
