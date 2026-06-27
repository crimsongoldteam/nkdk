import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it } from "vitest"
import type { ConfigurationContextFromXML } from "~/metadata/context/types"
import {
  diffSyncState,
  hashProjectFiles,
  initializeXmlSyncState,
  readXmlSyncState,
  SYNC_STATE_FILE,
  writeXmlSyncState,
} from "./syncState"

describe("xml sync state", () => {
  const dirs: string[] = []

  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  function tempDir(): string {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-sync-state-"))
    dirs.push(dir)
    return dir
  }

  it("writes and reads flat sha256 state", async () => {
    const xmlDir = tempDir()

    await writeXmlSyncState(xmlDir, {
      version: 1,
      files: {
        "Справочник/Товары/Свойства.yaml": "sha256:aaa",
        "Справочник/Товары/Модуль.bsl": "sha256:bbb",
      },
    })

    expect(readFileSync(join(xmlDir, SYNC_STATE_FILE), "utf-8")).toContain("version: 1")
    await expect(readXmlSyncState(xmlDir)).resolves.toEqual({
      version: 1,
      files: {
        "Справочник/Товары/Свойства.yaml": "sha256:aaa",
        "Справочник/Товары/Модуль.bsl": "sha256:bbb",
      },
    })
  })

  it("hashes raw file bytes and ignores directories", async () => {
    const yamlDir = tempDir()
    mkdirSync(join(yamlDir, "Справочник", "Товары"), { recursive: true })
    writeFileSync(join(yamlDir, "Справочник", "Товары", "Свойства.yaml"), "a\n", "utf-8")
    writeFileSync(join(yamlDir, "Справочник", "Товары", "Модуль.bsl"), "b\r\n", "utf-8")

    const hashes = await hashProjectFiles(yamlDir)

    expect(Object.keys(hashes).sort()).toEqual([
      "Справочник/Товары/Модуль.bsl",
      "Справочник/Товары/Свойства.yaml",
    ])
    expect(hashes["Справочник/Товары/Свойства.yaml"]).toMatch(/^sha256:[0-9a-f]{64}$/)
    expect(hashes["Справочник/Товары/Модуль.bsl"]).toMatch(/^sha256:[0-9a-f]{64}$/)
  })

  it("detects added changed and deleted files", () => {
    expect(
      diffSyncState(
        {
          "a.yaml": "sha256:old",
          "deleted.yaml": "sha256:gone",
          "same.yaml": "sha256:same",
        },
        {
          "a.yaml": "sha256:new",
          "added.yaml": "sha256:add",
          "same.yaml": "sha256:same",
        },
      ),
    ).toEqual({
      added: ["added.yaml"],
      changed: ["a.yaml"],
      deleted: ["deleted.yaml"],
    })
  })

  it("initializes state from XML by importing to a temporary YAML directory", async () => {
    const xmlDir = tempDir()
    const tempRoot = tempDir()
    let importedOutputDir = ""

    await initializeXmlSyncState({
      context: {
        defaultLanguage: "ru",
        version: "2.20",
        fromXML: { forReference: false },
      } satisfies ConfigurationContextFromXML,
      xmlDir,
      createTempDir: async () => join(tempRoot, "yaml"),
      importFromXML: async ({ outputDir }) => {
        importedOutputDir = outputDir
        mkdirSync(join(outputDir, "Справочник", "Товары"), { recursive: true })
        writeFileSync(join(outputDir, "Справочник", "Товары", "Свойства.yaml"), "Наименование: Товары\n", "utf-8")
      },
    })

    expect(importedOutputDir).toBe(join(tempRoot, "yaml"))
    await expect(readXmlSyncState(xmlDir)).resolves.toEqual({
      version: 1,
      files: {
        "Справочник/Товары/Свойства.yaml": expect.stringMatching(/^sha256:[0-9a-f]{64}$/),
      },
    })
  })
})
