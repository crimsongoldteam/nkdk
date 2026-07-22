import { mkdirSync, mkdtempSync, rmSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { findReferences } from "./findReferences"

describe("findReferences service", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  it("passes selected component operation path to core without requiring write mode", async () => {
    const projectDir = createProject()
    const coreResult = {
      ok: true,
      mode: "plan",
      changedFiles: [],
      rewrittenReferences: [],
      blockedReferences: [],
    }
    const findMetadataReferences = vi.fn().mockResolvedValue(coreResult)

    const result = await findReferences(
      {
        projectDir,
        componentPath: "cfe/Расширение",
        metadataRef: "Справочник.Товары",
      },
      { findMetadataReferences }
    )

    expect(findMetadataReferences).toHaveBeenCalledWith({
      projectDir: join(projectDir, "cfe", "Расширение"),
      path: "Справочник.Товары",
    })
    expect(result).toEqual(coreResult)
  })

  function createProject(): string {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-mcp-find-"))
    tempDirs.push(projectDir)
    mkdirSync(join(projectDir, "cf"), { recursive: true })
    mkdirSync(join(projectDir, "cfe", "Расширение"), { recursive: true })
    return projectDir
  }
})
