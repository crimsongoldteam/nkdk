import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { discoverValidationProjectComponents } from "./projectComponents"

describe("validation project components", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  function createProject(): string {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-project-components-"))
    tempDirs.push(projectDir)
    return projectDir
  }

  function createDirectory(projectDir: string, projectPath: string): void {
    mkdirSync(join(projectDir, ...projectPath.split("/")), { recursive: true })
  }

  it("discovers configuration and immediate configuration extensions", async () => {
    const projectDir = createProject()
    createDirectory(projectDir, "cf")
    createDirectory(projectDir, "cfe/Продажи")
    createDirectory(projectDir, "cfe/Склад")
    createDirectory(projectDir, "erf/Отчёт")
    writeFileSync(join(projectDir, "cfe", "not-a-directory.txt"), "")

    expect(
      (await discoverValidationProjectComponents(projectDir)).components.map(({ componentPath, kind }) => ({
        componentPath,
        kind,
      }))
    ).toEqual([
      { componentPath: "cf", kind: "configuration" },
      { componentPath: "cfe/Продажи", kind: "configurationExtension" },
      { componentPath: "cfe/Склад", kind: "configurationExtension" },
    ])
  })

  it("discovers configuration extensions without a configuration", async () => {
    const projectDir = createProject()
    createDirectory(projectDir, "cfe/Продажи")

    const discovery = await discoverValidationProjectComponents(projectDir)

    expect(discovery.hasConfiguration).toBe(false)
    expect(discovery.components.map(({ componentPath }) => componentPath)).toEqual(["cfe/Продажи"])
  })
})
