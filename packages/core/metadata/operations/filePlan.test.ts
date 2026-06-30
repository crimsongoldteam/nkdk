import fs from "fs"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { applyMetadataOperationFilePlan } from "./filePlan"

describe("applyMetadataOperationFilePlan", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    vi.restoreAllMocks()
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  it("applies writes, renames and deletes in order", () => {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-file-plan-"))
    tempDirs.push(dir)
    mkdirSync(join(dir, "Справочник", "Товары"), { recursive: true })
    writeFileSync(join(dir, "Справочник", "Товары", "Свойства.yaml"), "Комментарий: Старый\n")

    const result = applyMetadataOperationFilePlan({
      steps: [
        { kind: "writeFile", path: join(dir, "Справочник", "Товары", "Свойства.yaml"), content: "Комментарий: Новый\n" },
        { kind: "renamePath", from: join(dir, "Справочник", "Товары"), to: join(dir, "Справочник", "Номенклатура") },
      ],
    })

    expect(result.ok).toBe(true)
    expect(readFileSync(join(dir, "Справочник", "Номенклатура", "Свойства.yaml"), "utf-8")).toBe(
      "Комментарий: Новый\n",
    )
  })

  it("reports partial write failure without rollback", () => {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-file-plan-"))
    tempDirs.push(dir)
    mkdirSync(dir, { recursive: true })
    const first = join(dir, "first.yaml")
    const second = join(dir, "second.yaml")
    const realWriteFileSync = fs.writeFileSync.bind(fs)
    vi.spyOn(fs, "writeFileSync").mockImplementation((path, data, options) => {
      if (path === second) throw new Error("planned failure")
      return realWriteFileSync(path, data, options)
    })

    const result = applyMetadataOperationFilePlan({
      steps: [
        { kind: "writeFile", path: first, content: "ok: true\n" },
        { kind: "writeFile", path: second, content: "ok: false\n" },
      ],
    })

    expect(result).toMatchObject({
      ok: false,
      failedStep: "writeFile",
      appliedFiles: [first],
      pendingFiles: [second],
    })
    expect(readFileSync(first, "utf-8")).toBe("ok: true\n")
  })
})
