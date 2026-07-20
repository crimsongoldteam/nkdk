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
import { createTempRoot, removeFullSyncTempDirs } from "./testHelpers"

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
    await writeConfigurationIndexAtomically({ projectDir, data: previous })
    const before = fs.readFileSync(configurationIndexPath(projectDir))

    const result = await syncConfigurationToXml({ context, yamlDir: projectDir, xmlDir }, transferFailureDeps(previous))

    expect(result.failed).toEqual([expect.objectContaining({ code: "full_xml_sync_operation_failed" })])
    expect(fs.readFileSync(join(xmlDir, "partial.xml"), "utf8")).toBe("partial")
    expect(fs.readFileSync(configurationIndexPath(projectDir))).toEqual(before)
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
            outputs: [{ routeKind: "owner", targetXmlPath: "Configuration.xml" }],
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
