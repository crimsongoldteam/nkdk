import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it } from "vitest"
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

  it("writes and reads flat xxh3-64 state", async () => {
    const xmlDir = tempDir()

    await writeXmlSyncState(xmlDir, {
      version: 1,
      files: {
        "Справочник/Товары/Свойства.yaml": "xxh3-64:0000000000000aaa",
        "Справочник/Товары/Модуль.bsl": "xxh3-64:0000000000000bbb",
      },
    })

    expect(readFileSync(join(xmlDir, SYNC_STATE_FILE), "utf-8")).toContain("version: 1")
    await expect(readXmlSyncState(xmlDir)).resolves.toEqual({
      version: 1,
      files: {
        "Справочник/Товары/Свойства.yaml": "xxh3-64:0000000000000aaa",
        "Справочник/Товары/Модуль.bsl": "xxh3-64:0000000000000bbb",
      },
    })
  })

  it("rejects old sha256 state", async () => {
    const xmlDir = tempDir()
    writeFileSync(
      join(xmlDir, SYNC_STATE_FILE),
      "version: 1\nfiles:\n  a.yaml: sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\n",
      "utf-8",
    )

    await expect(readXmlSyncState(xmlDir)).rejects.toThrow(`Некорректный ${SYNC_STATE_FILE}`)
  })

  it("hashes only rule-guided project files", async () => {
    const yamlDir = tempDir()
    mkdirSync(join(yamlDir, "Справочник", "Товары", "Формы", "ФормаЭлемента"), { recursive: true })
    mkdirSync(join(yamlDir, "Миграции"), { recursive: true })
    writeFileSync(join(yamlDir, "Конфигурация.yaml"), "Имя: Тест\n", "utf-8")
    writeFileSync(join(yamlDir, "МодульПриложения.bsl"), "Процедура Проверка()\nКонецПроцедуры\n", "utf-8")
    writeFileSync(join(yamlDir, "Справочник", "Товары", "Свойства.yaml"), "a\n", "utf-8")
    writeFileSync(join(yamlDir, "Справочник", "Товары", "МодульОбъекта.bsl"), "b\r\n", "utf-8")
    writeFileSync(join(yamlDir, "Справочник", "Товары", "Формы", "ФормаЭлемента", "Форма.yaml"), "Имя: ФормаЭлемента\n", "utf-8")
    mkdirSync(join(yamlDir, "Справочник", "Товары", "Справка"), { recursive: true })
    writeFileSync(join(yamlDir, "Справочник", "Товары", "Справка", "ru.html"), "<html>help</html>\n", "utf-8")
    writeFileSync(join(yamlDir, "Справочник", "Товары", "unknown.tmp"), "noise\n", "utf-8")
    writeFileSync(join(yamlDir, "Миграции", "2026-05-05-143000.yaml"), "ignored\n", "utf-8")

    const hashes = await hashProjectFiles(yamlDir, { concurrency: 2 })

    expect(Object.keys(hashes)).toEqual([
      "Конфигурация.yaml",
      "МодульПриложения.bsl",
      "Справочник/Товары/МодульОбъекта.bsl",
      "Справочник/Товары/Свойства.yaml",
      "Справочник/Товары/Справка/ru.html",
      "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml",
    ])
    expect(hashes["Справочник/Товары/Свойства.yaml"]).toMatch(/^xxh3-64:[0-9a-f]{16}$/)
  })

  it("rejects invalid hash concurrency", async () => {
    await expect(hashProjectFiles(tempDir(), { concurrency: 0 })).rejects.toThrow("concurrency")
  })

  it("detects added changed and deleted files", () => {
    expect(
      diffSyncState(
        {
          "a.yaml": "xxh3-64:0000000000000001",
          "deleted.yaml": "xxh3-64:0000000000000002",
          "same.yaml": "xxh3-64:0000000000000003",
        },
        {
          "a.yaml": "xxh3-64:0000000000000004",
          "added.yaml": "xxh3-64:0000000000000005",
          "same.yaml": "xxh3-64:0000000000000003",
        },
      ),
    ).toEqual({
      added: ["added.yaml"],
      changed: ["a.yaml"],
      deleted: ["deleted.yaml"],
    })
  })

  it("initializes state from an existing YAML directory", async () => {
    const xmlDir = tempDir()
    const yamlDir = tempDir()
    mkdirSync(join(yamlDir, "Справочник", "Товары"), { recursive: true })
    writeFileSync(join(yamlDir, "Справочник", "Товары", "Свойства.yaml"), "Наименование: Товары\n", "utf-8")

    await initializeXmlSyncState({ yamlDir, xmlDir })

    await expect(readXmlSyncState(xmlDir)).resolves.toEqual({
      version: 1,
      files: {
        "Справочник/Товары/Свойства.yaml": expect.stringMatching(/^xxh3-64:[0-9a-f]{16}$/),
      },
    })
  })

  it("passes hash concurrency during initialization", async () => {
    const xmlDir = tempDir()
    const yamlDir = tempDir()
    mkdirSync(join(yamlDir, "Справочник", "Товары"), { recursive: true })
    writeFileSync(join(yamlDir, "Справочник", "Товары", "Свойства.yaml"), "Наименование: Товары\n", "utf-8")

    await initializeXmlSyncState({ yamlDir, xmlDir, hashConcurrency: 1 })

    await expect(readXmlSyncState(xmlDir)).resolves.toEqual({
      version: 1,
      files: {
        "Справочник/Товары/Свойства.yaml": expect.stringMatching(/^xxh3-64:[0-9a-f]{16}$/),
      },
    })
  })

  it("validates hash concurrency during initialization", async () => {
    await expect(initializeXmlSyncState({ yamlDir: tempDir(), xmlDir: tempDir(), hashConcurrency: 0 })).rejects.toThrow(
      "concurrency",
    )
  })
})
