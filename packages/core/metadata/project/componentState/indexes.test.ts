import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { mockContext } from "../../../tests/mockContext"
import { createPreparedYamlWorkerThreadPoolFactory } from "../../../tests/preparedYamlWorkerTestPool"
import type { PreparedYamlProjectWorkerTask } from "../preparedYamlProjectWorker"
import { readComponentIndexes } from "./indexes"
import { readComponentHashState } from "./hashes"
import { readComponentProjectStructure } from "./structure"

describe("component indexes", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  it("always builds indexes from current topology and YAML", async () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-component-indexes-cold-"))
    tempDirs.push(projectDir)
    const filePath = join(projectDir, "cf", "Справочник", "Товары", "Свойства.yaml")
    mkdirSync(join(filePath, ".."), { recursive: true })
    writeFileSync(filePath, "Реквизиты: {}\n")
    const structure = await readComponentProjectStructure({
      projectDir,
      address: { kind: "configuration" },
    })
    const hashes = await readComponentHashState({ structure })
    const run = vi.fn(async (task: PreparedYamlProjectWorkerTask) => {
      if (task.kind !== "collectValidationFacts") {
        throw new Error(`Неожиданное задание worker: ${task.kind}`)
      }
      return {
        kind: "collectValidationFactsResult" as const,
        contribution: {
          objectRecords: [],
          objectIndexEntries: [],
          memberIndexEntries: [],
          valueIndexEntries: [],
          pendingReferences: [],
          localDependencies: [],
          logicalAddresses: [
            {
              logicalAddress: "Catalog.Товары.Attribute.Артикул",
              sourceProjectPath: "Справочник/Товары/Свойства.yaml",
            },
          ],
        },
      }
    })
    const destroy = vi.fn(async () => undefined)
    const createWorkerPool = vi.fn(() => ({ run, destroy }))

    const indexes = await readComponentIndexes({
      structure,
      hashes,
      context: mockContext,
      createWorkerPool,
    })

    expect(createWorkerPool).toHaveBeenCalledOnce()
    expect(run).toHaveBeenCalledOnce()
    expect(destroy).toHaveBeenCalledOnce()
    expect(indexes.sourceProjectFiles).toEqual(hashes.projectFiles)
    expect(indexes.logicalAddresses).toEqual([
      {
        logicalAddress: "Справочник.Товары",
        sourceProjectPath: "Справочник/Товары/Свойства.yaml",
      },
      {
        logicalAddress: "Catalog.Товары.Attribute.Артикул",
        sourceProjectPath: "Справочник/Товары/Свойства.yaml",
      },
    ])
  })

  it("builds indexes from the current root YAML", async () => {
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
      createWorkerPool: createPreparedYamlWorkerThreadPoolFactory(),
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
    writeFileSync(filePath, ["Реквизиты:", "  Артикул:", "    Тип: Строка", ""].join("\n"))
    const structure = await readComponentProjectStructure({
      projectDir,
      address: { kind: "configuration" },
    })
    const hashes = await readComponentHashState({ structure })

    const indexes = await readComponentIndexes({
      structure,
      hashes,
      context: mockContext,
      createWorkerPool: createPreparedYamlWorkerThreadPoolFactory(),
    })

    expect(indexes.logicalAddresses).toContainEqual({
      logicalAddress: "Catalog.Товары.Attribute.Артикул",
      sourceProjectPath: "Справочник/Товары/Свойства.yaml",
    })
  })
})
