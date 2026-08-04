import { mkdirSync, mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { CoreProjectStateService } from "../coreApi"
import { rebuildProjectCache, resetProjectCache } from "./projectCache"
import { createCoreProjectStateTestDouble, createDiagnosticCollectionForTest } from "./projectStateTestSupport"

describe("project cache service", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    tempDirs.splice(0).forEach(removeProject)
  })

  it("сбрасывает runtime и disk state через нейтральный service без validation", async () => {
    const projectDir = createProject()
    const projectState = state({ reset: vi.fn(async () => undefined) })

    const result = await resetProjectCache(
      { projectDir, allowWrite: true },
      { projectState },
    )

    expect(projectState.reset).toHaveBeenCalledWith(projectDir)
    expect(projectState.refreshAndValidate).not.toHaveBeenCalled()
    expect(projectState.rebuild).not.toHaveBeenCalled()
    expect(result).toEqual({ ok: true, reset: true })
  })

  it("возвращает diagnostics и статистику отдельного полного rebuild", async () => {
    const projectDir = createProject()
    const diagnostics = [{
      filePath: "cf/Справочник/Товары/Свойства.yaml",
      line: 1,
      col: 1,
      severity: "error" as const,
      message: "Ошибка",
    }]
    const stats = { hashedFiles: 3, parsedYamlFiles: 2, changedFiles: 3, deletedFiles: 0 }
    const projectState = state({
      rebuild: vi.fn(async () => ({ diagnostics: createDiagnosticCollectionForTest(diagnostics), stats, readToken: new Uint8Array() })),
    })

    const result = await rebuildProjectCache(
      { projectDir, allowWrite: true },
      { projectState },
    )

    expect(projectState.rebuild).toHaveBeenCalledWith({ projectDir })
    expect(result).toEqual({
      ok: true,
      diagnostics: [{ ...diagnostics[0], source: "structure" }],
      summary: { errors: 1, warnings: 0, shown: 1, omitted: 0 },
      truncated: false,
      stats,
    })
  })

  function createProject(): string {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-mcp-project-cache-"))
    mkdirSync(join(projectDir, "cf"))
    tempDirs.push(projectDir)
    return projectDir
  }

  function removeProject(projectDir: string): void {
    rmSync(projectDir, { recursive: true, force: true })
  }
})

function state(overrides: Partial<CoreProjectStateService>): CoreProjectStateService {
  return Object.assign(createCoreProjectStateTestDouble(), overrides)
}
