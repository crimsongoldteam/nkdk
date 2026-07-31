import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { dirname, join } from "path"
import { afterEach, beforeAll, describe, expect, it } from "vitest"
import { MetadataConfigurationRules } from "../appliedObjects/configuration/rules"
import { MetadataConfigurationExtensionRules } from "../appliedObjects/configurationExtension/rules"
import { mockContext } from "../../tests/mockContext"
import { resolveValidationProjectFile } from "./projectFiles"
import { createProjectYamlCache } from "./projectYamlCache"
import { createValidationSchemaCache, validateProjectFileFirstPass } from "./projectValidationPasses"
import {
  registerProjectFileValidator,
  restoreProjectReferenceIndexRegistryForTests,
  snapshotProjectReferenceIndexRegistryForTests,
} from "./projectReferenceIndexRegistry"
import { getValidationProjectSpecByDir } from "./projectSpecs"
import { createValidationRulesSnapshot } from "./rulesSnapshot"
import {
  ClientApplicationFormRules,
  ClientApplicationFormWithExtendedPresentationRules,
} from "../forms/clientApplicationForm/rules"

describe("validateProjectFileFirstPass references", () => {
  const tempDirs: string[] = []
  let sharedSchemaCache: ReturnType<typeof createValidationSchemaCache>
  let compiledAll: ReturnType<ReturnType<typeof createValidationSchemaCache>["compileAll"]>

  beforeAll(() => {
    sharedSchemaCache = createValidationSchemaCache(mockContext)
    compiledAll = sharedSchemaCache.compileAll()

    const commonFormSpec = getValidationProjectSpecByDir("ОбщаяФорма")
    if (commonFormSpec === undefined) throw new Error("Common form validation spec is not registered")
    sharedSchemaCache.properties(commonFormSpec.rule)
  }, 120_000)

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  it("compiles all validation schemas before validating files", () => {
    expect(compiledAll.propertiesMs).toBeGreaterThanOrEqual(0)
  }, 120_000)

  it("distinguishes extension root properties from configuration properties", () => {
    const cache = createValidationSchemaCache(mockContext)
    const yaml = {
      Имя: "Продажи",
      НазначениеРасширенияКонфигурации: "Адаптация",
    }

    expect(cache.properties(MetadataConfigurationExtensionRules).Check(yaml)).toBe(true)
    expect(cache.properties(MetadataConfigurationRules).Check(yaml)).toBe(false)
  }, 20_000)

  it("caches form schemas by rule object in either access order", () => {
    const yaml = { РасширенноеПредставление: "Продажи" }
    const specializedFirst = createValidationSchemaCache(mockContext)

    expect(
      specializedFirst
        .form(ClientApplicationFormWithExtendedPresentationRules)
        .Check(yaml)
    ).toBe(true)
    expect(
      specializedFirst.form(ClientApplicationFormRules).Check(yaml)
    ).toBe(false)

    const baseFirst = createValidationSchemaCache(mockContext)
    expect(baseFirst.form(ClientApplicationFormRules).Check(yaml)).toBe(
      false
    )
    expect(
      baseFirst
        .form(ClientApplicationFormWithExtendedPresentationRules)
        .Check(yaml)
    ).toBe(true)
  }, 20_000)

  it("marks syntax failure as a file without contributed facts", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-validation-first-pass-"))
    tempDirs.push(projectDir)
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", "Реквизиты: [")
    const file = resolveValidationProjectFile(projectDir, join(projectDir, "Справочник/Товары/Свойства.yaml"))
    if (!file) throw new Error("file not resolved")

    const first = validateProjectFileFirstPass({
      projectDir,
      file,
      cache: createProjectYamlCache(),
      context: mockContext,
      schemaCache: sharedSchemaCache,
      rulesSnapshot: createValidationRulesSnapshot(mockContext),
    })

    expect(first.contributedFacts).toBe(false)
    expect(first.schemaDiagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ source: "syntax", severity: "error" })])
    )
  })

  it("keeps a read failure out of schema diagnostics and rejects the contribution", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-validation-first-pass-"))
    tempDirs.push(projectDir)
    const file = resolveValidationProjectFile(projectDir, join(projectDir, "Справочник/Товары/Свойства.yaml"))
    if (!file) throw new Error("file not resolved")

    const first = validateProjectFileFirstPass({
      projectDir,
      file,
      cache: createProjectYamlCache(),
      context: mockContext,
      schemaCache: sharedSchemaCache,
      rulesSnapshot: createValidationRulesSnapshot(mockContext),
    })

    expect(first.contributedFacts).toBe(false)
    expect(first.diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ source: "external-file", severity: "error" })])
    )
    expect(first.schemaDiagnostics).toEqual([])
  })

  it("keeps contributed facts after JSON Schema errors when extraction succeeds", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-validation-first-pass-"))
    tempDirs.push(projectDir)
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", "НесуществующееПоле: true")
    const file = resolveValidationProjectFile(projectDir, join(projectDir, "Справочник/Товары/Свойства.yaml"))
    if (!file) throw new Error("file not resolved")

    const first = validateProjectFileFirstPass({
      projectDir,
      file,
      cache: createProjectYamlCache(),
      context: mockContext,
      schemaCache: sharedSchemaCache,
      rulesSnapshot: createValidationRulesSnapshot(mockContext),
    })

    expect(first.contributedFacts).toBe(true)
    expect(first.schemaDiagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: "structure", severity: "error", path: "/НесуществующееПоле" }),
      ])
    )
  })

  it("keeps registered structural validator diagnostics out of schema diagnostics and rejects the contribution", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-validation-first-pass-"))
    tempDirs.push(projectDir)
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", "{}")
    const file = resolveValidationProjectFile(projectDir, join(projectDir, "Справочник/Товары/Свойства.yaml"))
    if (!file) throw new Error("file not resolved")
    const registry = snapshotProjectReferenceIndexRegistryForTests()
    try {
      registerProjectFileValidator(file.owner.spec.kind, ({ filePath }) => [
        {
          filePath,
          line: 1,
          col: 1,
          severity: "error",
          source: "structure",
          path: "/RegisteredFailure",
          message: "registered first-pass failure",
        },
      ])

      const first = validateProjectFileFirstPass({
        projectDir,
        file,
        cache: createProjectYamlCache(),
        context: mockContext,
        schemaCache: sharedSchemaCache,
        rulesSnapshot: createValidationRulesSnapshot(mockContext),
      })

      expect(first.contributedFacts).toBe(false)
      expect(first.diagnostics).toEqual(
        expect.arrayContaining([expect.objectContaining({ path: "/RegisteredFailure", source: "structure" })])
      )
      expect(first.schemaDiagnostics).toEqual([])
    } finally {
      restoreProjectReferenceIndexRegistryForTests(registry)
    }
  })

  it("compiles common form properties in the same validation graph", () => {
    const spec = getValidationProjectSpecByDir("ОбщаяФорма")
    if (spec === undefined) throw new Error("Common form validation spec is not registered")

    const compiled = sharedSchemaCache.properties(spec.rule)

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
      schemaCache: sharedSchemaCache,
      rulesSnapshot: createValidationRulesSnapshot(mockContext),
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

  it("проверяет уникальность имён элементов внутри общей формы", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-validation-first-pass-"))
    tempDirs.push(projectDir)
    writeProjectFile(projectDir, "ОбщаяФорма/РабочийСтол/Свойства.yaml", [
      "Форма:",
      "  Элементы:",
      "    Поле:",
      "      Вид: ПолеВвода",
      "    полерасширеннаяподсказка:",
      "      Вид: ПолеВвода",
    ])
    const file = resolveValidationProjectFile(projectDir, join(projectDir, "ОбщаяФорма/РабочийСтол/Свойства.yaml"))
    if (!file) throw new Error("file not resolved")

    const first = validateProjectFileFirstPass({
      projectDir,
      file,
      cache: createProjectYamlCache(),
      context: mockContext,
      schemaCache: sharedSchemaCache,
      rulesSnapshot: createValidationRulesSnapshot(mockContext),
    })

    expect(first.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "structure",
          path: "/Форма/Элементы/полерасширеннаяподсказка",
          message: expect.stringContaining("занято"),
        }),
      ])
    )
  }, 20_000)

  it("не смешивает одинаковые имена элементов разных общих форм", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-validation-first-pass-"))
    tempDirs.push(projectDir)
    const projectPaths = [
      "ОбщаяФорма/РабочийСтол/Свойства.yaml",
      "ОбщаяФорма/ПанельНавигации/Свойства.yaml",
    ]
    for (const projectPath of projectPaths) {
      writeProjectFile(projectDir, projectPath, [
        "Форма:",
        "  Элементы:",
        "    Поле:",
        "      Вид: ПолеВвода",
      ])
    }

    const diagnostics = projectPaths.flatMap((projectPath) => {
      const file = resolveValidationProjectFile(projectDir, join(projectDir, projectPath))
      if (!file) throw new Error("file not resolved")
      return validateProjectFileFirstPass({
        projectDir,
        file,
        cache: createProjectYamlCache(),
        context: mockContext,
        schemaCache: sharedSchemaCache,
        rulesSnapshot: createValidationRulesSnapshot(mockContext),
      }).diagnostics
    })

    expect(diagnostics.filter(({ message }) => message.includes("должно быть уникальным"))).toEqual([])
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
      schemaCache: sharedSchemaCache,
      rulesSnapshot: createValidationRulesSnapshot(mockContext),
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

  it("builds command member index entries from owner commands", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-validation-first-pass-"))
    tempDirs.push(projectDir)
    writeProjectFile(projectDir, "Справочник/Номенклатура/Свойства.yaml", [
      "Команды:",
      "  Открыть:",
      "    Синоним: Открыть",
    ])
    const file = resolveValidationProjectFile(projectDir, join(projectDir, "Справочник/Номенклатура/Свойства.yaml"))
    if (!file) throw new Error("file not resolved")

    const first = validateProjectFileFirstPass({
      projectDir,
      file,
      cache: createProjectYamlCache(),
      context: mockContext,
      schemaCache: sharedSchemaCache,
      rulesSnapshot: createValidationRulesSnapshot(mockContext),
    })

    expect(first.memberIndexEntries).toContainEqual(
      expect.objectContaining({
        canonical: "Catalog.Номенклатура.Command.Открыть",
        result: expect.objectContaining({
          ok: true,
          filePath: join(projectDir, "Справочник", "Номенклатура", "Свойства.yaml"),
          details: expect.objectContaining({ kind: "Command", name: "Открыть" }),
        }),
      })
    )
  })

  it("builds chart of accounts accounting flag member index entries from YAML", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-validation-first-pass-"))
    tempDirs.push(projectDir)
    writeProjectFile(projectDir, "ПланСчетов/Хозрасчетный/Свойства.yaml", [
      "ПризнакиУчета:",
      "  УчетПоНаправлениямДеятельности:",
      "    Тип: Булево",
      "ПризнакиУчетаСубконто:",
      "  Валютный:",
      "    Тип: Булево",
    ])
    const file = resolveValidationProjectFile(projectDir, join(projectDir, "ПланСчетов/Хозрасчетный/Свойства.yaml"))
    if (!file) throw new Error("file not resolved")

    const first = validateProjectFileFirstPass({
      projectDir,
      file,
      cache: createProjectYamlCache(),
      context: mockContext,
      schemaCache: sharedSchemaCache,
      rulesSnapshot: createValidationRulesSnapshot(mockContext),
    })

    expect(first.memberIndexEntries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          canonical: "ChartOfAccounts.Хозрасчетный.AccountingFlag.УчетПоНаправлениямДеятельности",
        }),
        expect.objectContaining({
          canonical: "ChartOfAccounts.Хозрасчетный.ExtDimensionAccountingFlag.Валютный",
        }),
      ])
    )
  })

  it("keeps common attribute content owner links from YAML", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-validation-first-pass-"))
    tempDirs.push(projectDir)
    writeProjectFile(projectDir, "ОбщийРеквизит/КлассВНА/Свойства.yaml", [
      "Тип: Справочник.КлассыВНА",
      "Состав:",
      "  - Объект: Справочники.НематериальныеАктивы",
      "    Использование: Использовать",
      "  - Объект: Справочники.Контрагенты",
      "    Использование: НеИспользовать",
    ])
    const file = resolveValidationProjectFile(projectDir, join(projectDir, "ОбщийРеквизит/КлассВНА/Свойства.yaml"))
    if (!file) throw new Error("file not resolved")

    const first = validateProjectFileFirstPass({
      projectDir,
      file,
      cache: createProjectYamlCache(),
      context: mockContext,
      schemaCache: sharedSchemaCache,
      rulesSnapshot: createValidationRulesSnapshot(mockContext),
    })

    const objectRecord = first.objectRecords[0]
    if (objectRecord === undefined) throw new Error("object record was not collected")
    if (objectRecord.ownerFacts === undefined) throw new Error("owner facts were not collected")
    expect(objectRecord.ownerFacts.commonAttributeOwnerLinks).toEqual(["Catalog.НематериальныеАктивы"])
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
      schemaCache: sharedSchemaCache,
      rulesSnapshot: createValidationRulesSnapshot(mockContext),
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
      schemaCache: sharedSchemaCache,
      rulesSnapshot: createValidationRulesSnapshot(mockContext),
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
