import fs from "node:fs"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { encodeConfigurationIndex } from "../configurationIndex/encode"
import { configurationIndexPath, writeConfigurationIndexAtomically } from "../configurationIndex/fileIO"
import { snapshotConfigurationIndex } from "../configurationIndex/sharedSnapshot"
import { sampleIndex } from "../configurationIndex/testData"
import type { ConfigurationIndexData } from "../configurationIndex/types"
import type { ConfigurationContext } from "../context/types"
import { syncConfigurationToXml, type FullXmlSyncCoordinatorDependencies } from "./syncConfiguration"
import type { FullXmlSyncWorkerPool } from "./workerPool"
import {
  createDirectFullSyncDependencies,
  createTempRoot,
  removeFullSyncTempDirs,
  writeSmallYamlProjectWithIndex,
} from "./testHelpers"

afterEach(async () => {
  await removeFullSyncTempDirs()
})

describe("full XML sync failure integration", () => {
  const context = { version: "2.20", defaultLanguage: "ru", exportToYAML: { toTyped: false } } as ConfigurationContext

  it("does not touch a non-empty XML target", async () => {
    const root = createTempRoot()
    const projectDir = join(root, "project")
    const xmlDir = join(root, "xml")
    fs.mkdirSync(projectDir, { recursive: true })
    fs.mkdirSync(xmlDir, { recursive: true })
    fs.writeFileSync(join(xmlDir, "marker.txt"), "keep")

    const result = await syncConfigurationToXml({ context, yamlDir: projectDir, xmlDir })

    expect(result.failed).toEqual([expect.objectContaining({ code: "full_xml_sync_target_not_empty" })])
    expect(fs.readFileSync(join(xmlDir, "marker.txt"), "utf8")).toBe("keep")
  })

  it("keeps the previous index when transfer fails after workers wrote partial XML", async () => {
    const root = createTempRoot()
    const projectDir = join(root, "project")
    const xmlDir = join(root, "xml")
    fs.mkdirSync(projectDir, { recursive: true })
    fs.mkdirSync(xmlDir, { recursive: true })
    const previous = sampleIndex()
    await writeConfigurationIndexAtomically({ projectDir, address: { kind: "configuration" }, data: previous })
    const before = fs.readFileSync(configurationIndexPath(projectDir, { kind: "configuration" }))

    const result = await syncConfigurationToXml({ context, yamlDir: projectDir, xmlDir }, transferFailureDeps(previous))

    expect(result.failed).toEqual([expect.objectContaining({ code: "full_xml_sync_operation_failed" })])
    expect(fs.readFileSync(join(xmlDir, "partial.xml"), "utf8")).toBe("partial")
    expect(fs.readFileSync(configurationIndexPath(projectDir, { kind: "configuration" }))).toEqual(before)
  })

  it("does not start XML writes or update the index after a first-pass preparation error", async () => {
    const root = createTempRoot()
    const projectDir = join(root, "project")
    const xmlDir = join(root, "xml")
    fs.mkdirSync(projectDir, { recursive: true })
    fs.mkdirSync(xmlDir, { recursive: true })
    let secondPassCalled = false
    let writeIndexCalled = false
    const deps: FullXmlSyncCoordinatorDependencies = {
      ...transferFailureDeps(sampleIndex()),
      createWorkerPool: () => ({
        async initialize() {},
        async runFirstPass() {
          return {
            diagnostics: [
              {
                severity: "error",
                code: "full_xml_sync_first_pass_failed",
                message: "Не удалось связать XML",
              },
            ],
            projectFiles: [],
            ownerFacts: [],
          }
        },
        async runSecondPass() {
          secondPassCalled = true
          throw new Error("Второй проход не должен запускаться")
        },
        async close() {},
      }),
      async writeIndex() {
        writeIndexCalled = true
      },
    }

    const result = await syncConfigurationToXml({ context, yamlDir: projectDir, xmlDir }, deps)

    expect(result.failed).toEqual([
      expect.objectContaining({ code: "full_xml_sync_first_pass_failed" }),
    ])
    expect(fs.readdirSync(xmlDir)).toEqual([])
    expect(secondPassCalled).toBe(false)
    expect(writeIndexCalled).toBe(false)
  })

  it("rejects configuration extension sync before creating XML output or changing the cf snapshot", async () => {
    const projectDir = createTempRoot()
    const componentDir = join(projectDir, "cfe", "Расширение")
    const xmlDir = join(projectDir, "xml")
    await writeSmallYamlProjectWithIndex(componentDir)
    fs.renameSync(join(componentDir, ".nkdk"), join(projectDir, ".nkdk"))
    const cfSnapshotPath = configurationIndexPath(projectDir, { kind: "configuration" })
    const cfSnapshotBefore = fs.readFileSync(cfSnapshotPath)

    const result = await syncConfigurationToXml(
      {
        context,
        projectDir,
        componentPath: "cfe/Расширение",
        yamlDir: componentDir,
        xmlDir,
        concurrency: 1,
      },
      createDirectFullSyncDependencies()
    )

    expect(result.failed).toEqual([
      expect.objectContaining({ code: "full_xml_sync_component_not_supported" }),
    ])
    expect(fs.existsSync(xmlDir)).toBe(false)
    expect(fs.readFileSync(cfSnapshotPath)).toEqual(cfSnapshotBefore)
  })
})

function transferFailureDeps(previous: ConfigurationIndexData): FullXmlSyncCoordinatorDependencies {
  return {
    async exists() {
      return true
    },
    async isDirectoryEmpty() {
      return true
    },
    async mkdir() {},
    async discover() {
      return {
        assignments: [
          {
            id: "Конфигурация.yaml",
            sourceProjectPath: "Конфигурация.yaml",
            sourcePath: "Конфигурация.yaml",
            role: "configuration",
            itemType: "MetadataConfiguration",
            itemName: "Конфигурация",
            logicalAddress: "Конфигурация",
            outputs: [{ routeKind: "owner", targetXmlPath: "partial.xml" }],
          },
        ],
        externalFiles: [],
      }
    },
    async readIndexSnapshot() {
      return snapshotConfigurationIndex(encodeConfigurationIndex(previous))
    },
    createWorkerPool() {
      return fakePartialWorkerPool()
    },
    createSharedMetadata() {
      return {} as never
    },
    async transferExternalFiles() {
      throw new Error("copy failed")
    },
    async writeConfigDumpInfo() {
      throw new Error("must not be called")
    },
    async writeIndex() {
      throw new Error("must not be called")
    },
  }
}

function fakePartialWorkerPool(): FullXmlSyncWorkerPool {
  let outputDir = ""
  return {
    async initialize(params) {
      outputDir = params.outputDir
    },
    async runFirstPass() {
      return {
        diagnostics: [],
        projectFiles: [{ projectPath: "Конфигурация.yaml", contentHash: 1n }],
        ownerFacts: [],
      }
    },
    async runSecondPass() {
      fs.writeFileSync(join(outputDir, "partial.xml"), "partial")
      return {
        diagnostics: [],
        warnings: [],
        writtenFiles: [{ assignmentId: "Конфигурация.yaml", targetXmlPath: "partial.xml" }],
        fragmentData: {
          identities: [],
          xmlNodes: [],
          xmlValues: [],
        },
      }
    },
    async close() {},
  }
}
