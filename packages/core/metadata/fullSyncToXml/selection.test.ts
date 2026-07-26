import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { readComponentHashState } from "../project/componentState/hashes"
import { readComponentProjectStructure } from "../project/componentState/structure"
import type { ComponentProjectStructure } from "../project/componentState/types"
import { buildXmlSyncPlan } from "./selection"

describe("XML sync selection", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  async function createState(projectPaths: readonly string[]) {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-xml-selection-"))
    tempDirs.push(projectDir)
    for (const projectPath of projectPaths) {
      const filePath = join(projectDir, "cf", ...projectPath.split("/"))
      mkdirSync(join(filePath, ".."), { recursive: true })
      writeFileSync(filePath, projectPath)
    }
    const structure = await readComponentProjectStructure({
      projectDir,
      address: { kind: "configuration" },
    })
    const hashes = await readComponentHashState({ structure })
    return { structure, hashes }
  }

  it("builds the same plan for all resources and an explicit selection of all paths", async () => {
    const state = await createState([
      "Конфигурация.yaml",
      "Справочник/Товары/Свойства.yaml",
      "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml",
      "Справочник/Товары/Формы/ФормаЭлемента/Модуль.bsl",
    ])

    const all = buildXmlSyncPlan({ ...state, selection: { kind: "all" } })
    const selected = buildXmlSyncPlan({
      ...state,
      selection: {
        kind: "selected",
        projectPaths: [
          ...all.assignments.map(({ sourceProjectPath }) => sourceProjectPath),
          ...all.externalFiles.map(({ sourceProjectPath }) => sourceProjectPath),
        ],
      },
    })

    expect(selected).toEqual(all)
  })

  it("rejects an unknown selected path", async () => {
    const state = await createState(["Конфигурация.yaml"])

    expect(() =>
      buildXmlSyncPlan({
        ...state,
        selection: { kind: "selected", projectPaths: ["Неизвестный.yaml"] },
      })
    ).toThrow("Неизвестный путь Проекта")
  })

  it("rejects a duplicate selected path", async () => {
    const state = await createState(["Конфигурация.yaml"])

    expect(() =>
      buildXmlSyncPlan({
        ...state,
        selection: {
          kind: "selected",
          projectPaths: ["Конфигурация.yaml", "Конфигурация.yaml"],
        },
      })
    ).toThrow("Путь Проекта выбран повторно")
  })

  it("does not add owner YAML when only a form is selected", async () => {
    const formPath = "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml"
    const state = await createState([
      "Справочник/Товары/Свойства.yaml",
      formPath,
    ])

    const plan = buildXmlSyncPlan({
      ...state,
      selection: { kind: "selected", projectPaths: [formPath] },
    })

    expect(plan.assignments.map(({ sourceProjectPath }) => sourceProjectPath)).toEqual([formPath])
  })

  it("rejects duplicate XML targets before worker execution", async () => {
    const state = await createState([
      "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml",
    ])
    const original = state.structure.resources[0]!
    const duplicatePath = "duplicate.yaml"
    const structure: ComponentProjectStructure = {
      ...state.structure,
      resources: [
        original,
        { ...original, projectPath: duplicatePath },
      ],
      projectPaths: [original.projectPath, duplicatePath],
    }
    const hashes = {
      ...state.hashes,
      projectFiles: [
        ...state.hashes.projectFiles,
        {
          projectPath: duplicatePath,
          contentHash: state.hashes.projectFiles[0]!.contentHash,
        },
      ],
    }

    expect(() =>
      buildXmlSyncPlan({ structure, hashes, selection: { kind: "all" } })
    ).toThrow("Повторный XML-путь")
  })
})
