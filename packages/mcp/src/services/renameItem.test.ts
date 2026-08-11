import { mkdirSync, mkdtempSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { renameItem } from "./renameItem"
import { emptyDiagnosticOutputForTest } from "./projectStateTestSupport"
import { cleanupTempDirs } from "./testTempDirs"

describe("renameItem service", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    cleanupTempDirs(tempDirs)
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
    const projectState = { refreshAndValidate: vi.fn() }

    const result = await renameItem(
      {
        projectDir,
        componentPath: "cfe/Расширение",
        metadataRef: "Справочник.Товары",
        newName: "Номенклатура",
        allowWrite: true,
        ignoreValidationErrors: true,
      },
      { renameMetadataItem, projectState: projectState as never },
    )

    expect(renameMetadataItem).toHaveBeenCalledWith({
      projectDir,
      componentPath: "cfe/Расширение",
      path: "Справочник.Товары",
      newName: "Номенклатура",
      allowWrite: true,
      ignoreValidationErrors: true,
      projectState,
    })
    expect(result).toEqual({
      ...coreResult,
      ...emptyDiagnosticOutputForTest,
    })
  })

  function createProject(): string {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-mcp-rename-"))
    tempDirs.push(projectDir)
    mkdirSync(join(projectDir, "cf"), { recursive: true })
    mkdirSync(join(projectDir, "cfe", "Расширение"), { recursive: true })
    return projectDir
  }
})
