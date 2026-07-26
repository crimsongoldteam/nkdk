import fs from "node:fs"
import os from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { encodeConfigurationIndex } from "../configurationIndex/encode"
import { hashFileBytes } from "../configurationIndex/hash"
import { snapshotConfigurationIndex } from "../configurationIndex/sharedSnapshot"
import { sampleIndex } from "../configurationIndex/testData"
import { createSharedValidationSnapshot } from "../validation/sharedValidationSnapshot"
import { createFullXmlSyncCompositionSnapshot } from "./sharedMetadata"
import { fullXmlSyncTestTopologyFields } from "./testTopology"
import type { FullXmlSyncAssignment } from "./types"
import {
  fullXmlSyncWorkerStateForTests,
  resetFullXmlSyncWorkerStateForTests,
  runFullXmlSyncWorkerCommand,
} from "./worker"

describe("full XML sync worker", () => {
  const tempDirs: string[] = []
  const context = {
    version: "2.20",
    defaultLanguage: "ru",
    exportToYAML: { toTyped: false },
  } as const
  const localMetadata = createSharedValidationSnapshot({ records: [], filePaths: [] })

  afterEach(() => {
    resetFullXmlSyncWorkerStateForTests()
    for (const dir of tempDirs.splice(0)) {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })

  it("prepares and writes every assignment without retaining its YAML or XML", async () => {
    const projectDir = createProject(["Товары"])
    const assigned = assignment(projectDir, "Товары")
    await initialize(projectDir, [assigned])

    const result = await runFullXmlSyncWorkerCommand({
      kind: "execute",
      assignments: [assigned],
    })

    expect(result).toMatchObject({
      kind: "executionResult",
      diagnostics: [],
      warnings: [],
      writtenFiles: [{ targetXmlPath: "Catalogs/Товары.xml" }],
    })
    expect(fs.existsSync(join(projectDir, ".out", "Catalogs", "Товары.xml"))).toBe(true)
    expect(fullXmlSyncWorkerStateForTests()).toMatchObject({
      initialized: true,
      componentDir: projectDir,
      importProjectDir: projectDir,
    })
    expect(fullXmlSyncWorkerStateForTests()).not.toHaveProperty("activeAssignmentId")
    expect(fullXmlSyncWorkerStateForTests()).not.toHaveProperty("preparedIds")
  })

  it("keeps an already written XML and stops when the next YAML hash changed", async () => {
    const projectDir = createProject(["Первый", "Второй"])
    const assignments = [
      assignment(projectDir, "Первый"),
      assignment(projectDir, "Второй"),
    ]
    await initialize(projectDir, assignments)
    fs.writeFileSync(assignments[1]!.sourcePath, "Имя: Изменён\n")

    const result = await runFullXmlSyncWorkerCommand({
      kind: "execute",
      assignments,
    })

    expect(result?.kind).toBe("executionResult")
    if (result?.kind !== "executionResult") throw new Error("unexpected result")
    expect(result.diagnostics).toContainEqual(expect.objectContaining({
      code: "full_xml_sync_source_changed",
      sourceProjectPath: assignments[1]!.sourceProjectPath,
    }))
    expect(fs.existsSync(join(projectDir, ".out", "Catalogs", "Первый.xml"))).toBe(true)
    expect(fs.existsSync(join(projectDir, ".out", "Catalogs", "Второй.xml"))).toBe(false)
    expect(fullXmlSyncWorkerStateForTests()).not.toHaveProperty("activeAssignmentId")
  })

  it("releases all state on dispose", async () => {
    const projectDir = createProject(["Товары"])
    const assigned = assignment(projectDir, "Товары")
    await initialize(projectDir, [assigned])

    await runFullXmlSyncWorkerCommand({ kind: "dispose" })

    expect(fullXmlSyncWorkerStateForTests()).toEqual({ initialized: false })
  })

  function createProject(names: readonly string[]): string {
    const projectDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-full-sync-worker-"))
    tempDirs.push(projectDir)
    for (const name of names) {
      const dir = join(projectDir, "Справочник", name)
      fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(join(dir, "Свойства.yaml"), `Имя: ${name}\n`)
    }
    return projectDir
  }

  async function initialize(
    projectDir: string,
    assignments: readonly FullXmlSyncAssignment[]
  ): Promise<void> {
    await runFullXmlSyncWorkerCommand({
      kind: "initialize",
      workerIndex: 0,
      componentDir: projectDir,
      outputDir: join(projectDir, ".out"),
      context,
      profile: {
        kind: "configuration",
        componentKind: "configuration",
        adoptedUuids: {},
      },
      composition: createFullXmlSyncCompositionSnapshot(assignments),
      targetIndex: snapshotConfigurationIndex(
        encodeConfigurationIndex(sampleIndex())
      ),
      localMetadata,
    })
  }
})

function assignment(projectDir: string, name: string): FullXmlSyncAssignment {
  const sourcePath = join(projectDir, "Справочник", name, "Свойства.yaml")
  return {
    id: `Справочник/${name}/Свойства.yaml`,
    sourceProjectPath: `Справочник/${name}/Свойства.yaml`,
    sourcePath,
    expectedContentHash: hashFileBytes(fs.readFileSync(sourcePath)),
    role: "properties",
    itemType: "MetadataCatalog",
    itemName: name,
    logicalAddress: `Справочник.${name}`,
    ...fullXmlSyncTestTopologyFields(`Справочник/${name}/Свойства.yaml`),
  }
}
