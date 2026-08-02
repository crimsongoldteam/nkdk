import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { hashConfigurationProjectFileList } from "../../configurationIndex"
import { readComponentIndexes } from "./indexes"
import { readComponentProjectStructure } from "./structure"

describe("component indexes", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    let dir: string | undefined
    while ((dir = tempDirs.pop()) !== undefined) {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("projects sync logical addresses from topology without validation facts", async () => {
    const { structure, hashes } = await indexedProject(
      "Справочник/Товары/Свойства.yaml",
      "Реквизиты: {}\n",
    )

    const indexes = await readComponentIndexes({
      structure,
      hashes,
    })

    expect(indexes.sourceProjectFiles).toEqual(hashes.projectFiles)
    expect(indexes.logicalAddresses).toEqual([
      {
        logicalAddress: "Справочник.Товары",
        sourceProjectPath: "Справочник/Товары/Свойства.yaml",
      },
    ])
  })

  it("builds indexes from the current root YAML", async () => {
    const { structure, hashes } = await indexedProject("Конфигурация.yaml", "Имя: Конфигурация\n")

    const indexes = await readComponentIndexes({
      structure,
      hashes,
    })

    expect(indexes.sourceProjectFiles).toEqual(hashes.projectFiles)
    expect(indexes.logicalAddresses).toEqual([
      { logicalAddress: "Конфигурация", sourceProjectPath: "Конфигурация.yaml" },
    ])
  })

  it("does not rebuild child validation addresses from YAML", async () => {
    const { structure, hashes } = await indexedProject(
      "Справочник/Товары/Свойства.yaml",
      ["Реквизиты:", "  Артикул:", "    Тип: Строка", ""].join("\n"),
    )

    const indexes = await readComponentIndexes({
      structure,
      hashes,
    })

    expect(indexes.logicalAddresses).toEqual([{ logicalAddress: "Справочник.Товары", sourceProjectPath: "Справочник/Товары/Свойства.yaml" }])
  })

  async function indexedProject(projectPath: string, content: string) {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-component-indexes-"))
    tempDirs.push(projectDir)
    const filePath = join(projectDir, "cf", ...projectPath.split("/"))
    mkdirSync(join(filePath, ".."), { recursive: true })
    writeFileSync(filePath, content)
    const structure = await readComponentProjectStructure({ projectDir, address: { kind: "configuration" } })
    return { structure, hashes: await hashState(structure) }
  }
})

async function hashState(structure: Awaited<ReturnType<typeof readComponentProjectStructure>>) {
  return {
    componentPath: structure.componentPath,
    projectFiles: await hashConfigurationProjectFileList(structure.componentDir, structure.projectPaths),
  }
}
