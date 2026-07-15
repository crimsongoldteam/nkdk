import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { mockContext } from "../../tests/mockContext"
import { prepareYamlProject } from "../project/preparedYamlProject"
import { buildMetadataOperationSnapshot, buildMetadataOperationSnapshotFromPreparedProject } from "./projectSnapshot"

describe("buildMetadataOperationSnapshot", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  it(
    "returns validation_failed before operation planning when project is invalid",
    async () => {
      const projectDir = mkdtempSync(join(tmpdir(), "nkdk-operation-snapshot-"))
      tempDirs.push(projectDir)
      mkdirSync(join(projectDir, "Справочник", "Товары"), { recursive: true })
      writeFileSync(join(projectDir, "Справочник", "Товары", "Свойства.yaml"), "НеизвестноеПоле: true\n")

      const result = await buildMetadataOperationSnapshot({ projectDir, requireValidProject: true })

      expect(result).toMatchObject({
        ok: false,
        code: "validation_failed",
        diagnostics: [expect.objectContaining({ severity: "error" })],
      })
    },
    30_000
  )

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

  it("imports operation models from prepared YAML data without source text", async () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-operation-snapshot-"))
    tempDirs.push(projectDir)
    mkdirSync(join(projectDir, "Справочник", "Товары"), { recursive: true })
    writeFileSync(join(projectDir, "Справочник", "Товары", "Свойства.yaml"), "{}\n")

    const prepared = await prepareYamlProject({ projectDir, context: mockContext, concurrency: 1 })
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
    })
    expect(result.items[0]?.parsed.text).toBe("")
  })
})
