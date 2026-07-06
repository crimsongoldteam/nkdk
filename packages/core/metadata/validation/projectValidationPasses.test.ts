import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { dirname, join } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { mockContext } from "../../tests/mockContext"
import { resolveValidationProjectFile } from "./projectFiles"
import { createProjectYamlCache } from "./projectYamlCache"
import { createValidationSchemaCache, validateProjectFileFirstPass } from "./projectValidationPasses"
import { getValidationProjectSpecByDir } from "./projectSpecs"

describe("validateProjectFileFirstPass references", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  it("compiles all validation schemas before validating files", () => {
    const cache = createValidationSchemaCache({ version: "2.20", defaultLanguage: "ru" })
    const result = cache.compileAll()

    expect(result.formMs).toBeGreaterThanOrEqual(0)
    expect(result.propertiesMs).toBeGreaterThanOrEqual(0)
    expect(cache.form().Check({ Элементы: {} })).toBe(true)
  }, 120_000)

  it("compiles common form properties without compiling ClientApplicationForm again", () => {
    const spec = getValidationProjectSpecByDir("ОбщаяФорма")
    if (spec === undefined) throw new Error("Common form validation spec is not registered")

    const compiled = createValidationSchemaCache(mockContext).properties(spec)

    expect(compiled.Schema()).toMatchObject({
      properties: {
        Форма: expect.objectContaining({}),
      },
    })
    expect(compiled.Context()["nkdk://schema/ClientApplicationForm"]).toBeUndefined()
    expect(compiled.Check({ Форма: { Элементы: {} } })).toBe(true)
  }, 20_000)

  it("validates common form body through the shared form schema", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-validation-first-pass-"))
    tempDirs.push(projectDir)
    writeProjectFile(projectDir, "ОбщаяФорма/РабочийСтол/Свойства.yaml", ["Форма:", "  Элементы: []"])
    const file = resolveValidationProjectFile(projectDir, join(projectDir, "ОбщаяФорма/РабочийСтол/Свойства.yaml"))
    if (!file) throw new Error("file not resolved")

    const first = validateProjectFileFirstPass({
      projectDir,
      file,
      cache: createProjectYamlCache(),
      context: mockContext,
      schemaCache: createValidationSchemaCache(mockContext),
    })

    expect(first.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "structure",
          path: "/Форма/Элементы",
        }),
      ])
    )
  }, 20_000)

  it("builds member index entries from owner fields", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-validation-first-pass-"))
    tempDirs.push(projectDir)
    writeProjectFile(projectDir, "Справочник/Номенклатура/Свойства.yaml", [
      "Реквизиты:",
      "  Артикул:",
      "    Тип: Строка",
    ])
    const file = resolveValidationProjectFile(projectDir, join(projectDir, "Справочник/Номенклатура/Свойства.yaml"))
    if (!file) throw new Error("file not resolved")

    const first = validateProjectFileFirstPass({
      projectDir,
      file,
      cache: createProjectYamlCache(),
      context: mockContext,
      schemaCache: createValidationSchemaCache(mockContext),
    })

    expect(first.objectIndexEntries).toContainEqual(
      expect.objectContaining({
        canonical: "Catalog.Номенклатура",
        result: expect.objectContaining({ ok: true }),
      })
    )
    expect(first.memberIndexEntries).toContainEqual(
      expect.objectContaining({
        canonical: "Catalog.Номенклатура.Attribute.Артикул",
        result: expect.objectContaining({
          ok: true,
          filePath: join(projectDir, "Справочник", "Номенклатура", "Свойства.yaml"),
          details: expect.objectContaining({ kind: "attribute", name: "Артикул" }),
        }),
      })
    )
  })

  it("collects pending metadata target references during first pass", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-validation-first-pass-"))
    tempDirs.push(projectDir)
    writeProjectFile(projectDir, "ФункциональнаяОпция/ИспользоватьАртикулы/Свойства.yaml", [
      "СоставФункциональнойОпции:",
      "  - Catalog.Номенклатура.Attribute.Артикул",
    ])
    const file = resolveValidationProjectFile(
      projectDir,
      join(projectDir, "ФункциональнаяОпция/ИспользоватьАртикулы/Свойства.yaml")
    )
    if (!file) throw new Error("file not resolved")

    const first = validateProjectFileFirstPass({
      projectDir,
      file,
      cache: createProjectYamlCache(),
      context: mockContext,
      schemaCache: createValidationSchemaCache(mockContext),
    })

    expect(first.pendingReferences).toEqual([
      expect.objectContaining({
        canonical: "Catalog.Номенклатура.Attribute.Артикул",
        target: expect.objectContaining({ kind: "member", objectName: "Номенклатура" }),
      }),
    ])
  })

  it("builds object index entries for nested recursive objects", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-validation-first-pass-"))
    tempDirs.push(projectDir)
    writeProjectFile(
      projectDir,
      "Подсистема/Администрирование/Подсистемы/Настройки/Свойства.yaml",
      "Синоним: Настройки"
    )
    const file = resolveValidationProjectFile(
      projectDir,
      join(projectDir, "Подсистема/Администрирование/Подсистемы/Настройки/Свойства.yaml")
    )
    if (!file) throw new Error("file not resolved")

    const first = validateProjectFileFirstPass({
      projectDir,
      file,
      cache: createProjectYamlCache(),
      context: mockContext,
      schemaCache: createValidationSchemaCache(mockContext),
    })

    expect(first.objectIndexEntries).toContainEqual(
      expect.objectContaining({
        canonical: "Subsystem.Администрирование.Subsystem.Настройки",
        result: expect.objectContaining({ ok: true }),
      })
    )
  })
})

function writeProjectFile(projectDir: string, projectPath: string, lines: string[] | string): void {
  const filePath = join(projectDir, ...projectPath.split("/"))
  mkdirSync(dirname(filePath), { recursive: true })
  const text = Array.isArray(lines) ? lines.join("\n") : lines
  writeFileSync(filePath, `${text.trimEnd()}\n`)
}
