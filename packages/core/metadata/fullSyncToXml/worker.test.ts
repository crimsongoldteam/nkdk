import fs from "node:fs"
import os from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { encodeConfigurationIndex } from "../configurationIndex/encode"
import { snapshotConfigurationIndex } from "../configurationIndex/sharedSnapshot"
import { sampleIndex } from "../configurationIndex/testData"
import { hashFileBytes } from "../configurationIndex/hash"
import {
  fullXmlSyncWorkerStateForTests,
  resetFullXmlSyncWorkerStateForTests,
  runFullXmlSyncWorkerCommand,
} from "./worker"
import type { FullXmlSyncAssignment } from "./types"
import { createFullXmlSyncCompositionSnapshot, createFullXmlSyncSharedMetadata } from "./sharedMetadata"

describe("full XML sync worker", () => {
  const tempDirs: string[] = []
  const context = { version: "2.20", defaultLanguage: "ru", exportToYAML: { toTyped: false } } as const

  afterEach(() => {
    resetFullXmlSyncWorkerStateForTests()
    for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
  })

  function createProject(): string {
    const projectDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-full-sync-worker-"))
    tempDirs.push(projectDir)
    fs.mkdirSync(join(projectDir, "Справочник", "Товары"), { recursive: true })
    fs.writeFileSync(
      join(projectDir, "Справочник", "Товары", "Свойства.yaml"),
      ["Реквизиты:", "  Артикул:", "    Тип: Строка"].join("\n")
    )
    return projectDir
  }

  const sharedInputs = (assignments: readonly FullXmlSyncAssignment[]) => ({
    composition: createFullXmlSyncCompositionSnapshot(assignments),
    index: snapshotConfigurationIndex(encodeConfigurationIndex(sampleIndex())),
  })

  it("first pass stores prepared XML without retaining parsed YAML", async () => {
    const projectDir = createProject()
    const sourceProjectPath = "Справочник/Товары/Свойства.yaml"
    const sourcePath = join(projectDir, ...sourceProjectPath.split("/"))

    const assigned = assignment(projectDir, "Товары")
    await runFullXmlSyncWorkerCommand({
      kind: "initialize",
      workerIndex: 0,
      projectDir,
      outputDir: join(projectDir, ".out"),
      context,
      ...sharedInputs([assigned]),
    })
    const result = await runFullXmlSyncWorkerCommand({ kind: "firstPass", assignments: [assigned] })

    expect(result?.kind).toBe("firstPassResult")
    if (result?.kind !== "firstPassResult") throw new Error("unexpected result")
    expect(result.diagnostics).toEqual([])
    expect(result.projectFiles).toEqual([
      { projectPath: sourceProjectPath, contentHash: hashFileBytes(fs.readFileSync(sourcePath)) },
    ])
    expect(result.ownerFacts[0]).toMatchObject({
      assignmentId: sourceProjectPath,
      sourceProjectPath,
      owner: { dir: "Справочник", name: "Товары" },
    })
    expect(result).not.toHaveProperty("yamlFiles")
    expect(result).not.toHaveProperty("data")
    expect(fullXmlSyncWorkerStateForTests()).toMatchObject({
      preparedIds: [sourceProjectPath],
      prepared: [
        {
          id: sourceProjectPath,
          documents: ["Catalogs/Товары.xml"],
          holdsPreparedYamlFile: false,
        },
      ],
    })
  })

  it("keeps processing assignments after an I/O error and does not store the failed one", async () => {
    const projectDir = createProject()
    const assigned = [assignment(projectDir, "Товары"), assignment(projectDir, "НетФайла")]
    await runFullXmlSyncWorkerCommand({
      kind: "initialize",
      workerIndex: 0,
      projectDir,
      outputDir: join(projectDir, ".out"),
      context,
      ...sharedInputs(assigned),
    })
    const result = await runFullXmlSyncWorkerCommand({
      kind: "firstPass",
      assignments: assigned,
    })

    expect(result?.kind).toBe("firstPassResult")
    if (result?.kind !== "firstPassResult") throw new Error("unexpected result")
    expect(result.diagnostics).toEqual([expect.objectContaining({ severity: "error", code: "external-file" })])
    expect(result.projectFiles.map((file) => file.projectPath)).toEqual(["Справочник/Товары/Свойства.yaml"])
    expect(fullXmlSyncWorkerStateForTests().preparedIds).toEqual(["Справочник/Товары/Свойства.yaml"])
  })

  it("clears prepared YAML on dispose and after the phase second pass", async () => {
    const projectDir = createProject()
    const assigned = assignment(projectDir, "Товары")
    await runFullXmlSyncWorkerCommand({
      kind: "initialize",
      workerIndex: 0,
      projectDir,
      outputDir: join(projectDir, ".out"),
      context,
      ...sharedInputs([assigned]),
    })
    await runFullXmlSyncWorkerCommand({ kind: "firstPass", assignments: [assigned] })
    expect(fullXmlSyncWorkerStateForTests().preparedIds).toHaveLength(1)
    fs.rmSync(assigned.sourcePath)

    const second = await runFullXmlSyncWorkerCommand({
      kind: "secondPass",
      sharedMetadata: createFullXmlSyncSharedMetadata({ assignments: [assigned], owners: [] }),
    })

    expect(second).toMatchObject({ kind: "secondPassResult", warnings: [] })
    expect(fs.existsSync(join(projectDir, ".out", "Catalogs", "Товары.xml"))).toBe(true)
    expect(fullXmlSyncWorkerStateForTests().preparedIds).toEqual([])

    await runFullXmlSyncWorkerCommand({ kind: "dispose" })
    expect(fullXmlSyncWorkerStateForTests()).toEqual({ initialized: false, preparedIds: [], prepared: [] })
  })
})

function assignment(projectDir: string, name: string): FullXmlSyncAssignment {
  return {
    id: `Справочник/${name}/Свойства.yaml`,
    sourceProjectPath: `Справочник/${name}/Свойства.yaml`,
    sourcePath: join(projectDir, "Справочник", name, "Свойства.yaml"),
    role: "properties",
    itemType: "MetadataCatalog",
    itemName: name,
    logicalAddress: `Справочник.${name}`,
    outputs: [{ routeKind: "owner", targetXmlPath: `Catalogs/${name}.xml` }],
  }
}
