import { existsSync, mkdirSync, readFileSync } from "fs"
import { join } from "path"
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"
import { createTestProjectStateReadToken } from "../projectState/tests/readToken"
import { createMetadataDiagnosticCollectionFromDiagnostics } from "../diagnostics/collection"
import { registerCoreMetadata } from "../register"
import type { ProjectStateService } from "../projectState/service"
import type { Diagnostic } from "../validation/types"
import {
  completeOperationProjectState,
  createOperationTestProjectHarness,
  emptyOperationRefreshStats,
  operationDataPathFormYaml,
  operationDataPathReference,
  operationLockFieldYaml,
  operationMetadataReference,
  operationPictureFormYaml,
  operationTargetReadSession,
  operationValidationError,
} from "./tests/operationTestSupport"
import { renameMetadataItem } from "./renameItem"

registerCoreMetadata()

const validationError = operationValidationError

describe("renameMetadataItem", { timeout: 30_000 }, () => {
  const harness = createOperationTestProjectHarness("nkdk-rename-item-")
  const { projectState, createProject, writeProjectFile } = harness

  beforeAll(async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", operationLockFieldYaml)
    harness.setIndex({
      references: [operationMetadataReference(
        "cf/Справочник/Товары/Свойства.yaml",
        ["ПоляБлокировкиДанных", 0],
        "Catalog.Товары.Attribute.Артикул",
      )],
    })
    await renameMetadataItem({
      projectDir,
      path: "Справочник.Товары",
      newName: "Номенклатура",
      projectState,
      ignoreValidationErrors: true,
    })
    harness.cleanup()
  })

  afterAll(async () => {
    await harness.close()
  })

  afterEach(() => harness.cleanup())

  function applyAttributeRename(
    projectDir: string,
    state: ProjectStateService,
    ignoreValidationErrors = false,
  ) {
    return renameMetadataItem({
      projectDir,
      path: "Справочник.Товары.Реквизит.Артикул",
      newName: "Код",
      allowWrite: true,
      now: new Date("2026-08-01T10:00:00.000Z"),
      ignoreValidationErrors,
      projectState: state,
    })
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
       projectState,
      ignoreValidationErrors: true,
    })

    expect(result).toMatchObject({ ok: false, code: "invalid_name" })
    expect(existsSync(join(projectDir, "Миграции"))).toBe(false)
  })

  it("plans object rename with migration and descendant reference rewrite", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", operationLockFieldYaml)
    harness.setIndex({
      references: [operationMetadataReference(
        "cf/Справочник/Товары/Свойства.yaml",
        ["ПоляБлокировкиДанных", 0],
        "Catalog.Товары.Attribute.Артикул",
      )],
    })

    const result = await renameMetadataItem({
      projectDir,
      path: "Справочник.Товары",
      newName: "Номенклатура",
       projectState,
      ignoreValidationErrors: true,
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

  it("пакетно переписывает много индексированных ссылок одного YAML", async () => {
    const projectDir = createProject()
    const referenceCount = 100
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", [
      "ПоляБлокировкиДанных:",
      ...Array.from({ length: referenceCount }, (_, index) => `  - Реквизит.Поле${index}`),
    ])
    harness.setIndex({
      references: Array.from({ length: referenceCount }, (_, index) => operationMetadataReference(
        "cf/Справочник/Товары/Свойства.yaml",
        ["ПоляБлокировкиДанных", index],
        `Catalog.Товары.Attribute.Поле${index}`,
      )),
    })

    const result = await renameMetadataItem({
      projectDir,
      path: "Справочник.Товары",
      newName: "Номенклатура",
      projectState,
      ignoreValidationErrors: true,
    })

    expect(result.ok && result.rewrittenReferences).toHaveLength(referenceCount)
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
       projectState,
      ignoreValidationErrors: true,
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
       projectState,
      ignoreValidationErrors: true,
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
       projectState,
      ignoreValidationErrors: true,
    })
    expect(caseOnly).toMatchObject({ ok: true, mode: "plan" })

    const conflict = await renameMetadataItem({
      projectDir,
      path: "Справочник.Товары.Реквизит.Артикул",
      newName: "код",
       projectState,
      ignoreValidationErrors: true,
    })
    expect(conflict).toMatchObject({ ok: false, code: "name_conflict" })
  })

  it("renames file item without migration and rewrites form references", async () => {
    const projectDir = createProject()
    const propertiesPath = writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", [
      "ОсновнаяФормаОбъекта: ФормаЭлемента",
    ])
    writeProjectFile(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml", ["Элементы: {}"])
    harness.setIndex({
      targetProjectPath: "cf/Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml",
      references: [operationMetadataReference(
        "cf/Справочник/Товары/Свойства.yaml",
        ["ОсновнаяФормаОбъекта"],
        "Catalog.Товары.Form.ФормаЭлемента",
      )],
    })

    const result = await renameMetadataItem({
      projectDir,
      path: "Справочник.Товары.Форма.ФормаЭлемента",
      newName: "ФормаКарточки",
      allowWrite: true,
       projectState,
      ignoreValidationErrors: true,
    })

    expect(result).toMatchObject({ ok: true, mode: "applied", createdMigration: undefined })
    expect(existsSync(join(projectDir, "cf", "Справочник", "Товары", "Формы", "ФормаКарточки", "Форма.yaml"))).toBe(true)
    expect(existsSync(join(projectDir, "Миграции"))).toBe(false)
    expect(readFileSync(propertiesPath, "utf-8")).toContain("ОсновнаяФормаОбъекта: ФормаКарточки")
  })

  it("переименовывает весь каталог макета по путям индекса без Template.xml", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Отчет/Продажи/Свойства.yaml", ["{}"])
    const evidencePath = writeProjectFile(
      projectDir,
      "Отчет/Продажи/Шаблоны/Схема/Ext/Картинка.png",
      "image",
    )
    harness.setIndex({
      targetProjectPath: "cf/Отчет/Продажи/Шаблоны/Схема/Ext/Картинка.png",
      itemProjectPath: "cf/Отчет/Продажи/Шаблоны/Схема",
      ownerProjectPath: "cf/Отчет/Продажи/Свойства.yaml",
      collectionCanonicalPrefix: "Report.Продажи.Template",
      collectionNames: ["Схема", "Занято"],
    })

    const conflict = await renameMetadataItem({
      projectDir,
      path: "Отчет.Продажи.Макет.Схема",
      newName: "занято",
      projectState,
      ignoreValidationErrors: true,
    })
    expect(conflict).toMatchObject({ ok: false, code: "name_conflict" })

    const result = await renameMetadataItem({
      projectDir,
      path: "Отчет.Продажи.Макет.Схема",
      newName: "НоваяСхема",
      allowWrite: true,
      projectState,
      ignoreValidationErrors: true,
    })

    expect(result).toMatchObject({ ok: true, mode: "applied", createdMigration: undefined })
    expect(existsSync(evidencePath)).toBe(false)
    expect(existsSync(join(projectDir, "cf/Отчет/Продажи/Шаблоны/НоваяСхема/Ext/Картинка.png"))).toBe(true)
  })

  it("rewrites form structural references when a referenced object is renamed", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "ОбщаяКартинка/Состояния/Свойства.yaml", "{}")
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", "{}")
    const formPath = writeProjectFile(
      projectDir,
      "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml",
      operationPictureFormYaml,
    )
    harness.setIndex({
      references: [operationMetadataReference(
        "cf/Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml",
        ["Элементы", "Картинка", "КартинкаЗначений"],
        "CommonPicture.Состояния",
      )],
    })

    const result = await renameMetadataItem({
      projectDir,
      path: "ОбщаяКартинка.Состояния",
      newName: "Статусы",
      allowWrite: true,
       projectState,
      ignoreValidationErrors: true,
    })

    expect(result.ok).toBe(true)
    expect(readFileSync(formPath, "utf-8")).toContain("КартинкаЗначений: ОбщаяКартинка.Статусы")
  })

  it("переписывает ссылку в значении заполнения при переименовании объекта", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Контрагенты/Свойства.yaml", "{}")
    const propertiesPath = writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", [
      "Реквизиты:",
      "  Получатель:",
      "    Тип: Справочник.Контрагенты",
      "    ЗначениеЗаполнения: Справочник.Контрагенты.Поставщик",
    ])
    harness.setIndex({
      references: [operationMetadataReference(
        "cf/Справочник/Товары/Свойства.yaml",
        ["Реквизиты", "Получатель", "ЗначениеЗаполнения"],
        "Catalog.Контрагенты.Поставщик",
      )],
    })

    const result = await renameMetadataItem({
      projectDir,
      path: "Справочник.Контрагенты",
      newName: "Клиенты",
      allowWrite: true,
      projectState,
      ignoreValidationErrors: true,
    })

    expect(result).toMatchObject({ ok: true })
    expect(readFileSync(propertiesPath, "utf-8")).toContain(
      "ЗначениеЗаполнения: Справочник.Клиенты.Поставщик",
    )
  })

  it("rewrites resolvable form DataPath when an attribute is renamed", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", ["Реквизиты:", "  Артикул:", "    Тип: Строка"])
    const formPath = writeProjectFile(
      projectDir,
      "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml",
      operationDataPathFormYaml,
    )
    harness.setIndex({ references: [operationDataPathReference()] })

    const result = await renameMetadataItem({
      projectDir,
      path: "Справочник.Товары.Реквизит.Артикул",
      newName: "Код",
      allowWrite: true,
       projectState,
      ignoreValidationErrors: true,
    })

    expect(result.ok).toBe(true)
    expect(readFileSync(formPath, "utf-8")).toContain("ПутьКДанным: Объект.Код")
  })

  it.each([
    [false, "validation_failed"],
    [true, "plan"],
  ] as const)("блокирует только error diagnostics без ignoreValidationErrors=%s", async (ignoreValidationErrors, outcome) => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "cf/Справочник/Товары/Свойства.yaml", ["Реквизиты:", "  Артикул:", "    Тип: Строка"])
    const calls: string[] = []
    const projectState = renameProjectState(calls, [[validationError]])

    const result = await renameMetadataItem({
      projectDir,
      path: "Справочник.Товары.Реквизит.Артикул",
      newName: "Код",
      ignoreValidationErrors,
      projectState,
    })

    expect(calls).toEqual(ignoreValidationErrors ? ["refresh-before", "read-target-and-references"] : ["refresh-before"])
    expect(result).toMatchObject(outcome === "validation_failed"
      ? { ok: false, code: outcome, diagnostics: [validationError] }
      : { ok: true, mode: outcome, diagnostics: [validationError] })
  })

  it.each([false, true])("не пропускает техническую ошибку первого refresh при ignoreValidationErrors=%s", async (ignoreValidationErrors) => {
    const projectDir = createProject()
    const technical = new Error("writer недоступен")
    const projectState = completeOperationProjectState({
      async refreshAndValidate() { throw technical },
      openReadSession() { throw new Error("read session не должен открываться") },
    })

    await expect(renameMetadataItem({
      projectDir,
      path: "Справочник.Товары",
      newName: "Номенклатура",
      ignoreValidationErrors,
      projectState,
    })).rejects.toBe(technical)
  })

  it("актуализирует до и после фактического переименования в правильном порядке", async () => {
    const projectDir = createProject()
    const propertiesPath = writeProjectFile(projectDir, "cf/Справочник/Товары/Свойства.yaml", [
      "Реквизиты:",
      "  Артикул:",
      "    Тип: Строка",
    ])
    const calls: string[] = []
    const afterWarning = { ...validationError, severity: "warning" as const, message: "После записи" }
    const projectState = renameProjectState(calls, [[], [afterWarning]], () => {
      if (readFileSync(propertiesPath, "utf-8").includes("Код:")) calls.push("write-affected-yaml")
    })

    const result = await applyAttributeRename(projectDir, projectState)

    expect(calls).toEqual([
      "refresh-before",
      "read-target-and-references",
      "write-affected-yaml",
      "refresh-after",
    ])
    expect(result).toMatchObject({ ok: true, mode: "applied", diagnostics: [afterWarning] })
  })

  it("после первой записи выполняет второй refresh даже при последующей ошибке записи", async () => {
    const projectDir = createProject()
    const propertiesPath = writeProjectFile(projectDir, "cf/Справочник/Товары/Свойства.yaml", [
      "Реквизиты:",
      "  Артикул:",
      "    Тип: Строка",
    ])
    mkdirSync(join(projectDir, "Миграции", "2026-08-01-100000.yaml"), { recursive: true })
    const calls: string[] = []
    const projectState = renameProjectState(calls, [[], [validationError]], () => {
      if (readFileSync(propertiesPath, "utf-8").includes("Код:")) calls.push("write-affected-yaml")
    })

    const result = await applyAttributeRename(projectDir, projectState, true)

    expect(calls).toEqual([
      "refresh-before",
      "read-target-and-references",
      "write-affected-yaml",
      "refresh-after",
    ])
    expect(result).toMatchObject({ ok: false, code: "write_failed", diagnostics: [validationError] })
  })

  it("отдаёт приоритет технической ошибке второго refresh над результатом записи", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "cf/Справочник/Товары/Свойства.yaml", [
      "Реквизиты:",
      "  Артикул:",
      "    Тип: Строка",
    ])
    const technical = new Error("refresh после записи не выполнен")
    let refresh = 0
    const projectState = completeOperationProjectState({
      async refreshAndValidate() {
        refresh += 1
        if (refresh === 2) throw technical
        return {
          diagnostics: createMetadataDiagnosticCollectionFromDiagnostics([]),
          readToken: createTestProjectStateReadToken(),
          stats: emptyOperationRefreshStats(),
        }
      },
      openReadSession() {
        return operationTargetReadSession({
          canonical: "Catalog.Товары.Attribute.Артикул",
          projectPath: "cf/Справочник/Товары/Свойства.yaml",
          onRead() {},
        })
      },
    })

    await expect(applyAttributeRename(projectDir, projectState)).rejects.toBe(technical)
  })
})

function renameProjectState(
  calls: string[],
  diagnosticsByRefresh: readonly (readonly Diagnostic[])[],
  beforeAfterRefresh?: () => void,
): ProjectStateService {
  let refresh = 0
  return completeOperationProjectState({
    async refreshAndValidate() {
      refresh += 1
      if (refresh === 1) calls.push("refresh-before")
      else {
        beforeAfterRefresh?.()
        calls.push("refresh-after")
      }
      return {
        diagnostics: createMetadataDiagnosticCollectionFromDiagnostics(diagnosticsByRefresh[refresh - 1] ?? []),
        readToken: createTestProjectStateReadToken(),
        stats: emptyOperationRefreshStats(),
      }
    },
    openReadSession() {
      return operationTargetReadSession({
        canonical: "Catalog.Товары.Attribute.Артикул",
        projectPath: "cf/Справочник/Товары/Свойства.yaml",
        onRead: () => calls.push("read-target-and-references"),
      })
    },
  })
}
