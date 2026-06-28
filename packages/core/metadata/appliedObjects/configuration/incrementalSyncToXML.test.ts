import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { syncConfigurationIncrementallyToXML } from "./incrementalSyncToXML"
import { hashProjectFiles, readXmlSyncState, writeXmlSyncState } from "./syncState"

describe("syncConfigurationIncrementallyToXML", () => {
  const dirs: string[] = []

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
    writeFileSync(join(yamlDir, "Справочник", "Товары", "МодульОбъекта.bsl"), "Процедура Новая()\nКонецПроцедуры\n", "utf-8")
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
      "utf-8",
    )

    const result = await syncConfigurationIncrementallyToXML({
      context: baseContext(),
      inputDir: yamlDir,
      outputDir: xmlDir,
    })

    expect(result.failed).toEqual([])
    expect(readFileSync(join(xmlDir, "Catalogs", "Товары", "Ext", "ObjectModule.bsl"), "utf-8")).toBe(
      "Процедура Новая()\nКонецПроцедуры\n",
    )
    const dumpInfo = readFileSync(join(xmlDir, "ConfigDumpInfo.xml"), "utf-8")
    expect(dumpInfo).not.toContain('name="Catalog.Товары" id="owner" configVersion="old-owner"')
    expect(dumpInfo).not.toContain('name="Catalog.Товары.ObjectModule" id="owner.0" configVersion="old-module"')
    expect(dumpInfo).toContain('name="Language.Русский" id="lang" configVersion="old-lang"')
    expect(existsSync(join(xmlDir, "Catalogs", "Товары.xml"))).toBe(false)
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
