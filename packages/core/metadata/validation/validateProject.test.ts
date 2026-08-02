import { resolve } from "node:path"
import { describe, expect, it } from "vitest"
import type { ProjectStateRefreshParams, ProjectStateRefreshResult } from "../projectState/refresh"
import type { ProjectStateService } from "../projectState/service"
import type { Diagnostic } from "./types"
import {
  createValidationWorkerPoolHandle,
  toRootProjectDiagnostic,
  validateProject,
} from "./validateProject"

describe("validateProject", () => {
  it("всегда актуализирует весь проект через переданное состояние и не закрывает его", async () => {
    const projectState = testProjectState([
      diagnostic("cf/Конфигурация.yaml", "invalid", "structure"),
    ])

    const result = await validateProject({
      projectDir: "/project",
      concurrency: 2,
      projectState,
    })

    expect(result).toEqual({
      diagnostics: [diagnostic("cf/Конфигурация.yaml", "invalid", "structure")],
    })
    expect(projectState.refreshes).toEqual([{
      projectDir: "/project",
      concurrency: 2,
      context: undefined,
    }])
    expect(projectState.closed).toBe(0)
  })

  it("переиспользует одно состояние в совместимом handle и закрывает его один раз", async () => {
    const projectState = testProjectState([])
    const handle = createValidationWorkerPoolHandle({
      concurrency: 2,
      createProjectState: () => projectState,
    })

    await handle.validateProject({ projectDir: "/first" })
    await handle.validateProject({ projectDir: "/second" })
    await handle.close()
    await handle.close()

    expect(projectState.refreshes.map(({ projectDir }) => projectDir)).toEqual(["/first", "/second"])
    expect(projectState.closed).toBe(1)
    expect(handle.size()).toBe(2)
  })
})

describe("toRootProjectDiagnostic", () => {
  it("returns a project-relative path", () => {
    const projectDir = resolve("/project")

    expect(
      toRootProjectDiagnostic(
        projectDir,
        diagnostic(resolve(projectDir, "cf", "Конфигурация.yaml"), "invalid", "structure")
      )
    ).toMatchObject({
      filePath: "cf/Конфигурация.yaml",
      message: "invalid",
    })
  })

  it("rejects a diagnostic path outside projectDir", () => {
    const projectDir = resolve("/project")

    expect(() =>
      toRootProjectDiagnostic(
        projectDir,
        diagnostic(resolve("/other/Свойства.yaml"), "outside", "structure")
      )
    ).toThrow("за пределами projectDir")
  })
})

function testProjectState(diagnostics: readonly Diagnostic[]): ProjectStateService & {
  readonly refreshes: ProjectStateRefreshParams[]
  closed: number
} {
  const refreshes: ProjectStateRefreshParams[] = []
  return {
    refreshes,
    closed: 0,
    async refreshAndValidate(params) {
      refreshes.push(params)
      return refreshResult(diagnostics)
    },
    async readComponentProjection() {
      throw new Error("unexpected readComponentProjection")
    },
    async reset() {
      throw new Error("unexpected reset")
    },
    async rebuild() {
      throw new Error("unexpected rebuild")
    },
    async close() {
      this.closed += 1
    },
  }
}

function refreshResult(diagnostics: readonly Diagnostic[]): ProjectStateRefreshResult {
  return {
    diagnostics,
    readToken: new Uint8Array() as ProjectStateRefreshResult["readToken"],
    stats: { hashedFiles: 1, parsedYamlFiles: 1, changedFiles: 1, deletedFiles: 0 },
  }
}

function diagnostic(filePath: string, message: string, source: Diagnostic["source"]): Diagnostic {
  return {
    filePath,
    line: 1,
    col: 1,
    severity: "error",
    source,
    message,
  }
}
