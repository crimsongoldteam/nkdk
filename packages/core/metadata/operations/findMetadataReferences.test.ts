import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { findMetadataReferences } from "./findMetadataReferences"

describe("findMetadataReferences", { timeout: 30_000 }, () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  function createProject(): string {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-delete-item-"))
    tempDirs.push(dir)
    return dir
  }

  function writeProjectFile(projectDir: string, projectPath: string, lines: string | string[]): string {
    const filePath = join(projectDir, ...projectPath.split("/"))
    mkdirSync(join(filePath, ".."), { recursive: true })
    writeFileSync(filePath, Array.isArray(lines) ? lines.join("\n") : lines)
    return filePath
  }

  it("does not run full validation before looking for references", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", [
      "ВводПоСтроке:",
      "  - СтандартныйРеквизит.ПометкаУдаления",
    ])

    const result = await findMetadataReferences({
      projectDir,
      path: "Справочник.Товары",
    })

    expect(result).toMatchObject({ ok: true, mode: "plan", blockedReferences: [] })
  })

  it("returns validation_failed when YAML preparation fails", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", ['Имя: "'])

    const result = await findMetadataReferences({
      projectDir,
      path: "Справочник.Товары",
    })

    expect(result).toMatchObject({ ok: false, code: "validation_failed" })
  })

  it("blocks external references to deleted object descendants", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", ["Реквизиты:", "  Артикул:", "    Тип: Строка"])
    writeProjectFile(projectDir, "Справочник/Заказы/Свойства.yaml", ["Владельцы:", "  - Справочник.Товары"])

    const result = await findMetadataReferences({
      projectDir,
      path: "Справочник.Товары",
    })

    expect(result).toMatchObject({
      ok: false,
      code: "references_found",
      changedFiles: [],
      rewrittenReferences: [],
      blockedReferences: [expect.objectContaining({ value: "Catalog.Товары" })],
    })
  })

  it("ignores references inside the deleted object subtree", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", [
      "ПоляБлокировкиДанных:",
      "  - Реквизит.Артикул",
      "Реквизиты:",
      "  Артикул:",
      "    Тип: Строка",
    ])

    const result = await findMetadataReferences({
      projectDir,
      path: "Справочник.Товары",
    })

    expect(result).toMatchObject({ ok: true, mode: "plan", blockedReferences: [] })
  })

  it("returns an empty plan without changing attribute files when external references are absent", async () => {
    const projectDir = createProject()
    const propertiesPath = writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", [
      "Реквизиты:",
      "  Артикул:",
      "    Тип: Строка",
      "  Код:",
      "    Тип: Строка",
    ])

    const result = await findMetadataReferences({
      projectDir,
      path: "Справочник.Товары.Реквизит.Артикул",
      allowWrite: true,
    })

    expect(result).toMatchObject({ ok: true, mode: "plan", changedFiles: [], blockedReferences: [] })
    const yaml = readFileSync(propertiesPath, "utf-8")
    expect(yaml).toContain("Артикул:")
    expect(yaml).toContain("Код:")
    expect(existsSync(join(projectDir, "Миграции"))).toBe(false)
  })

  it("returns an empty plan without deleting file item resources when external references are absent", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", ["{}"])
    writeProjectFile(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml", ["Элементы: {}"])

    const result = await findMetadataReferences({
      projectDir,
      path: "Справочник.Товары.Форма.ФормаЭлемента",
      allowWrite: true,
    })

    expect(result).toMatchObject({ ok: true, mode: "plan", changedFiles: [], blockedReferences: [] })
    expect(existsSync(join(projectDir, "Справочник", "Товары", "Формы", "ФормаЭлемента"))).toBe(true)
    expect(existsSync(join(projectDir, "Миграции"))).toBe(false)
  })

  it("blocks delete when a form contains a structural reference", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "ОбщаяКартинка/Состояния/Свойства.yaml", "{}")
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", "{}")
    writeProjectFile(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml", [
      "Реквизиты:",
      "  ИндексКартинки:",
      "    Тип: Число",
      "Элементы:",
      "  Картинка:",
      "    Вид: ПолеРисунка",
      "    КартинкаЗначений: ОбщаяКартинка.Состояния",
      "    ПутьКДанным: ИндексКартинки",
    ])

    const result = await findMetadataReferences({
      projectDir,
      path: "ОбщаяКартинка.Состояния",
    })

    expect(result).toMatchObject({
      ok: false,
      code: "references_found",
      blockedReferences: [expect.objectContaining({ value: "CommonPicture.Состояния" })],
    })
  })

  it("blocks delete when a form DataPath points to the target", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", ["Реквизиты:", "  Артикул:", "    Тип: Строка"])
    writeProjectFile(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml", [
      "Реквизиты:",
      "  Объект:",
      "    Тип: Справочник.Товары",
      "Элементы:",
      "  Артикул:",
      "    Вид: ПолеВвода",
      "    ПутьКДанным: Объект.Артикул",
    ])

    const result = await findMetadataReferences({
      projectDir,
      path: "Справочник.Товары.Реквизит.Артикул",
    })

    expect(result).toMatchObject({ ok: false, code: "references_found" })
  })
})
