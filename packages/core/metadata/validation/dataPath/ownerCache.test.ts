import fs, { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { mockContext } from "~/tests/mockContext"
import { createProjectYamlCache } from "../projectYamlCache"
import { createOwnerMetadataCache } from "./ownerCache"
import type { KnownOwnerTypeKind } from "./types"

describe("OwnerMetadataCache", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    vi.restoreAllMocks()

    for (const dir of tempDirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("reads owner YAML lazily and caches the final status", () => {
    const projectDir = createProject()
    writeProperties(projectDir, "Справочник", "Товары", ["Реквизиты:", "  Артикул: Строка"].join("\n"))
    const readFileSync = vi.spyOn(fs, "readFileSync")
    const cache = createOwnerMetadataCache({
      projectDir,
      yamlCache: createProjectYamlCache(),
      context: mockContext,
    })

    const first = cache.get({ kind: "Справочник", name: "Товары" })
    const second = cache.get({ kind: "Справочник", name: "Товары" })

    expect(first).toBe(second)
    expect(first).toMatchObject({
      status: "ok",
      owner: {
        ref: { kind: "Справочник", name: "Товары" },
        model: {
          itemType: "MetadataCatalog",
          attributes: [expect.objectContaining({ name: "Артикул" })],
        },
      },
    })
    expect(readFileSync).toHaveBeenCalledTimes(1)
  })

  it("returns not-found with cross-file diagnostic when owner file is missing", () => {
    const projectDir = createProject()
    const cache = createOwnerMetadataCache({
      projectDir,
      yamlCache: createProjectYamlCache(),
      context: mockContext,
    })

    const result = cache.get({ kind: "Справочник", name: "Товары" })

    expect(result).toMatchObject({
      status: "not-found",
      diagnostics: [
        expect.objectContaining({
          source: "cross-file",
          severity: "error",
          line: 1,
          col: 1,
        }),
      ],
    })
  })

  it.each([
    ["Справочник", "Справочник"],
    ["СправочникОбъект", "Справочник"],
    ["Документ", "Документ"],
    ["ДокументОбъект", "Документ"],
    ["РегистрСведений", "РегистрСведений"],
    ["РегистрНакопления", "РегистрНакопления"],
    ["РегистрБухгалтерии", "РегистрБухгалтерии"],
    ["РегистрРасчета", "РегистрРасчета"],
    ["ПланОбмена", "ПланОбмена"],
    ["ПланОбменаОбъект", "ПланОбмена"],
    ["ПланВидовРасчета", "ПланВидовРасчета"],
    ["ПланВидовРасчетаОбъект", "ПланВидовРасчета"],
    ["ПланВидовХарактеристик", "ПланВидовХарактеристик"],
    ["ПланВидовХарактеристикОбъект", "ПланВидовХарактеристик"],
    ["ПланСчетов", "ПланСчетов"],
    ["ПланСчетовОбъект", "ПланСчетов"],
    ["ОбработкаОбъект", "Обработка"],
    ["ОтчетОбъект", "Отчет"],
    ["БизнесПроцесс", "БизнесПроцесс"],
    ["БизнесПроцессОбъект", "БизнесПроцесс"],
    ["Задача", "Задача"],
    ["ЗадачаОбъект", "Задача"],
  ] satisfies Array<[kind: KnownOwnerTypeKind, dir: string]>)("maps %s owner refs to %s directory", (kind, dir) => {
    const projectDir = createProject()
    const cache = createOwnerMetadataCache({
      projectDir,
      yamlCache: createProjectYamlCache(),
      context: mockContext,
    })

    const result = cache.get({ kind, name: "Продажи" })

    expect(result).toMatchObject({
      status: "not-found",
      diagnostics: [
        expect.objectContaining({
          filePath: join(projectDir, dir, "Продажи", "Свойства.yaml"),
          source: "cross-file",
        }),
      ],
    })
  })

  it("returns not-found for arbitrary owner kinds that match object prototype properties", () => {
    const projectDir = createProject()
    const cache = createOwnerMetadataCache({
      projectDir,
      yamlCache: createProjectYamlCache(),
      context: mockContext,
    })

    const result = cache.get({ kind: "toString", name: "Продажи" })

    expect(result).toMatchObject({
      status: "not-found",
      diagnostics: [
        expect.objectContaining({
          filePath: join(projectDir, "toString", "Продажи", "Свойства.yaml"),
          source: "cross-file",
        }),
      ],
    })
  })

  it("returns import-error when model import throws", () => {
    const projectDir = createProject()
    writeProperties(projectDir, "Справочник", "Товары", ["Реквизиты:", "  Неверный: НесуществующийТип"].join("\n"))
    const cache = createOwnerMetadataCache({
      projectDir,
      yamlCache: createProjectYamlCache(),
      context: mockContext,
    })

    const result = cache.get({ kind: "Справочник", name: "Товары" })

    expect(result).toMatchObject({
      status: "import-error",
      diagnostics: [expect.objectContaining({ source: "cross-file", severity: "error" })],
    })
  })

  it("keeps schema diagnostics on successfully imported owners", () => {
    const projectDir = createProject()
    writeProperties(
      projectDir,
      "Справочник",
      "Товары",
      ["Реквизиты:", "  Артикул:", "    Тип: Строка", "    НеизвестныйКлюч: Истина"].join("\n"),
    )
    const cache = createOwnerMetadataCache({
      projectDir,
      yamlCache: createProjectYamlCache(),
      context: mockContext,
    })

    const result = cache.get({ kind: "Справочник", name: "Товары" })

    expect(result.status).toBe("ok")
    expect(result.status === "ok" ? result.owner.schemaDiagnostics : []).toEqual([
      expect.objectContaining({ source: "structure", severity: "error" }),
    ])
  })

  it("returns ambiguous when owner data fields have duplicate names", () => {
    const projectDir = createProject()
    writeProperties(
      projectDir,
      "Справочник",
      "Товары",
      ["Реквизиты:", "  ОбщееИмя: Строка", "ТабличныеЧасти:", "  ОбщееИмя:", "    Реквизиты: {}"].join("\n"),
    )
    const cache = createOwnerMetadataCache({
      projectDir,
      yamlCache: createProjectYamlCache(),
      context: mockContext,
    })

    const result = cache.get({ kind: "Справочник", name: "Товары" })

    expect(result).toMatchObject({
      status: "ambiguous",
      diagnostics: [
        expect.objectContaining({
          source: "structure",
          severity: "error",
          path: "/ТабличныеЧасти/ОбщееИмя",
        }),
      ],
    })
  })

  function createProject(): string {
    const projectDir = mkdtempSync(join(tmpdir(), "nakidka-owner-cache-"))
    tempDirs.push(projectDir)
    return projectDir
  }

  function writeProperties(projectDir: string, dir: string, name: string, text: string): void {
    const objectDir = join(projectDir, dir, name)
    mkdirSync(objectDir, { recursive: true })
    writeFileSync(join(objectDir, "Свойства.yaml"), `${text}\n`)
  }
})
