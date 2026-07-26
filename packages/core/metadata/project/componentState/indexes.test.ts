import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { mockContext } from "../../../tests/mockContext"
import { encodeConfigurationIndex } from "../../configurationIndex/encode"
import { snapshotConfigurationIndex } from "../../configurationIndex/sharedSnapshot"
import { sampleIndex } from "../../configurationIndex/testData"
import { createEmptyPersistedSharedValidationSnapshot } from "../../validation/persistedSharedValidationSnapshot"
import type { ComponentProjectStructure } from "./types"
import { readComponentIndexes } from "./indexes"
import { readComponentHashState } from "./hashes"
import { readComponentProjectStructure } from "./structure"

describe("component indexes", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  it("restores component-local indexes only from a snapshot with the same hashes", async () => {
    const projectFiles = [{ projectPath: "Конфигурация.yaml", contentHash: 42n }]
    const data = {
      ...sampleIndex(),
      projectFiles,
      localIndexes: {
        metadata: createEmptyPersistedSharedValidationSnapshot(),
        dependencies: [],
        logicalAddresses: [
          { logicalAddress: "Конфигурация", sourceProjectPath: "Конфигурация.yaml" },
        ],
      },
    }
    const structure = {
      address: { kind: "configuration" },
      componentPath: "cf",
      componentDir: "/project/cf",
      topology: {} as ComponentProjectStructure["topology"],
      resources: [],
      projectPaths: ["Конфигурация.yaml"],
    } satisfies ComponentProjectStructure

    const indexes = await readComponentIndexes({
      structure,
      hashes: { componentPath: "cf", projectFiles },
      context: mockContext,
      snapshot: snapshotConfigurationIndex(encodeConfigurationIndex(data)),
    })

    expect(indexes.sourceProjectFiles).toEqual(projectFiles)
    expect(indexes.dependencies).toEqual([])
    expect(indexes.logicalAddresses).toEqual(data.localIndexes.logicalAddresses)
  })

  it("rebuilds indexes from current YAML when snapshot hashes differ", async () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-component-indexes-"))
    tempDirs.push(projectDir)
    const filePath = join(projectDir, "cf", "Конфигурация.yaml")
    mkdirSync(join(filePath, ".."), { recursive: true })
    writeFileSync(filePath, "Имя: Конфигурация\n")
    const structure = await readComponentProjectStructure({
      projectDir,
      address: { kind: "configuration" },
    })
    const hashes = await readComponentHashState({ structure })

    const indexes = await readComponentIndexes({
      structure,
      hashes,
      context: mockContext,
      snapshot: snapshotConfigurationIndex(encodeConfigurationIndex(sampleIndex())),
    })

    expect(indexes.sourceProjectFiles).toEqual(hashes.projectFiles)
    expect(indexes.logicalAddresses).toEqual([
      { logicalAddress: "Конфигурация", sourceProjectPath: "Конфигурация.yaml" },
    ])
  })

  it("rebuilds canonical addresses of child metadata from current YAML", async () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-component-child-indexes-"))
    tempDirs.push(projectDir)
    const filePath = join(projectDir, "cf", "Справочник", "Товары", "Свойства.yaml")
    mkdirSync(join(filePath, ".."), { recursive: true })
    writeFileSync(filePath, [
      "Реквизиты:",
      "  Артикул:",
      "    Тип: Строка",
      "",
    ].join("\n"))
    const structure = await readComponentProjectStructure({
      projectDir,
      address: { kind: "configuration" },
    })
    const hashes = await readComponentHashState({ structure })

    const indexes = await readComponentIndexes({
      structure,
      hashes,
      context: mockContext,
    })

    expect(indexes.logicalAddresses).toContainEqual({
      logicalAddress: "Catalog.Товары.Attribute.Артикул",
      sourceProjectPath: "Справочник/Товары/Свойства.yaml",
    })
  })
})
