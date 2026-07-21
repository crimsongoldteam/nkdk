import { mkdirSync, mkdtempSync, rmSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { renameItem } from "./renameItem"

describe("renameItem service", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  it("passes selected component operation path to core", async () => {
    const projectDir = createProject()
    const coreResult = {
      ok: true,
      mode: "applied",
      changedFiles: [],
      rewrittenReferences: [],
      blockedReferences: [],
    }
    const renameMetadataItem = vi.fn().mockResolvedValue(coreResult)

    const result = await renameItem(
      {
        projectDir,
        componentPath: "cfe/Расширение",
        metadataRef: "Справочник.Товары",
        newName: "Номенклатура",
        allowWrite: true,
      },
      { renameMetadataItem },
    )

    expect(renameMetadataItem).toHaveBeenCalledWith({
      projectDir: join(projectDir, "cfe", "Расширение"),
      path: "Справочник.Товары",
      newName: "Номенклатура",
      allowWrite: true,
    })
    expect(result).toEqual(coreResult)
  })

  function createProject(): string {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-mcp-rename-"))
    tempDirs.push(projectDir)
    mkdirSync(join(projectDir, "cf"), { recursive: true })
    mkdirSync(join(projectDir, "cfe", "Расширение"), { recursive: true })
    return projectDir
  }
})
