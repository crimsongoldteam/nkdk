import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { buildMetadataOperationSnapshot } from "./projectSnapshot"

describe("buildMetadataOperationSnapshot", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  it("returns validation_failed before operation planning when project is invalid", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-operation-snapshot-"))
    tempDirs.push(projectDir)
    mkdirSync(join(projectDir, "Справочник", "Товары"), { recursive: true })
    writeFileSync(join(projectDir, "Справочник", "Товары", "Свойства.yaml"), "НеизвестноеПоле: true\n")

    const result = buildMetadataOperationSnapshot({ projectDir, requireValidProject: true })

    expect(result).toMatchObject({
      ok: false,
      code: "validation_failed",
      diagnostics: [expect.objectContaining({ severity: "error" })],
    })
  })

  it("allows best-effort snapshot for listing targets", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-operation-snapshot-"))
    tempDirs.push(projectDir)
    mkdirSync(join(projectDir, "Справочник", "Товары"), { recursive: true })
    writeFileSync(join(projectDir, "Справочник", "Товары", "Свойства.yaml"), "НеизвестноеПоле: true\n")

    const result = buildMetadataOperationSnapshot({ projectDir, requireValidProject: false })

    expect(result.ok).toBe(true)
  })
})
