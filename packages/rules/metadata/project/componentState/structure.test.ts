import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { readComponentProjectStructure } from "./structure"

describe("component project structure", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  function createProject(): string {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-component-structure-"))
    tempDirs.push(projectDir)
    return projectDir
  }

  function writeProjectFile(projectDir: string, projectPath: string): void {
    const filePath = join(projectDir, ...projectPath.split("/"))
    mkdirSync(join(filePath, ".."), { recursive: true })
    writeFileSync(filePath, "")
  }

  it("discovers only registered resources inside the addressed extension", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "cf/Конфигурация.yaml")
    writeProjectFile(projectDir, "cfe/Дополнение/Конфигурация.yaml")
    writeProjectFile(projectDir, "cfe/Дополнение/Справочник/Товары/Свойства.yaml")
    writeProjectFile(projectDir, "cfe/Дополнение/notes.txt")
    writeProjectFile(projectDir, "cfe/Другое/Конфигурация.yaml")

    const structure = await readComponentProjectStructure({
      projectDir,
      address: { kind: "configurationExtension", name: "Дополнение" },
    })

    expect(structure.componentPath).toBe("cfe/Дополнение")
    expect(structure.componentDir).toBe(join(projectDir, "cfe", "Дополнение"))
    expect(structure.projectPaths).toEqual([
      "Конфигурация.yaml",
      "Справочник/Товары/Свойства.yaml",
    ])
    expect(structure.resources.map(({ projectPath }) => projectPath)).toEqual(structure.projectPaths)
    expect(structure.resources.every(({ projectPath }) => !projectPath.startsWith("../"))).toBe(true)
  })
})
