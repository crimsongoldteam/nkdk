import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { readComponentHashState } from "./hashes"
import { readComponentProjectStructure } from "./structure"

describe("component hash state", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  function createProject(): string {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-component-hashes-"))
    tempDirs.push(projectDir)
    return projectDir
  }

  function writeProjectFile(projectDir: string, projectPath: string, content: string): void {
    const filePath = join(projectDir, ...projectPath.split("/"))
    mkdirSync(join(filePath, ".."), { recursive: true })
    writeFileSync(filePath, content)
  }

  it("hashes the exact sorted resource set without parsing YAML", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "cf/Конфигурация.yaml", "not: [valid")
    writeProjectFile(
      projectDir,
      "cf/Справочник/Товары/Формы/ФормаЭлемента/Модуль.bsl",
      "Процедура ОбработкаПроверкиЗаполнения() КонецПроцедуры"
    )
    const structure = await readComponentProjectStructure({
      projectDir,
      address: { kind: "configuration" },
    })

    const state = await readComponentHashState({ structure, concurrency: 2 })

    expect(state.componentPath).toBe("cf")
    expect(state.projectFiles.map(({ projectPath }) => projectPath)).toEqual(structure.projectPaths)
    expect(state.projectFiles).toEqual(
      [...state.projectFiles].sort((left, right) =>
        Buffer.compare(Buffer.from(left.projectPath), Buffer.from(right.projectPath))
      )
    )
  })

  it("changes only the hash of a changed external file", async () => {
    const projectDir = createProject()
    const modulePath = "cf/Справочник/Товары/Формы/ФормаЭлемента/Модуль.bsl"
    writeProjectFile(projectDir, "cf/Конфигурация.yaml", "Имя: Конфигурация")
    writeProjectFile(projectDir, modulePath, "old")
    const structure = await readComponentProjectStructure({
      projectDir,
      address: { kind: "configuration" },
    })
    const before = await readComponentHashState({ structure })

    writeProjectFile(projectDir, modulePath, "new")
    const after = await readComponentHashState({ structure })

    expect(after.projectFiles.map(({ projectPath }) => projectPath)).toEqual(
      before.projectFiles.map(({ projectPath }) => projectPath)
    )
    expect(after.projectFiles.find(({ projectPath }) => projectPath.endsWith("Модуль.bsl"))?.contentHash)
      .not.toBe(before.projectFiles.find(({ projectPath }) => projectPath.endsWith("Модуль.bsl"))?.contentHash)
    expect(after.projectFiles.find(({ projectPath }) => projectPath === "Конфигурация.yaml")?.contentHash)
      .toBe(before.projectFiles.find(({ projectPath }) => projectPath === "Конфигурация.yaml")?.contentHash)
  })
})
