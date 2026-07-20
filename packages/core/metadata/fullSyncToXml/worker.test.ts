import fs from "node:fs"
import os from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { hashFileBytes } from "../configurationIndex/hash"
import {
  fullXmlSyncWorkerStateForTests,
  resetFullXmlSyncWorkerStateForTests,
  runFullXmlSyncWorkerCommand,
} from "./worker"
import type { FullXmlSyncAssignment } from "./types"

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

  it("first pass stores parsed YAML in worker state and returns only compact facts", async () => {
    const projectDir = createProject()
    const sourceProjectPath = "Справочник/Товары/Свойства.yaml"
    const sourcePath = join(projectDir, ...sourceProjectPath.split("/"))

    await runFullXmlSyncWorkerCommand({
      kind: "initialize",
      workerIndex: 0,
      projectDir,
      outputDir: join(projectDir, ".out"),
      context,
    })
    const result = await runFullXmlSyncWorkerCommand({ kind: "firstPass", assignments: [assignment(projectDir, "Товары")] })

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
    expect(fullXmlSyncWorkerStateForTests().preparedIds).toEqual([sourceProjectPath])
  })

  it("keeps processing assignments after an I/O error and does not store the failed one", async () => {
    const projectDir = createProject()
    await runFullXmlSyncWorkerCommand({
      kind: "initialize",
      workerIndex: 0,
      projectDir,
      outputDir: join(projectDir, ".out"),
      context,
    })
    const result = await runFullXmlSyncWorkerCommand({
      kind: "firstPass",
      assignments: [assignment(projectDir, "Товары"), assignment(projectDir, "НетФайла")],
    })

    expect(result?.kind).toBe("firstPassResult")
    if (result?.kind !== "firstPassResult") throw new Error("unexpected result")
    expect(result.diagnostics).toEqual([expect.objectContaining({ severity: "error", code: "external-file" })])
    expect(result.projectFiles.map((file) => file.projectPath)).toEqual(["Справочник/Товары/Свойства.yaml"])
    expect(fullXmlSyncWorkerStateForTests().preparedIds).toEqual(["Справочник/Товары/Свойства.yaml"])
  })

  it("clears prepared YAML on dispose and after the phase second pass", async () => {
    const projectDir = createProject()
    await runFullXmlSyncWorkerCommand({
      kind: "initialize",
      workerIndex: 0,
      projectDir,
      outputDir: join(projectDir, ".out"),
      context,
    })
    await runFullXmlSyncWorkerCommand({ kind: "firstPass", assignments: [assignment(projectDir, "Товары")] })
    expect(fullXmlSyncWorkerStateForTests().preparedIds).toHaveLength(1)

    const second = await runFullXmlSyncWorkerCommand({
      kind: "secondPass",
      sharedMetadata: { owners: {} as never, composition: {} as never },
      index: {} as never,
      generationSeed: new Uint8Array(),
    })

    expect(second).toEqual({ kind: "secondPassResult", diagnostics: [], warnings: [], writtenFiles: [] })
    expect(fullXmlSyncWorkerStateForTests().preparedIds).toEqual([])

    await runFullXmlSyncWorkerCommand({ kind: "dispose" })
    expect(fullXmlSyncWorkerStateForTests()).toEqual({ initialized: false, preparedIds: [] })
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
