import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { hashConfigurationProjectFileList } from "../../configurationIndex"
import { readComponentIndexes } from "./indexes"
import { collectComponentLogicalAddresses } from "./logicalAddresses"
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

    const indexes = await readIndexes(structure, hashes)

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

    const indexes = await readIndexes(structure, hashes)

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

    const indexes = await readIndexes(structure, hashes)

    expect(indexes.logicalAddresses).toEqual([{ logicalAddress: "Справочник.Товары", sourceProjectPath: "Справочник/Товары/Свойства.yaml" }])
  })

  it("adds nested logical addresses from paged project state without reading YAML", async () => {
    const projectPath = "Справочник/Товары/Свойства.yaml"
    const { structure, hashes } = await indexedProject(projectPath, "Имя: Товары\n")
    const cursors: Array<string | undefined> = []
    const params = {
      structure,
      hashes,
      projectStateReadSession: {
        readComponentTargetPage(query: { componentPath: string; cursor?: string }) {
          cursors.push(query.cursor)
          return query.cursor === undefined
            ? {
                entries: [{ logicalAddress: "Catalog.Товары", sourceProjectPath: `cf/${projectPath}` }],
                nextCursor: "Catalog.Товары",
              }
            : {
                entries: [{
                  logicalAddress: "Catalog.Товары.Attribute.Артикул",
                  sourceProjectPath: `cf/${projectPath}`,
                }],
              }
        },
      },
    }

    const indexes = await readComponentIndexes(params)

    expect(cursors).toEqual([undefined, "Catalog.Товары"])
    expect(indexes.logicalAddresses).toEqual([
      { logicalAddress: "Справочник.Товары", sourceProjectPath: projectPath },
      { logicalAddress: "Catalog.Товары", sourceProjectPath: projectPath },
      { logicalAddress: "Catalog.Товары.Attribute.Артикул", sourceProjectPath: projectPath },
    ])
  })

  it("collects paged component addresses and keeps the first duplicate", () => {
    const projectPath = "Справочник/Товары/Свойства.yaml"
    const cursors: Array<string | undefined> = []

    const addresses = collectComponentLogicalAddresses({
      componentPath: "cfe/Дополнение",
      known: [{ logicalAddress: "Catalog.Товары", sourceProjectPath: projectPath }],
      projectStateReadSession: {
        readComponentTargetPage(query) {
          cursors.push(query.cursor)
          return query.cursor === undefined
            ? {
                entries: [{
                  logicalAddress: "Catalog.Товары",
                  sourceProjectPath: `cfe/Дополнение/${projectPath}`,
                }],
                nextCursor: "Catalog.Товары",
              }
            : {
                entries: [{
                  logicalAddress: "Catalog.Товары.Attribute.Артикул",
                  sourceProjectPath: `cfe/Дополнение/${projectPath}`,
                }],
              }
        },
      },
    })

    expect(cursors).toEqual([undefined, "Catalog.Товары"])
    expect(addresses).toEqual([
      { logicalAddress: "Catalog.Товары", sourceProjectPath: projectPath },
      {
        logicalAddress: "Catalog.Товары.Attribute.Артикул",
        sourceProjectPath: projectPath,
      },
    ])
  })

  it("rejects a ProjectState address from another component", () => {
    expect(() => collectComponentLogicalAddresses({
      componentPath: "cfe/Дополнение",
      known: [],
      projectStateReadSession: {
        readComponentTargetPage: () => ({
          entries: [{
            logicalAddress: "Catalog.Товары",
            sourceProjectPath: "cf/Справочник/Товары/Свойства.yaml",
          }],
        }),
      },
    })).toThrow("Адрес ProjectState относится к другому компоненту: cf/Справочник/Товары/Свойства.yaml")
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

function readIndexes(
  structure: Awaited<ReturnType<typeof readComponentProjectStructure>>,
  hashes: Awaited<ReturnType<typeof hashState>>,
) {
  return readComponentIndexes({
    structure,
    hashes,
    projectStateReadSession: { readComponentTargetPage: () => ({ entries: [] }) },
  })
}
