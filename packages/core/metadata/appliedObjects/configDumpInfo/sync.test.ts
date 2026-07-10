import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { updateConfigDumpInfoVersionsToXML } from "./sync"

describe("updateConfigDumpInfoVersionsToXML", () => {
  const dirs: string[] = []

  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  function tempDir(): string {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-dump-info-"))
    dirs.push(dir)
    return dir
  }

  it("changes only requested configVersion entries", async () => {
    const xmlDir = tempDir()
    mkdirSync(xmlDir, { recursive: true })
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

    await updateConfigDumpInfoVersionsToXML({
      context: { defaultLanguage: "ru", version: "2.20" },
      outputDir: xmlDir,
      names: ["Catalog.Товары.ObjectModule"],
      generateVersion: () => "new-version",
    })

    const result = readFileSync(join(xmlDir, "ConfigDumpInfo.xml"), "utf-8")
    expect(result).toContain('name="Catalog.Товары" id="owner" configVersion="old-owner"')
    expect(result).toContain('name="Catalog.Товары.ObjectModule" id="owner.0" configVersion="new-version"')
    expect(result).toContain('name="Language.Русский" id="lang" configVersion="old-lang"')
  })
})
