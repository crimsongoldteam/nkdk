import { mkdirSync,mkdtempSync,rmSync,writeFileSync } from "fs"
import { tmpdir } from "os"
import { dirname,join } from "path"
import { afterEach,beforeAll,describe,expect,it,vi } from "vitest"
import "../../tests/metadataExecutionContext"
import { mockContext } from "../../tests/mockContext"
import { createPropertyStateCapabilityRegistry } from "../appliedObjects/configurationExtension/propertyStateCapabilities"
import { configurationExtensionPropertyStateCapabilities } from "../appliedObjects/configurationExtension/propertyStateRules"
import { metadataRules } from "../composition/metadataRules"
import { withOperationRegistrySet } from "../operations/operationExecutionContext"
import { assertProjectStateFileUpdateBatch,toProjectStateFileUpdate } from "../projectState/fileUpdate"
import { composeMetadataRules,defineMetadataRules } from "../ruleRuntime/definition"
import { emptyMetadataRules } from "../ruleRuntime/definition/testSupport"
import { createRuleRegistrySet } from "../ruleRuntime/ruleRegistrySet"
import { createValidationProjectComponent } from "./projectComponents"
import { resolveValidationProjectFile } from "./projectFiles"
import type { ProjectFileValidator } from "./projectReferenceIndexRegistry"
import {
createValidationSchemaCache,
validateProjectFileFirstPass,
type ValidationSchemaCache,
} from "./projectValidationPasses"
import { createProjectYamlCache } from "./projectYamlCache"
import { createValidationRulesSnapshot } from "./rulesSnapshot"
import { createTestValidationSchemaCache } from "./tests/testValidationSchemaCache"
import { createValidationRegistrySet } from "./validationRegistrySet"

describe("validateProjectFileFirstPass references", () => {
  const tempDirs: string[] = []
  let sharedSchemaCache: ValidationSchemaCache
  let appliedObjectSchemaCache: ValidationSchemaCache
  let appliedObjectRuntime: ReturnType<typeof createValidationRegistrySet>
  let rulesSnapshot: ReturnType<typeof createValidationRulesSnapshot>

  beforeAll(() => {
    sharedSchemaCache = createTestValidationSchemaCache()
    appliedObjectSchemaCache = createValidationSchemaCache(mockContext)
    appliedObjectRuntime = createValidationRegistrySet(metadataRules, createRuleRegistrySet(metadataRules))
    rulesSnapshot = createValidationRulesSnapshot(mockContext)
  }, 120_000)

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  const validateProjectPath = (projectDir: string, projectPath: string) => {
    const file = resolveValidationProjectFile(projectDir, join(projectDir, projectPath))
    if (!file) throw new Error("file not resolved")
    return validateProjectFileFirstPass({
      projectDir,
      file,
      cache: createProjectYamlCache(),
      context: mockContext,
      schemaCache: sharedSchemaCache,
      rulesSnapshot,
    })
  }

  const validateWithPropertiesSpy = (
    projectDir: string,
    file: NonNullable<ReturnType<typeof resolveValidationProjectFile>>,
  ) => {
    const properties = vi.fn(sharedSchemaCache.properties)
    validateProjectFileFirstPass({
      projectDir,
      file,
      cache: createProjectYamlCache(),
      context: mockContext,
      schemaCache: { ...sharedSchemaCache, properties },
      rulesSnapshot,
    })
    return properties
  }

  const expectPropertyStateRejected = (
    projectDir: string,
    component: ReturnType<typeof createValidationProjectComponent>,
    projectPath: string,
  ) => {
    const file = requireValidationProjectFile(component, projectPath)
    expect(() => validateProjectFileFirstPass({
      projectDir,
      file,
      cache: createProjectYamlCache(),
      context: mockContext,
      schemaCache: sharedSchemaCache,
      rulesSnapshot,
      runtime: createValidationRegistrySet(
        metadataRules,
        createRuleRegistrySet(metadataRules),
        createPropertyStateCapabilityRegistry(configurationExtensionPropertyStateCapabilities),
      ),
    })).toThrow("Режимы PropertyState допустимы только для заимствованного объекта")
  }

  const createExtensionComponent = (projectDir: string) => createValidationProjectComponent(projectDir, {
    kind: "configurationExtension",
    name: "X",
  })

  const validateAppliedObject = (
    projectPath: string,
    yaml: string,
    kind: "cf" | "cfe" = "cf",
    context = mockContext,
  ) => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-input-by-string-validation-"))
    tempDirs.push(projectDir)
    const component = kind === "cfe" ? createExtensionComponent(projectDir) : undefined
    const componentDir = component?.componentDir ?? projectDir
    writeProjectFile(componentDir, projectPath, yaml)
    const file = component === undefined
      ? resolveValidationProjectFile(projectDir, join(projectDir, projectPath))
      : requireValidationProjectFile(component, projectPath)
    if (!file) throw new Error("file not resolved")
    return validateProjectFileFirstPass({
      projectDir,
      file,
      cache: createProjectYamlCache(),
      context,
      schemaCache: appliedObjectSchemaCache,
      rulesSnapshot,
      runtime: appliedObjectRuntime,
    })
  }

  const validationErrors = (result: ReturnType<typeof validateAppliedObject>) => [
    ...result.schemaDiagnostics,
    ...result.diagnostics,
  ].filter(({ severity }) => severity === "error")

  describe("applied-object schema boundaries", () => {
    const bounds = [
      ["ПланОбмена/Тест/Свойства.yaml", "ДлинаКода", 1, 50, 0, 51],
      ["ПланОбмена/Тест/Свойства.yaml", "ДлинаНаименования", 1, 250, 0, 251],
      ["Справочник/Тест/Свойства.yaml", "ДлинаКода", 0, 50, -1, 51],
      ["Задача/Тест/Свойства.yaml", "ДлинаНаименования", 0, 150, -1, 151],
      ["ПланСчетов/Тест/Свойства.yaml", "ДлинаКода", 0, 628, -1, 629],
      ["ПланВидовРасчета/Тест/Свойства.yaml", "ДлинаКода", 0, 40, -1, 41],
      ["ПланВидовРасчета/Тест/Свойства.yaml", "ДлинаНаименования", 0, 100, -1, 101],
    ] as const
    const errorsByScenario = new Map<string, ReturnType<typeof validationErrors>>()
    const scenarioKey = (projectPath: string, field: string, value: number) => `${projectPath}:${field}:${value}`

    beforeAll(() => {
      for (const [projectPath, field, minimum, maximum, below, above] of bounds) {
        for (const value of [minimum, maximum, below, above]) {
          errorsByScenario.set(
            scenarioKey(projectPath, field, value),
            validationErrors(validateAppliedObject(projectPath, `${field}: ${value}`)),
          )
        }
      }
      errorsByScenario.set("conditional-valid", validationErrors(validateAppliedObject(
        "Документ/Тест/Свойства.yaml",
        "ТипНомера: Число\nДлинаНомера: 38",
      )))
      errorsByScenario.set("conditional-invalid", validationErrors(validateAppliedObject(
        "Документ/Тест/Свойства.yaml",
        "ТипНомера: Число\nДлинаНомера: 39",
      )))
      errorsByScenario.set("conditional-string", validationErrors(validateAppliedObject(
        "Документ/Тест/Свойства.yaml",
        "ДлинаНомера: 50",
      )))
      errorsByScenario.set("computed-fields", validationErrors(validateAppliedObject(
        "Задача/Тест/Свойства.yaml",
        "ВводПоСтроке:\n  - СтандартныйРеквизит.Наименование\n  - СтандартныйРеквизит.Номер",
      )))
      errorsByScenario.set("zero-length-input", validationErrors(validateAppliedObject(
        "Задача/Тест/Свойства.yaml",
        "ДлинаНомера: 0\nВводПоСтроке:\n  - СтандартныйРеквизит.Номер",
      )))
      errorsByScenario.set("zero-length-valid", validationErrors(validateAppliedObject(
        "Задача/Тест/Свойства.yaml",
        "ДлинаНомера: 0",
      )))
    })

    const scenarioErrors = (key: string) => {
      const errors = errorsByScenario.get(key)
      if (errors === undefined) throw new Error(`Не подготовлен validation-сценарий: ${key}`)
      return errors
    }

    it.each(bounds)(
      "validates real schema bounds for %s.%s",
      (projectPath, field, minimum, maximum, below, above) => {
        expect(scenarioErrors(scenarioKey(projectPath, field, minimum))).toEqual([])
        expect(scenarioErrors(scenarioKey(projectPath, field, maximum))).toEqual([])
        expect(scenarioErrors(scenarioKey(projectPath, field, below)))
          .toContainEqual(expect.objectContaining({ path: `/${field}` }))
        expect(scenarioErrors(scenarioKey(projectPath, field, above)))
          .toContainEqual(expect.objectContaining({ path: `/${field}` }))
      }
    )

    it("validates conditional number length and string maximum through the project pass", () => {
      expect(scenarioErrors("conditional-valid")).toEqual([])
      expect(scenarioErrors("conditional-invalid"))
        .toContainEqual(expect.objectContaining({ path: "/ДлинаНомера" }))
      expect(scenarioErrors("conditional-string")).toEqual([])
    })

    it("validates computed and zero-length input fields through the project pass", () => {
      expect(scenarioErrors("computed-fields"))
        .toContainEqual(expect.objectContaining({ path: "/ВводПоСтроке" }))
      expect(scenarioErrors("zero-length-input"))
        .toContainEqual(expect.objectContaining({ path: "/ВводПоСтроке/0" }))
      expect(scenarioErrors("zero-length-valid")).toEqual([])
    })
  })

  it("applies the same input field contributions to cfe", () => {
    expect(validationErrors(validateAppliedObject(
      "Задача/Тест/Свойства.yaml",
      "ДлинаНомера: 0\nВводПоСтроке:\n  - СтандартныйРеквизит.Номер",
      "cfe",
    ))).toContainEqual(expect.objectContaining({ path: "/ВводПоСтроке/0" }))
  })

  function formFirstPassUpdate(lines: string[]) {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-validation-first-pass-"))
    tempDirs.push(projectDir)
    const projectPath = "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml"
    writeProjectFile(projectDir, projectPath, lines)
    return toProjectStateFileUpdate(validateProjectPath(projectDir, projectPath), {
      projectPath,
      componentPath: "cf",
      resourceKind: "yaml",
      yamlRole: "form",
    })
  }

  it("проверяет локализованный заголовок yamlInline дополнительной колонки", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-validation-first-pass-"))
    tempDirs.push(projectDir)
    const projectPath = "Отчет/Тест/Формы/ФормаОтчета/Форма.yaml"
    writeProjectFile(projectDir, projectPath, [
      "Реквизиты:",
      "  Отчет:",
      "    Тип: Строка",
      "    ДополнительныеКолонки:",
      "      Отчет.Таблица:",
      "        ПредставлениеПараметра:",
      "          Заголовок:",
      "            ru: Параметр",
      "            !xml/invalid tr: Parametre",
      "          Тип: Строка",
      "        СыраяКолонка: !xml/raw",
      "          $значение:",
      "            Заголовок:",
      "              tr: Raw",
      "            Тип: Строка",
      "          $xml:",
      "            Custom: x",
    ])

    const result = validateProjectPath(projectDir, projectPath)

    expect(result.diagnostics).toEqual([])
    expect(result.issues).toEqual([])
  })

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
      rulesSnapshot,
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
      rulesSnapshot,
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
      rulesSnapshot,
    })

    expect(first.contributedFacts).toBe(true)
    expect(first.schemaDiagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: "structure", severity: "error", path: "/НесуществующееПоле" }),
      ])
    )
  })

  it("откладывает required адресуемого объекта cfe и сохраняет проверку в ProjectState", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-validation-first-pass-"))
    tempDirs.push(projectDir)
    const component = createExtensionComponent(projectDir)
    const projectPath = "ВнешнийИсточникДанных/Источник/Кубы/Куб/Свойства.yaml"
    writeProjectFile(component.componentDir, "Конфигурация.yaml",
      "РежимСовместимостиРасширенияКонфигурации: Версия8_3_7")
    writeProjectFile(component.componentDir, projectPath, "Комментарий: тест")
    writeProjectFile(join(projectDir, "cf"), projectPath, "ИмяВИсточникеДанных: Куб")
    const file = requireValidationProjectFile(component, projectPath)
    const properties = vi.fn(sharedSchemaCache.properties)

    const first = validateProjectFileFirstPass({
      projectDir,
      file,
      cache: createProjectYamlCache(),
      context: mockContext,
      schemaCache: { ...sharedSchemaCache, properties },
      rulesSnapshot,
    })
    const update = toProjectStateFileUpdate(first, {
      projectPath: file.rootProjectPath,
      componentPath: component.componentPath,
      resourceKind: "yaml",
      yamlRole: "properties",
    })

    expect(properties).toHaveBeenCalledWith(file.itemRule, "extension-overlay", "Версия8_3_7")
    expect(first.diagnostics).not.toContainEqual(expect.objectContaining({
      path: "/ИмяВИсточникеДанных",
      message: expect.stringContaining("обязательное"),
    }))
    expect(update.pendingChecks).toContainEqual(expect.objectContaining({
      kind: "addressableRequired",
      canonicalTarget: "ExternalDataSource.Источник.Cube.Куб",
      missing: ["ИмяВИсточникеДанных"],
    }))
  })

  it("применяет схему PropertyState на вложенной границе заимствованного реквизита", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-validation-first-pass-"))
    tempDirs.push(projectDir)
    const component = createExtensionComponent(projectDir)
    const projectPath = "Справочник/Товары/Свойства.yaml"
    writeProjectFile(component.componentDir, projectPath, [
      "Реквизиты:",
      "  Артикул:",
      "    Тип: Строка",
    ])
    writeProjectFile(join(projectDir, "cf"), projectPath, [
      "Реквизиты:",
      "  Артикул:",
      "    Тип: Строка",
    ])

    const schemaCache = createValidationSchemaCache(mockContext)
    const result = validateProjectFileFirstPass({
      projectDir,
      file: resolveValidationProjectFile(component.componentDir, projectPath, component)!,
      cache: createProjectYamlCache(),
      context: mockContext,
      schemaCache,
      rulesSnapshot,
    })

    expect(result.schemaDiagnostics).toEqual([])
  })

  it("разрешает явно присутствующее пустое свойство с неявным значением у заимствованного объекта", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-validation-first-pass-"))
    tempDirs.push(projectDir)
    const component = createExtensionComponent(projectDir)
    const projectPath = "Справочник/Товары/Свойства.yaml"
    writeProjectFile(component.componentDir, projectPath, "ОсновнаяФормаСписка: \"\"")
    writeProjectFile(join(projectDir, "cf"), projectPath, "Комментарий: исходный")

    const propertyStates = createPropertyStateCapabilityRegistry(configurationExtensionPropertyStateCapabilities)
    const runtime = createValidationRegistrySet(metadataRules, createRuleRegistrySet(metadataRules), propertyStates)
    const result = withOperationRegistrySet({ propertyStates }, () => validateProjectFileFirstPass({
      projectDir,
      file: requireValidationProjectFile(component, projectPath),
      cache: createProjectYamlCache(),
      context: mockContext,
      schemaCache: createValidationSchemaCache(mockContext),
      rulesSnapshot,
      runtime,
    }))

    expect(result.schemaDiagnostics).toEqual([])
  })

  it("сохраняет содержимое заимствованной формы cfe и добавляет схему PropertyState", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-validation-first-pass-"))
    tempDirs.push(projectDir)
    const component = createValidationProjectComponent(projectDir, {
      kind: "configurationExtension",
      name: "X",
    })
    const projectPath = "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml"
    writeProjectFile(component.componentDir, projectPath, "Заголовок: Товары\nИзменять:\n  - Форма")
    writeProjectFile(join(projectDir, "cf"), projectPath, "Заголовок: Товары")
    const file = requireValidationProjectFile(component, projectPath)
    const form = vi.fn(sharedSchemaCache.form)

    const result = validateProjectFileFirstPass({
      projectDir,
      file,
      cache: createProjectYamlCache(),
      context: mockContext,
      schemaCache: { ...sharedSchemaCache, form },
      rulesSnapshot,
    })

    expect(form).toHaveBeenCalledWith(file.itemRule, "extension-form-overlay")
    expect(result.schemaDiagnostics).toEqual([])
  })

  it("использует полную схему для собственного объекта cfe без одноимённого cf", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-validation-first-pass-"))
    tempDirs.push(projectDir)
    const component = createExtensionComponent(projectDir)
    const projectPath = "Справочник/Собственный/Свойства.yaml"
    writeProjectFile(component.componentDir, projectPath, "Комментарий: собственный")
    const file = requireValidationProjectFile(component, projectPath)
    const properties = validateWithPropertiesSpy(projectDir, file)

    expect(properties).toHaveBeenCalledWith(file.itemRule, "full")
  })

  it("отклоняет PropertyState у собственного объекта cfe", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-validation-first-pass-"))
    tempDirs.push(projectDir)
    const component = createExtensionComponent(projectDir)
    const projectPath = "Справочник/Собственный/Свойства.yaml"
    writeProjectFile(component.componentDir, projectPath, "Синоним: !изменять Собственный")
    expectPropertyStateRejected(projectDir, component, projectPath)
  })

  it("отклоняет PropertyState у собственного дочернего объекта заимствованного владельца cfe", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-validation-first-pass-"))
    tempDirs.push(projectDir)
    const component = createExtensionComponent(projectDir)
    const projectPath = "Справочник/Товары/Свойства.yaml"
    writeProjectFile(join(projectDir, "cf"), projectPath, "Комментарий: исходный")
    writeProjectFile(component.componentDir, projectPath, [
      "Реквизиты:",
      "  Собственный:",
      "    Синоним: !изменять Собственный",
      "    Тип: Строка",
    ])
    expectPropertyStateRejected(projectDir, component, projectPath)
  })

  it.each([
    ["пустое поле", "ОбъектРасширяемойКонфигурации:", true],
    ["Notify без UUID", "ОбъектРасширяемойКонфигурации: !проверять \"\"", true],
    ["старое Ложь", "ОбъектРасширяемойКонфигурации: Ложь", false],
    ["JS boolean", "ОбъектРасширяемойКонфигурации: false", false],
  ] as const)("проверяет форму служебного флажка: %s", (_case, field, valid) => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-validation-first-pass-"))
    tempDirs.push(projectDir)
    const component = createValidationProjectComponent(projectDir, {
      kind: "configurationExtension",
      name: "X",
    })
    writeProjectFile(join(projectDir, "cf"), "Конфигурация.yaml", "Имя: Основная")
    writeProjectFile(component.componentDir, "Конфигурация.yaml", [
      "Имя: X",
      "НазначениеРасширенияКонфигурации: Адаптация",
      "РежимСовместимости: !проверять",
      field,
    ])
    const file = requireValidationProjectFile(component, "Конфигурация.yaml")
    const properties = vi.fn(appliedObjectSchemaCache.properties)
    const propertyStates = createPropertyStateCapabilityRegistry(configurationExtensionPropertyStateCapabilities)
    const runtime = createValidationRegistrySet(metadataRules, createRuleRegistrySet(metadataRules), propertyStates)
    const result = withOperationRegistrySet({ propertyStates }, () => validateProjectFileFirstPass({
        projectDir,
        file,
        cache: createProjectYamlCache(),
        context: mockContext,
        schemaCache: { ...appliedObjectSchemaCache, properties },
        rulesSnapshot,
        runtime,
      }))

    expect(properties).toHaveBeenCalledWith(file.itemRule, "extension-root")
    if (valid) {
      expect(result.schemaDiagnostics).toEqual([])
    } else {
      expect(result.schemaDiagnostics).toContainEqual(expect.objectContaining({
        path: "/ОбъектРасширяемойКонфигурации",
      }))
    }
  })

  it.each([
    [
      "ПланСчетов/Тест/Свойства.yaml",
      [
        "Предопределенные:",
        "  Элемент:",
        '    Порядок: "1"',
        "    ПризнакиУчета: {}",
      ],
      ["Порядок", "ПризнакиУчета"],
    ],
    [
      "ПланВидовРасчета/Тест/Свойства.yaml",
      [
        "Предопределенные:",
        "  Элемент:",
        "    ПериодДействияБазовый: Истина",
        "    Базовые: []",
        "    Ведущие: []",
        "    Вытесняющие: []",
      ],
      ["ПериодДействияБазовый", "Базовые", "Ведущие", "Вытесняющие"],
    ],
  ])("accepts specialized Predefined fields in %s", (projectPath, yaml, fields) => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-validation-first-pass-"))
    tempDirs.push(projectDir)
    writeProjectFile(projectDir, projectPath, yaml)

    const paths = validateProjectPath(projectDir, projectPath).schemaDiagnostics.map(({ path }) => path)

    for (const field of fields) {
      expect(paths).not.toContain(`/Предопределенные/Элемент/${field}`)
    }
  })

  it("keeps registered structural validator diagnostics out of schema diagnostics and rejects the contribution", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-validation-first-pass-"))
    tempDirs.push(projectDir)
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", "{}")
    const file = resolveValidationProjectFile(projectDir, join(projectDir, "Справочник/Товары/Свойства.yaml"))
    if (!file) throw new Error("file not resolved")
    const runtime = validationRuntimeWithFileValidator(file.owner.spec.kind, ({ filePath }) => [
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
        rulesSnapshot,
        runtime,
      })

      expect(first.contributedFacts).toBe(false)
      expect(first.diagnostics).toEqual(
        expect.arrayContaining([expect.objectContaining({ path: "/RegisteredFailure", source: "structure" })])
      )
      expect(first.schemaDiagnostics).toEqual([])
  })

  it("помечает локально подтверждённую XML-границу как accepted", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-validation-first-pass-"))
    tempDirs.push(projectDir)
    writeProjectFile(
      projectDir,
      "ГруппаКоманд/ПечатьДокумента.yaml",
      "Картинка: !xml/invalid ОбщаяКартинка.Печать",
    )
    const file = resolveValidationProjectFile(
      projectDir,
      join(projectDir, "ГруппаКоманд/ПечатьДокумента.yaml"),
    )
    if (!file) throw new Error("file not resolved")
    const runtime = validationRuntimeWithFileValidator(file.owner.spec.kind, ({ filePath }) => [{
      filePath,
      line: 1,
      col: 11,
      severity: "error",
      source: "structure",
      path: "/Картинка",
      message: "проверочная смысловая ошибка",
    }])

    const first = validateProjectFileFirstPass({
      projectDir,
      file,
      cache: createProjectYamlCache(),
      context: mockContext,
      schemaCache: sharedSchemaCache,
      rulesSnapshot,
      runtime,
    })

    expect(first.pendingReferences).toContainEqual(expect.objectContaining({
      yamlPath: ["Картинка"],
      xmlAnomaly: "accepted",
    }))
  })

  it("не сохраняет подавленную ошибку элемента последовательности в schema diagnostics", () => {
    const first = validateAppliedObject(
      "Подсистема/Тест/Свойства.yaml",
      [
        "Состав:",
        "  - !xml/invalid a0f8c954-9877-4b52-9172-02b76aebb903",
      ].join("\n"),
    )

    expect(first.diagnostics).toEqual([])
    expect(first.schemaDiagnostics).toEqual([])
  })

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
      rulesSnapshot,
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

  it("keeps a form index contribution without pending DataPath checks", () => {
    const update = formFirstPassUpdate([
      "Реквизиты:",
      "  ПроизвольныйРеквизит: {}",
      "  Таблица:",
      "    Тип: ТаблицаЗначений",
      "    Колонки:",
      "      Значение: {}",
      "Элементы: {}",
    ])

    expect(update.pendingChecks).toEqual([])
    expect(update.forms).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: "root",
        owner: { kind: "Справочник", name: "Товары" },
        name: "ПроизвольныйРеквизит",
        source: expect.objectContaining({ typeInfo: expect.objectContaining({ kinds: ["any"] }) }),
      }),
      expect.objectContaining({
        kind: "additionalColumn",
        owner: { kind: "Справочник", name: "Товары" },
        tablePath: "Таблица",
        name: "Значение",
        source: expect.objectContaining({ typeInfo: expect.objectContaining({ kinds: ["any"] }) }),
      }),
    ]))
  })

  it("сохраняет путь к данным табличного элемента в состоянии проекта", () => {
    const update = formFirstPassUpdate([
      "Реквизиты:",
      "  Объект:",
      "    Тип: СправочникОбъект.Товары",
      "Элементы:",
      "  ТаблицаТоваров:",
      "    Вид: ТаблицаФормы",
      "    ПутьКДанным: Объект.Товары",
    ])

    expect(update.forms).toContainEqual({
      kind: "tabularElement",
      owner: { kind: "Справочник", name: "Товары" },
      name: "ТаблицаТоваров",
      dataPath: "Объект.Товары",
    })
  })

  it("передаёт structural reference формы через строгий ProjectState DTO без callbacks", () => {
    const update = formFirstPassUpdate([
      "Элементы:",
      "  Картинка:",
      "    Вид: ПолеРисунка",
      "    КартинкаЗначений: ОбщаяКартинка.Состояния",
    ])

    expect(update.pendingReferences).toHaveLength(1)
    expect(Object.keys(update.pendingReferences[0]!).sort()).toEqual([
      "canonical",
      "constraint",
      "target",
      "yamlPath",
    ])
    expect(() => structuredClone(update)).not.toThrow()
    expect(() => assertProjectStateFileUpdateBatch({
      updates: [update],
      hashBytes: new Uint8Array(8),
    })).not.toThrow()
  })

  it("передаёт ссылки функциональных опций и ролей формы в состояние проекта", () => {
    const update = formFirstPassUpdate([
      "Реквизиты:",
      "  Поле:",
      "    Тип: Строка",
      "    ФункциональныеОпции:",
      "      - ДоступностьСкладов",
      "    Просмотр:",
      "      Роли:",
      "        Администратор: Ложь",
    ])

    expect(update.pendingReferences).toEqual(expect.arrayContaining([
      expect.objectContaining({ canonical: "FunctionalOption.ДоступностьСкладов" }),
      expect.objectContaining({ canonical: "Role.Администратор" }),
    ]))
  })

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
      rulesSnapshot,
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
      return validateProjectPath(projectDir, projectPath).diagnostics
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
      rulesSnapshot,
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
      rulesSnapshot,
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

  it("builds nested external data source member targets from the exact file owner", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-validation-first-pass-"))
    tempDirs.push(projectDir)
    const files = [
      {
        projectPath: "ВнешнийИсточникДанных/Источник/Таблицы/Таблица/Свойства.yaml",
        yaml: [
          "ИмяВИсточникеДанных: Table",
          "Поля:",
          "  Поле:",
          "    Тип: Строка",
          "Команды:",
          "  Команда: {}",
        ],
      },
      {
        projectPath: "ВнешнийИсточникДанных/Источник/Кубы/Куб/Свойства.yaml",
        yaml: [
          "ИмяВИсточникеДанных: Cube",
          "Измерения:",
          "  Измерение:",
          "    Тип: Строка",
          "Ресурсы:",
          "  Ресурс:",
          "    Тип: Число",
        ],
      },
      {
        projectPath:
          "ВнешнийИсточникДанных/Источник/Кубы/Куб/ТаблицыИзмерений/ТаблицаИзмерений/Свойства.yaml",
        yaml: [
          "ИмяВИсточникеДанных: DimensionTable",
          "Поля:",
          "  Поле:",
          "    Тип: Строка",
        ],
      },
    ]

    const entries = files.flatMap(({ projectPath, yaml }) => {
      writeProjectFile(projectDir, projectPath, yaml)
      return validateProjectPath(projectDir, projectPath).memberIndexEntries
    })

    expect(entries).toEqual(expect.arrayContaining([
      expect.objectContaining({ canonical: "ExternalDataSource.Источник.Table.Таблица.Field.Поле" }),
      expect.objectContaining({ canonical: "ExternalDataSource.Источник.Table.Таблица.Command.Команда" }),
      expect.objectContaining({ canonical: "ExternalDataSource.Источник.Cube.Куб.Dimension.Измерение" }),
      expect.objectContaining({ canonical: "ExternalDataSource.Источник.Cube.Куб.Resource.Ресурс" }),
      expect.objectContaining({
        canonical: "ExternalDataSource.Источник.Cube.Куб.DimensionTable.ТаблицаИзмерений.Field.Поле",
      }),
    ]))
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
      rulesSnapshot,
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
    writeProjectFile(projectDir, "ОбщийРеквизит/КлассВНА.yaml", [
      "Тип: Справочник.КлассыВНА",
      "Состав:",
      "  - Объект: Справочники.НематериальныеАктивы",
      "    Использование: Использовать",
      "  - Объект: Справочники.Контрагенты",
      "    Использование: НеИспользовать",
    ])
    const file = resolveValidationProjectFile(projectDir, join(projectDir, "ОбщийРеквизит/КлассВНА.yaml"))
    if (!file) throw new Error("file not resolved")

    const first = validateProjectFileFirstPass({
      projectDir,
      file,
      cache: createProjectYamlCache(),
      context: mockContext,
      schemaCache: sharedSchemaCache,
      rulesSnapshot,
    })

    const objectRecord = first.objectRecords[0]
    if (objectRecord === undefined) throw new Error("object record was not collected")
    if (objectRecord.ownerFacts === undefined) throw new Error("owner facts were not collected")
    expect(objectRecord.ownerFacts.commonAttributeOwnerLinks).toEqual(["Catalog.НематериальныеАктивы"])
  })

  it("collects pending metadata target references during first pass", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-validation-first-pass-"))
    tempDirs.push(projectDir)
    writeProjectFile(projectDir, "ФункциональнаяОпция/ИспользоватьАртикулы.yaml", [
      "СоставФункциональнойОпции:",
      "  - Catalog.Номенклатура.Attribute.Артикул",
    ])
    const file = resolveValidationProjectFile(
      projectDir,
      join(projectDir, "ФункциональнаяОпция/ИспользоватьАртикулы.yaml")
    )
    if (!file) throw new Error("file not resolved")

    const first = validateProjectFileFirstPass({
      projectDir,
      file,
      cache: createProjectYamlCache(),
      context: mockContext,
      schemaCache: sharedSchemaCache,
      rulesSnapshot,
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
      rulesSnapshot,
    })

    expect(first.objectIndexEntries).toContainEqual(
      expect.objectContaining({
        canonical: "Subsystem.Администрирование.Subsystem.Настройки",
        result: expect.objectContaining({ ok: true }),
      })
    )
  })

  it("builds an object index entry for an inline external data source function", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-validation-first-pass-"))
    tempDirs.push(projectDir)
    const projectPath = "ВнешнийИсточникДанных/Источник/Свойства.yaml"
    writeProjectFile(projectDir, projectPath, [
      "Функции:",
      "  Функция1:",
      "    Тип: Строка",
    ])

    const first = validateProjectPath(projectDir, projectPath)

    expect(first.objectIndexEntries).toContainEqual(expect.objectContaining({
      canonical: "ExternalDataSource.Источник.Function.Функция1",
      result: expect.objectContaining({ ok: true }),
    }))
  })
})

function writeProjectFile(projectDir: string, projectPath: string, lines: string[] | string): void {
  const filePath = join(projectDir, ...projectPath.split("/"))
  mkdirSync(dirname(filePath), { recursive: true })
  const text = Array.isArray(lines) ? lines.join("\n") : lines
  writeFileSync(filePath, `${text.trimEnd()}\n`)
}

function requireValidationProjectFile(component: ReturnType<typeof createValidationProjectComponent>, projectPath: string) {
  const file = resolveValidationProjectFile(component.componentDir, projectPath, component)
  if (!file) throw new Error("file not resolved")
  return file
}

function validationRuntimeWithFileValidator(role: string, validator: ProjectFileValidator) {
  const definition = composeMetadataRules(
    metadataRules,
    defineMetadataRules({
      ...emptyMetadataRules,
      references: [{ kind: "fileValidator", role, validator }],
    }),
  )
  const rules = createRuleRegistrySet(definition)
  return createValidationRegistrySet(definition, rules)
}
