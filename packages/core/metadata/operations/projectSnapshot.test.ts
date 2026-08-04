import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterAll, afterEach, describe, expect, it } from "vitest"
import { mockContext } from "../../tests/mockContext"
import { createPreparedYamlWorkerTestPool } from "../../tests/preparedYamlWorkerTestPool"
import { prepareYamlProjectWithPool } from "../project/preparedYamlProject"
import type { ValidationWorkerPoolHandle } from "../validation/validateProject"
import type { Diagnostic } from "../validation/types"
import { buildMetadataOperationSnapshot, buildMetadataOperationSnapshotFromPreparedProject } from "./projectSnapshot"
import { createMetadataDiagnosticCollectionFromDiagnostics } from "../diagnostics/collection"

function validationHandle(diagnostics: Diagnostic[]): ValidationWorkerPoolHandle {
  return {
    async validateProject() {
      return { diagnostics: createMetadataDiagnosticCollectionFromDiagnostics(diagnostics) }
    },
  }
}

describe("buildMetadataOperationSnapshot", () => {
  const tempDirs: string[] = []
  const prepareTestPool = createPreparedYamlWorkerTestPool()
  const preparePool = prepareTestPool.pool
  const validationWorkerPoolHandle = validationHandle([])

  afterAll(async () => {
    await prepareTestPool.close()
  })

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  it("requires validationProjectDir only when project validation is enabled", () => {
    // @ts-expect-error validationProjectDir is required for root-only project validation.
    const missingValidationRoot: Parameters<typeof buildMetadataOperationSnapshot>[0] = {
      projectDir: "/project/cf",
      requireValidProject: true,
    }
    const bestEffortSnapshot: Parameters<typeof buildMetadataOperationSnapshot>[0] = {
      projectDir: "/project/cf",
      requireValidProject: false,
    }

    void missingValidationRoot
    void bestEffortSnapshot
  })

  it("returns validation_failed before operation planning when project is invalid", async () => {
    const validationProjectDir = mkdtempSync(join(tmpdir(), "nkdk-operation-snapshot-"))
    const projectDir = join(validationProjectDir, "cf")
    tempDirs.push(validationProjectDir)
    mkdirSync(join(projectDir, "Справочник", "Товары"), { recursive: true })
    writeFileSync(join(projectDir, "Справочник", "Товары", "Свойства.yaml"), "НеизвестноеПоле: true\n")

    const result = await buildMetadataOperationSnapshot({
      projectDir,
      validationProjectDir,
      requireValidProject: true,
      validationWorkerPoolHandle: validationHandle([
        {
          filePath: "cf/Справочник/Товары/Свойства.yaml",
          line: 1,
          col: 1,
          path: "/НеизвестноеПоле",
          severity: "error",
          source: "structure",
          message: "Неизвестное поле",
        },
      ]),
    })

    expect(result).toMatchObject({
      ok: false,
      code: "validation_failed",
      diagnostics: expect.arrayContaining([
        expect.objectContaining({
          filePath: "cf/Справочник/Товары/Свойства.yaml",
          path: "/НеизвестноеПоле",
          severity: "error",
          source: "structure",
        }),
      ]),
    })
    if (!result.ok) {
      expect(result.diagnostics.map(({ message }) => message)).not.toContain("Базовая конфигурация cf не найдена")
    }
  }, 30_000)

  it("validates the NKDK root before building a component-local snapshot", async () => {
    const validationProjectDir = mkdtempSync(join(tmpdir(), "nkdk-operation-snapshot-"))
    const projectDir = join(validationProjectDir, "cf")
    tempDirs.push(validationProjectDir)
    mkdirSync(join(projectDir, "Язык", "Русский"), { recursive: true })
    mkdirSync(join(projectDir, "Справочник", "Товары"), { recursive: true })
    writeFileSync(
      join(projectDir, "Конфигурация.yaml"),
      ["Имя: Конфигурация", "ОсновнойЯзык: Русский", ""].join("\n")
    )
    writeFileSync(join(projectDir, "Язык", "Русский", "Свойства.yaml"), "КодЯзыка: ru\n")
    writeFileSync(join(projectDir, "Справочник", "Товары", "Свойства.yaml"), "{}\n")

    const result = await buildMetadataOperationSnapshot({
      projectDir,
      validationProjectDir,
      requireValidProject: true,
      validationWorkerPoolHandle,
    })

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.message)
    expect(result.projectDir).toBe(projectDir)
    expect(result.items.map(({ projectPath }) => projectPath)).toEqual(
      expect.arrayContaining([
        "Конфигурация.yaml",
        "Язык/Русский/Свойства.yaml",
        "Справочник/Товары/Свойства.yaml",
      ])
    )
    expect(result.items).toHaveLength(3)
  }, 30_000)

  it("allows best-effort snapshot for listing targets", async () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-operation-snapshot-"))
    tempDirs.push(projectDir)
    mkdirSync(join(projectDir, "Справочник", "Товары"), { recursive: true })
    writeFileSync(join(projectDir, "Справочник", "Товары", "Свойства.yaml"), "НеизвестноеПоле: true\n")

    const result = await buildMetadataOperationSnapshot({ projectDir, requireValidProject: false })

    expect(result.ok).toBe(true)
  })

  it("includes the same YAML file kinds as validation discovery", async () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-operation-snapshot-"))
    tempDirs.push(projectDir)
    mkdirSync(join(projectDir, "Справочник", "Товары", "Формы", "ФормаЭлемента"), { recursive: true })
    writeFileSync(join(projectDir, "Справочник", "Товары", "Свойства.yaml"), "{}\n")
    writeFileSync(join(projectDir, "Справочник", "Товары", "Формы", "ФормаЭлемента", "Форма.yaml"), "Элементы: {}\n")

    const result = await buildMetadataOperationSnapshot({ projectDir, requireValidProject: false })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.items.map((item) => item.projectPath).sort()).toEqual([
      "Справочник/Товары/Свойства.yaml",
      "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml",
    ])
  })

  it("uses prepared YAML data without constructing a model", async () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-operation-snapshot-"))
    tempDirs.push(projectDir)
    mkdirSync(join(projectDir, "Справочник", "Товары"), { recursive: true })
    writeFileSync(join(projectDir, "Справочник", "Товары", "Свойства.yaml"), "{}\n")

    const prepared = await prepareYamlProjectWithPool({ projectDir, context: mockContext, pool: preparePool })
    expect(prepared.ok).toBe(true)
    if (!prepared.ok) throw new Error(prepared.message)

    const result = buildMetadataOperationSnapshotFromPreparedProject({
      project: prepared.project,
      context: mockContext,
      requireValidProject: false,
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.items).toHaveLength(1)
    expect(result.items[0]).toMatchObject({
      projectPath: "Справочник/Товары/Свойства.yaml",
      kind: "properties",
      yaml: {},
    })
    expect(result.items[0]).not.toHaveProperty("model")
    expect(result.items[0]?.parsed.text).toBe("")
  })
})
