import { existsSync, readFileSync } from "fs"
import { join } from "path"
import { afterAll, afterEach, describe, expect, it } from "vitest"
import { createTestProjectStateReadToken } from "../projectState/tests/readToken"
import type { ProjectStateService } from "../projectState/service"
import { findMetadataReferences } from "./findMetadataReferences"
import {
  completeOperationReadSession,
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
} from "./operationTestSupport"

const validationError = operationValidationError

describe("findMetadataReferences", { timeout: 30_000 }, () => {
  const harness = createOperationTestProjectHarness("nkdk-delete-item-")
  const { projectState, createProject, writeProjectFile } = harness

  afterAll(async () => {
    await harness.close()
  })

  afterEach(() => harness.cleanup())

  function findInValidProject(projectDir: string, path: string) {
    return findMetadataReferences({
      projectDir,
      path,
      projectState,
      ignoreValidationErrors: true,
    })
  }

  it("does not run full validation before looking for references", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", [
      "ВводПоСтроке:",
      "  - СтандартныйРеквизит.ПометкаУдаления",
    ])

    const result = await findInValidProject(projectDir, "Справочник.Товары")

    expect(result).toMatchObject({ ok: true, mode: "plan", blockedReferences: [] })
  })

  it("returns validation_failed when YAML preparation fails", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", ['Имя: "'])
    harness.setIndex({ diagnostics: [validationError] })

    const result = await findMetadataReferences({
      projectDir,
      path: "Справочник.Товары",
      projectState,
    })

    expect(result).toMatchObject({ ok: false, code: "validation_failed" })
  })

  it("blocks external references to deleted object descendants", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", ["Реквизиты:", "  Артикул:", "    Тип: Строка"])
    writeProjectFile(projectDir, "Справочник/Заказы/Свойства.yaml", ["Владельцы:", "  - Справочник.Товары"])
    harness.setIndex({
      references: [operationMetadataReference("cf/Справочник/Заказы/Свойства.yaml", ["Владельцы", 0], "Catalog.Товары")],
    })

    const result = await findInValidProject(projectDir, "Справочник.Товары")

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
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", operationLockFieldYaml)
    harness.setIndex({
      references: [operationMetadataReference(
        "cf/Справочник/Товары/Свойства.yaml",
        ["ПоляБлокировкиДанных", 0],
        "Catalog.Товары.Attribute.Артикул",
      )],
    })

    const result = await findInValidProject(projectDir, "Справочник.Товары")

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
       projectState,
      ignoreValidationErrors: true,
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
       projectState,
      ignoreValidationErrors: true,
    })

    expect(result).toMatchObject({ ok: true, mode: "plan", changedFiles: [], blockedReferences: [] })
    expect(existsSync(join(projectDir, "cf", "Справочник", "Товары", "Формы", "ФормаЭлемента"))).toBe(true)
    expect(existsSync(join(projectDir, "Миграции"))).toBe(false)
  })

  it("blocks delete when a form contains a structural reference", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "ОбщаяКартинка/Состояния/Свойства.yaml", "{}")
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", "{}")
    writeProjectFile(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml", operationPictureFormYaml)
    harness.setIndex({
      references: [operationMetadataReference(
        "cf/Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml",
        ["Элементы", "Картинка", "КартинкаЗначений"],
        "CommonPicture.Состояния",
      )],
    })

    const result = await findMetadataReferences({
      projectDir,
      path: "ОбщаяКартинка.Состояния",
       projectState,
      ignoreValidationErrors: true,
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
    writeProjectFile(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml", operationDataPathFormYaml)
    harness.setIndex({ references: [operationDataPathReference()] })

    const result = await findMetadataReferences({
      projectDir,
      path: "Справочник.Товары.Реквизит.Артикул",
       projectState,
      ignoreValidationErrors: true,
    })

    expect(result).toMatchObject({ ok: false, code: "references_found" })
  })

  it.each([
    [false, "validation_failed"],
    [true, "plan"],
  ] as const)("refresh обязателен при ignoreValidationErrors=%s", async (ignoreValidationErrors, outcome) => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "cf/Справочник/Товары/Свойства.yaml", "{}")
    const calls: string[] = []
    const projectState = referenceProjectState(calls, [validationError])

    const result = await findMetadataReferences({
      projectDir,
      path: "Справочник.Товары",
      ignoreValidationErrors,
      projectState,
    })

    expect(calls).toEqual(ignoreValidationErrors ? ["refresh", "read"] : ["refresh"])
    if (outcome === "validation_failed") {
      expect(result).toMatchObject({ ok: false, code: outcome, diagnostics: [validationError] })
    } else {
      expect(result).toMatchObject({
        ok: true,
        mode: outcome,
        diagnostics: [
          validationError,
          expect.objectContaining({ severity: "warning", code: "search_result_may_be_incomplete" }),
        ],
      })
    }
  })

  it.each([false, true])("не пропускает техническую ошибку refresh при ignoreValidationErrors=%s", async (ignoreValidationErrors) => {
    const projectDir = createProject()
    const technical = new Error("writer недоступен")
    const projectState = referenceProjectState([], [], technical)

    await expect(findMetadataReferences({
      projectDir,
      path: "Справочник.Товары",
      ignoreValidationErrors,
      projectState,
    })).rejects.toBe(technical)
  })

  it.each([
    ["invalid_path", "Справочник", true],
    ["unsupported_target", "Неизвестный.Товары", true],
    ["target_not_found", "Справочник.Товары", false],
  ] as const)("добавляет warning к раннему результату %s только при продолжении с ошибками", async (code, path, targetFound) => {
    const projectDir = createProject()
    const projectState = referenceProjectState([], [validationError], undefined, targetFound)

    const continued = await findMetadataReferences({
      projectDir,
      path,
      ignoreValidationErrors: true,
      projectState,
    })
    const blocked = await findMetadataReferences({
      projectDir,
      path,
      ignoreValidationErrors: false,
      projectState,
    })

    expect(continued).toMatchObject({
      ok: false,
      code,
      diagnostics: [
        validationError,
        expect.objectContaining({ severity: "warning", code: "search_result_may_be_incomplete" }),
      ],
    })
    expect(blocked).toMatchObject({ ok: false, code: "validation_failed", diagnostics: [validationError] })
  })
})

function referenceProjectState(
  calls: string[],
  diagnostics: readonly typeof validationError[],
  refreshError?: Error,
  targetFound = true,
): ProjectStateService {
  return completeOperationProjectState({
    async refreshAndValidate() {
      if (refreshError !== undefined) throw refreshError
      calls.push("refresh")
      return { diagnostics, readToken: createTestProjectStateReadToken(), stats: emptyOperationRefreshStats() }
    },
    openReadSession() {
      if (!targetFound) {
        return completeOperationReadSession({
          resolveTargets() {
            calls.push("read")
            return [{ requestId: "target", status: "missing" }]
          },
          findReferences() { throw new Error("findReferences не должен вызываться") },
        })
      }
      return operationTargetReadSession({
        canonical: "Catalog.Товары",
        projectPath: "cf/Справочник/Товары/Свойства.yaml",
        onRead: () => calls.push("read"),
      })
    },
  })
}
