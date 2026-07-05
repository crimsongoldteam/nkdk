import fs, { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { mockContext } from "../../../tests/mockContext"
import { createValidationObjectTable } from "../projectValidationObjectTable"
import { createProjectYamlCache } from "../projectYamlCache"
import { createOwnerMetadataCache, createOwnerMetadataCacheFromValidationTable } from "./ownerCache"

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
    writeProperties(projectDir, "Справочник", "Товары", ["Реквизиты:", "  Артикул:", "    Тип: Строка"].join("\n"))
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

  it("can resolve owner metadata from validation object table without reading YAML", () => {
    const table = createValidationObjectTable({
      records: [
        {
          filePath: "/project/Справочник/Товары/Свойства.yaml",
          projectPath: "Справочник/Товары/Свойства.yaml",
          kind: "properties",
          owner: { dir: "Справочник", name: "Товары" },
          ownerRef: { kind: "Справочник", name: "Товары" },
          model: { itemType: "MetadataCatalog", name: "Товары" },
          fieldIndex: { fields: new Map(), standardAttributeAliases: new Map(), diagnostics: [] },
          importDiagnostics: [],
        },
      ],
      filePaths: [],
    })
    const cache = createOwnerMetadataCacheFromValidationTable({ projectDir: "/project", table })

    const result = cache.get({ kind: "Справочник", name: "Товары" })

    expect(result.status).toBe("ok")
    if (result.status !== "ok") return
    expect(result.owner.filePath).toBe("/project/Справочник/Товары/Свойства.yaml")
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
    ["Перечисление", "Перечисление"],
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
    ["Обработка", "Обработка"],
    ["ОбработкаОбъект", "Обработка"],
    ["ВнешнийИсточникДанных", "ВнешнийИсточникДанных"],
    ["ЖурналДокументов", "ЖурналДокументов"],
    ["Отчет", "Отчет"],
    ["ОтчетОбъект", "Отчет"],
    ["БизнесПроцесс", "БизнесПроцесс"],
    ["БизнесПроцессОбъект", "БизнесПроцесс"],
    ["Задача", "Задача"],
    ["ЗадачаОбъект", "Задача"],
    ["ОбщийРеквизит", "ОбщийРеквизит"],
    ["ОпределяемыйТип", "ОпределяемыйТип"],
    ["КритерийОтбора", "КритерийОтбора"],
    ["ХранилищеНастроек", "ХранилищеНастроек"],
    ["НумераторДокументов", "Нумератор"],
  ] satisfies Array<[kind: string, dir: string]>)("maps %s owner refs to %s directory", (kind, dir) => {
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

  it("loads filter criterion, settings storage and document numerator owners", () => {
    const projectDir = createProject()
    writeProperties(projectDir, "КритерийОтбора", "ДокументыВНАПоОснованию", "Тип: Документ.ВводСобытийВНАМСФО")
    writeProperties(projectDir, "ХранилищеНастроек", "Общие", "Синоним: Общие")
    writeProperties(projectDir, "Нумератор", "ДенежныеДокументы", "ДлинаНомера: 11")
    const cache = createOwnerMetadataCache({
      projectDir,
      yamlCache: createProjectYamlCache(),
      context: mockContext,
    })

    expect(cache.get({ kind: "КритерийОтбора", name: "ДокументыВНАПоОснованию" })).toMatchObject({
      status: "ok",
      owner: { model: { itemType: "MetadataFilterCriterion" } },
    })
    expect(cache.get({ kind: "ХранилищеНастроек", name: "Общие" })).toMatchObject({
      status: "ok",
      owner: { model: { itemType: "MetadataSettingsStorage" } },
    })
    expect(cache.get({ kind: "НумераторДокументов", name: "ДенежныеДокументы" })).toMatchObject({
      status: "ok",
      owner: { model: { itemType: "MetadataDocumentNumerator" } },
    })
  })

  it("reads defined type YAML lazily", () => {
    const projectDir = createProject()
    writeProperties(projectDir, "ОпределяемыйТип", "ДоговорКонтрагента", "Тип: Справочник.ДоговорыКонтрагентов")
    const cache = createOwnerMetadataCache({
      projectDir,
      yamlCache: createProjectYamlCache(),
      context: mockContext,
    })

    const result = cache.get({ kind: "ОпределяемыйТип", name: "ДоговорКонтрагента" })

    expect(result).toMatchObject({
      status: "ok",
      owner: {
        ref: { kind: "ОпределяемыйТип", name: "ДоговорКонтрагента" },
        model: {
          itemType: "MetadataDefinedType",
          type: { type: ["CatalogRef.ДоговорыКонтрагентов"] },
        },
      },
    })
  })

  it("reads common attribute YAML lazily", () => {
    const projectDir = createProject()
    writeProperties(
      projectDir,
      "ОбщийРеквизит",
      "КлассВНА",
      [
        "Тип: Справочник.КлассыВНА",
        "Состав:",
        "  - Объект: Справочники.НематериальныеАктивы",
        "    Использование: Использовать",
      ].join("\n")
    )
    const cache = createOwnerMetadataCache({
      projectDir,
      yamlCache: createProjectYamlCache(),
      context: mockContext,
    })

    const result = cache.get({ kind: "ОбщийРеквизит", name: "КлассВНА" })

    expect(result).toMatchObject({
      status: "ok",
      owner: {
        ref: { kind: "ОбщийРеквизит", name: "КлассВНА" },
        model: {
          itemType: "MetadataCommonAttribute",
          type: { type: ["CatalogRef.КлассыВНА"] },
          content: [{ metadata: "Catalog.НематериальныеАктивы", use: "Use" }],
        },
      },
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
    writeProperties(
      projectDir,
      "Справочник",
      "Товары",
      ["Реквизиты:", "  Неверный:", "    Тип: НесуществующийТип"].join("\n")
    )
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

  it("does not run schema validation while loading owners for DataPath checks", () => {
    const projectDir = createProject()
    writeProperties(projectDir, "Справочник", "Товары", ["Реквизиты:", "  Артикул:", "    Тип: Строка"].join("\n"))
    const cache = createOwnerMetadataCache({
      projectDir,
      yamlCache: createProjectYamlCache(),
      context: mockContext,
    })

    const result = cache.get({ kind: "Справочник", name: "Товары" })

    expect(result.status).toBe("ok")
  })

  it("returns ambiguous when owner data fields have duplicate names", () => {
    const projectDir = createProject()
    writeProperties(
      projectDir,
      "Справочник",
      "Товары",
      ["Реквизиты:", "  ОбщееИмя:", "    Тип: Строка", "ТабличныеЧасти:", "  ОбщееИмя:", "    Реквизиты: {}"].join("\n")
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
