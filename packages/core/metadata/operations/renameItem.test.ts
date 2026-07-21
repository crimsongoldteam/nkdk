import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterAll, afterEach, describe, expect, it } from "vitest"
import { createPreparedYamlProjectWorkerPool } from "../project/preparedYamlProjectWorkerPool"
import { renameMetadataItem } from "./renameItem"

describe("renameMetadataItem", { timeout: 30_000 }, () => {
  const tempDirs: string[] = []
  const preparedYamlProjectPool = createPreparedYamlProjectWorkerPool({ concurrency: 1 })

  afterAll(async () => {
    await preparedYamlProjectPool.close()
  })

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  function createProject(): string {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-rename-item-"))
    tempDirs.push(dir)
    return dir
  }

  function writeProjectFile(projectDir: string, projectPath: string, lines: string | string[]): string {
    const filePath = join(projectDir, ...projectPath.split("/"))
    mkdirSync(join(filePath, ".."), { recursive: true })
    writeFileSync(filePath, Array.isArray(lines) ? lines.join("\n") : lines)
    return filePath
  }

  it("does not run full validation before checking the requested rename", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", [
      "ВводПоСтроке:",
      "  - СтандартныйРеквизит.ПометкаУдаления",
    ])

    const result = await renameMetadataItem({
      projectDir,
      path: "Справочник.Товары",
      newName: "Некорректное имя",
      preparedYamlProjectPool,
    })

    expect(result).toMatchObject({ ok: false, code: "invalid_name" })
    expect(existsSync(join(projectDir, "Миграции"))).toBe(false)
  })

  it("plans object rename with migration and descendant reference rewrite", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", [
      "ПоляБлокировкиДанных:",
      "  - Реквизит.Артикул",
      "Реквизиты:",
      "  Артикул:",
      "    Тип: Строка",
    ])

    const result = await renameMetadataItem({
      projectDir,
      path: "Справочник.Товары",
      newName: "Номенклатура",
      preparedYamlProjectPool,
    })

    expect(result).toMatchObject({
      ok: true,
      mode: "plan",
      createdMigration: { from: "Справочник.Товары", to: "Справочник.Номенклатура" },
      rewrittenReferences: [
        {
          from: "Catalog.Товары.Attribute.Артикул",
          to: "Catalog.Номенклатура.Attribute.Артикул",
        },
      ],
    })
  })

  it("applies attribute rename through model export and writes a migration file", async () => {
    const projectDir = createProject()
    const propertiesPath = writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", [
      "Реквизиты:",
      "  Артикул:",
      "    Тип: Строка",
    ])

    const result = await renameMetadataItem({
      projectDir,
      path: "Справочник.Товары.Реквизит.Артикул",
      newName: "КодПоставщика",
      allowWrite: true,
      now: new Date("2026-06-30T12:00:00.000Z"),
      preparedYamlProjectPool,
    })

    expect(result).toMatchObject({
      ok: true,
      mode: "applied",
      createdMigration: {
        from: "Справочник.Товары.Реквизит.Артикул",
        to: "Справочник.Товары.Реквизит.КодПоставщика",
        fileName: "2026-06-30-120000.yaml",
      },
    })
    const yaml = readFileSync(propertiesPath, "utf-8")
    expect(yaml).toContain("КодПоставщика:")
    expect(yaml).not.toContain("Артикул:")
    expect(readFileSync(join(projectDir, "Миграции", "2026-06-30-120000.yaml"), "utf-8")).toContain(
      '"Справочник.Товары.Реквизит.Артикул": КодПоставщика'
    )
  })

  it("renames nested tabular section attribute through operation path", async () => {
    const projectDir = createProject()
    const propertiesPath = writeProjectFile(projectDir, "Документ/Заказ/Свойства.yaml", [
      "ТабличныеЧасти:",
      "  Товары:",
      "    Реквизиты:",
      "      Количество:",
      "        Тип: Число",
    ])

    const result = await renameMetadataItem({
      projectDir,
      path: "Документ.Заказ.ТабличнаяЧасть.Товары.Реквизит.Количество",
      newName: "Цена",
      allowWrite: true,
      now: new Date("2026-07-01T08:00:00.000Z"),
      preparedYamlProjectPool,
    })

    expect(result).toMatchObject({
      ok: true,
      createdMigration: {
        from: "Документ.Заказ.ТабличнаяЧасть.Товары.Реквизит.Количество",
        to: "Документ.Заказ.ТабличнаяЧасть.Товары.Реквизит.Цена",
      },
    })
    expect(readFileSync(propertiesPath, "utf-8")).toContain("Цена:")
  })

  it("allows case-only rename and blocks case-insensitive sibling conflicts", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", [
      "Реквизиты:",
      "  Артикул:",
      "    Тип: Строка",
      "  Код:",
      "    Тип: Строка",
    ])

    const caseOnly = await renameMetadataItem({
      projectDir,
      path: "Справочник.Товары.Реквизит.Артикул",
      newName: "артикул",
      preparedYamlProjectPool,
    })
    expect(caseOnly).toMatchObject({ ok: true, mode: "plan" })

    const conflict = await renameMetadataItem({
      projectDir,
      path: "Справочник.Товары.Реквизит.Артикул",
      newName: "код",
      preparedYamlProjectPool,
    })
    expect(conflict).toMatchObject({ ok: false, code: "name_conflict" })
  })

  it("renames file item without migration and rewrites form references", async () => {
    const projectDir = createProject()
    const propertiesPath = writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", [
      "ОсновнаяФормаОбъекта: ФормаЭлемента",
    ])
    writeProjectFile(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml", ["Элементы: {}"])

    const result = await renameMetadataItem({
      projectDir,
      path: "Справочник.Товары.Форма.ФормаЭлемента",
      newName: "ФормаКарточки",
      allowWrite: true,
      preparedYamlProjectPool,
    })

    expect(result).toMatchObject({ ok: true, mode: "applied", createdMigration: undefined })
    expect(existsSync(join(projectDir, "Справочник", "Товары", "Формы", "ФормаКарточки", "Форма.yaml"))).toBe(true)
    expect(existsSync(join(projectDir, "Миграции"))).toBe(false)
    expect(readFileSync(propertiesPath, "utf-8")).toContain("ОсновнаяФормаОбъекта: ФормаКарточки")
  })

  it("rewrites form structural references when a referenced object is renamed", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "ОбщаяКартинка/Состояния/Свойства.yaml", "{}")
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", "{}")
    const formPath = writeProjectFile(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml", [
      "Реквизиты:",
      "  ИндексКартинки:",
      "    Тип: Число",
      "Элементы:",
      "  Картинка:",
      "    Вид: ПолеРисунка",
      "    КартинкаЗначений: ОбщаяКартинка.Состояния",
      "    ПутьКДанным: ИндексКартинки",
    ])

    const result = await renameMetadataItem({
      projectDir,
      path: "ОбщаяКартинка.Состояния",
      newName: "Статусы",
      allowWrite: true,
      preparedYamlProjectPool,
    })

    expect(result.ok).toBe(true)
    expect(readFileSync(formPath, "utf-8")).toContain("КартинкаЗначений: ОбщаяКартинка.Статусы")
  })

  it("rewrites resolvable form DataPath when an attribute is renamed", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", ["Реквизиты:", "  Артикул:", "    Тип: Строка"])
    const formPath = writeProjectFile(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml", [
      "Реквизиты:",
      "  Объект:",
      "    Тип: Справочник.Товары",
      "Элементы:",
      "  Артикул:",
      "    Вид: ПолеВвода",
      "    ПутьКДанным: Объект.Артикул",
    ])

    const result = await renameMetadataItem({
      projectDir,
      path: "Справочник.Товары.Реквизит.Артикул",
      newName: "Код",
      allowWrite: true,
      preparedYamlProjectPool,
    })

    expect(result.ok).toBe(true)
    expect(readFileSync(formPath, "utf-8")).toContain("ПутьКДанным: Объект.Код")
  })
})
