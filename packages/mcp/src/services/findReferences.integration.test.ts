import { mkdirSync, mkdtempSync, rmSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { findReferences } from "./findReferences"
import { emptyDiagnosticOutputForTest } from "./projectStateTestSupport"

describe("findReferences service", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    while (tempDirs.length > 0) {
      rmSync(tempDirs.shift()!, { recursive: true, force: true })
    }
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
    const projectState = { refreshAndValidate: vi.fn() }

    const result = await findReferences(
      {
        projectDir,
        componentPath: "cfe/Расширение",
        metadataRef: "Справочник.Товары",
        ignoreValidationErrors: true,
      },
      { findMetadataReferences, projectState: projectState as never }
    )

    expect(findMetadataReferences).toHaveBeenCalledWith({
      projectDir,
      componentPath: "cfe/Расширение",
      path: "Справочник.Товары",
      ignoreValidationErrors: true,
      projectState,
    })
    expect(result).toEqual({
      ...coreResult,
      ...emptyDiagnosticOutputForTest,
    })
  })

  it("ограничивает большой список ссылок и сохраняет полный отчёт", async () => {
    const projectDir = createProject()
    const blockedReferences = Array.from({ length: 101 }, (_unused, index) => ({
      filePath: `cf/${index}.yaml`,
      yamlPath: ["Тип"],
      value: "Catalog.Товары",
    }))
    const findMetadataReferences = vi.fn().mockResolvedValue({
      ok: false,
      code: "references_found",
      message: "Найдены ссылки",
      changedFiles: [],
      rewrittenReferences: [],
      blockedReferences,
      diagnostics: [],
    })

    const result = await findReferences(
      { projectDir, metadataRef: "Справочник.Товары" },
      { findMetadataReferences, projectState: { refreshAndValidate: vi.fn() } as never },
    )

    expect(result).toMatchObject({
      ok: false,
      blockedReferences: blockedReferences.slice(0, 100),
      diagnostics: [],
      summary: { errors: 0, warnings: 0, shown: 0, omitted: 0 },
      truncated: true,
      report: { format: "application/x-ndjson" },
    })
  })

  function createProject(): string {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-mcp-find-"))
    tempDirs.push(projectDir)
    mkdirSync(join(projectDir, "cf"), { recursive: true })
    mkdirSync(join(projectDir, "cfe", "Расширение"), { recursive: true })
    return projectDir
  }
})
