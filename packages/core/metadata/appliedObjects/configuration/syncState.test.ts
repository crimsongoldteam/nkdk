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
import { BINARY_SYNC_STATE_FILE, decodeBinaryXmlSyncState, encodeBinaryXmlSyncState } from "./syncStateBinary"

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

  it("encodes and decodes binary sync state", () => {
    const state = {
      version: 1 as const,
      files: {
        "Справочник/Товары/Свойства.yaml": "xxh3-64:0000000000000aaa",
        "Справочник/Товары/Модуль.bsl": "xxh3-64:0000000000000bbb",
      },
    }

    const encoded = encodeBinaryXmlSyncState(state)

    expect(encoded.subarray(0, 8).toString("ascii")).toBe("NKDKSYNC")
    expect(decodeBinaryXmlSyncState(encoded)).toEqual({
      version: 1,
      files: {
        "Справочник/Товары/Модуль.bsl": "xxh3-64:0000000000000bbb",
        "Справочник/Товары/Свойства.yaml": "xxh3-64:0000000000000aaa",
      },
    })
  })

  it("rejects binary sync state with invalid magic", () => {
    const buffer = Buffer.from("NOTSTATE")

    expect(() => decodeBinaryXmlSyncState(buffer)).toThrow("Некорректный .nkdk-sync.bin")
  })

  it("rejects binary sync state with unsupported version", () => {
    const buffer = Buffer.alloc(14)
    buffer.write("NKDKSYNC", 0, "ascii")
    buffer.writeUInt16LE(2, 8)
    buffer.writeUInt32LE(0, 10)

    expect(() => decodeBinaryXmlSyncState(buffer)).toThrow("Некорректный .nkdk-sync.bin")
  })

  it("rejects truncated binary sync state entries", () => {
    const buffer = Buffer.alloc(14)
    buffer.write("NKDKSYNC", 0, "ascii")
    buffer.writeUInt16LE(1, 8)
    buffer.writeUInt32LE(1, 10)

    expect(() => decodeBinaryXmlSyncState(buffer)).toThrow("Некорректный .nkdk-sync.bin")
  })

  it("writes and reads binary xxh3-64 state", async () => {
    const xmlDir = tempDir()

    await writeXmlSyncState(xmlDir, {
      version: 1,
      files: {
        "Справочник/Товары/Свойства.yaml": "xxh3-64:0000000000000aaa",
        "Справочник/Товары/Модуль.bsl": "xxh3-64:0000000000000bbb",
      },
    })

    expect(readFileSync(join(xmlDir, BINARY_SYNC_STATE_FILE)).subarray(0, 8).toString("ascii")).toBe("NKDKSYNC")
    await expect(readXmlSyncState(xmlDir)).resolves.toEqual({
      version: 1,
      files: {
        "Справочник/Товары/Модуль.bsl": "xxh3-64:0000000000000bbb",
        "Справочник/Товары/Свойства.yaml": "xxh3-64:0000000000000aaa",
      },
    })
  })

  it("reads legacy YAML sync state when binary state is absent", async () => {
    const xmlDir = tempDir()
    writeFileSync(
      join(xmlDir, SYNC_STATE_FILE),
      [
        "version: 1",
        "files:",
        "  Справочник/Товары/Свойства.yaml: xxh3-64:0000000000000aaa",
        "  Справочник/Товары/Модуль.bsl: xxh3-64:0000000000000bbb",
        "",
      ].join("\n"),
      "utf-8"
    )

    await expect(readXmlSyncState(xmlDir)).resolves.toEqual({
      version: 1,
      files: {
        "Справочник/Товары/Модуль.bsl": "xxh3-64:0000000000000bbb",
        "Справочник/Товары/Свойства.yaml": "xxh3-64:0000000000000aaa",
      },
    })
  })

  it("prefers binary sync state over legacy YAML state", async () => {
    const xmlDir = tempDir()
    writeFileSync(join(xmlDir, SYNC_STATE_FILE), "version: 1\nfiles:\n  old.yaml: xxh3-64:0000000000000001\n", "utf-8")
    await writeXmlSyncState(xmlDir, {
      version: 1,
      files: {
        "new.yaml": "xxh3-64:0000000000000002",
      },
    })

    await expect(readXmlSyncState(xmlDir)).resolves.toEqual({
      version: 1,
      files: {
        "new.yaml": "xxh3-64:0000000000000002",
      },
    })
  })

  it("rejects old sha256 state", async () => {
    const xmlDir = tempDir()
    writeFileSync(
      join(xmlDir, SYNC_STATE_FILE),
      "version: 1\nfiles:\n  a.yaml: sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\n",
      "utf-8"
    )

    await expect(readXmlSyncState(xmlDir)).rejects.toThrow(`Некорректный ${SYNC_STATE_FILE}`)
  })

  it("hashes only rule-guided project files", async () => {
    const yamlDir = tempDir()
    mkdirSync(join(yamlDir, "Справочник", "Товары", "Формы", "ФормаЭлемента"), { recursive: true })
    mkdirSync(join(yamlDir, "Справочник", "Товары", "Формы", "ФормаЭлемента", "Справка"), { recursive: true })
    mkdirSync(join(yamlDir, "Справочник", "Товары", "Команды"), { recursive: true })
    mkdirSync(join(yamlDir, "Справочник", "Товары", "Шаблоны", "ПечатнаяФорма"), { recursive: true })
    mkdirSync(join(yamlDir, "Миграции"), { recursive: true })
    writeFileSync(join(yamlDir, "Конфигурация.yaml"), "Имя: Тест\n", "utf-8")
    writeFileSync(join(yamlDir, "МодульПриложения.bsl"), "Процедура Проверка()\nКонецПроцедуры\n", "utf-8")
    writeFileSync(
      join(yamlDir, "Справочник", "Товары", "Свойства.yaml"),
      ["Имя: Товары", "Команды:", "  Печать:", "    Синоним: Печать", ""].join("\n"),
      "utf-8"
    )
    writeFileSync(join(yamlDir, "Справочник", "Товары", "МодульОбъекта.bsl"), "b\r\n", "utf-8")
    writeFileSync(join(yamlDir, "Справочник", "Товары", "Команды", "Печать.bsl"), "c\n", "utf-8")
    writeFileSync(
      join(yamlDir, "Справочник", "Товары", "Формы", "ФормаЭлемента", "Форма.yaml"),
      "Имя: ФормаЭлемента\n",
      "utf-8"
    )
    writeFileSync(
      join(yamlDir, "Справочник", "Товары", "Формы", "ФормаЭлемента", "Справка", "ru.html"),
      "<html>form help</html>\n",
      "utf-8"
    )
    mkdirSync(join(yamlDir, "Справочник", "Товары", "Формы", "ФормаЭлемента", "ДинамическийСписок"), {
      recursive: true,
    })
    writeFileSync(
      join(yamlDir, "Справочник", "Товары", "Формы", "ФормаЭлемента", "ДинамическийСписок", "Список.query"),
      "ВЫБРАТЬ 1\n",
      "utf-8"
    )
    mkdirSync(join(yamlDir, "Справочник", "Товары", "Справка"), { recursive: true })
    writeFileSync(join(yamlDir, "Справочник", "Товары", "Справка", "ru.html"), "<html>help</html>\n", "utf-8")
    writeFileSync(
      join(yamlDir, "Справочник", "Товары", "Шаблоны", "ПечатнаяФорма", "Template.xml"),
      "<template/>\n",
      "utf-8"
    )
    writeFileSync(join(yamlDir, "Справочник", "Товары", "unknown.tmp"), "noise\n", "utf-8")
    writeFileSync(join(yamlDir, "Миграции", "2026-05-05-143000.yaml"), "ignored\n", "utf-8")

    const hashes = await hashProjectFiles(yamlDir, { concurrency: 2 })

    expect(Object.keys(hashes)).toEqual([
      "Конфигурация.yaml",
      "МодульПриложения.bsl",
      "Справочник/Товары/Команды/Печать.bsl",
      "Справочник/Товары/МодульОбъекта.bsl",
      "Справочник/Товары/Свойства.yaml",
      "Справочник/Товары/Справка/ru.html",
      "Справочник/Товары/Формы/ФормаЭлемента/ДинамическийСписок/Список.query",
      "Справочник/Товары/Формы/ФормаЭлемента/Справка/ru.html",
      "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml",
      "Справочник/Товары/Шаблоны/ПечатнаяФорма/Template.xml",
    ])
    expect(hashes["Справочник/Товары/Свойства.yaml"]).toMatch(/^xxh3-64:[0-9a-f]{16}$/)
  })

  it("rejects invalid hash concurrency", async () => {
    await expect(hashProjectFiles(tempDir(), { concurrency: 0 })).rejects.toThrow("concurrency")
  })

  it("не хэширует файлы миграций", async () => {
    const yamlDir = tempDir()
    mkdirSync(join(yamlDir, "Миграции"), { recursive: true })
    writeFileSync(join(yamlDir, "Миграции", "2026-06-30-120000.yaml"), '"Справочник.Товары": "Номенклатура"\n', "utf-8")

    expect(Object.keys(await hashProjectFiles(yamlDir))).not.toEqual(
      expect.arrayContaining(["Миграции/2026-06-30-120000.yaml"])
    )
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
        }
      )
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
      "concurrency"
    )
  })
})
