import fs from "node:fs"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { encodeConfigurationIndex } from "../configurationIndex/encode"
import {
  configurationIndexPath,
  writeConfigurationIndexAtomically,
} from "../configurationIndex/fileIO"
import { snapshotConfigurationIndex } from "../configurationIndex/sharedSnapshot"
import { entity } from "../configurationIndex/testData"
import type { ConfigurationSnapshot } from "../configurationIndex/types"
import type { ConfigurationContext } from "../context/types"
import { createSharedValidationSnapshot } from "../validation/sharedValidationSnapshot"
import { compileRegisteredMetadataResourceTopology } from "../resourceTopology/registry"
import {
  syncComponentToXml,
  type FullXmlSyncCoordinatorDependencies,
} from "./syncConfiguration"
import {
  createTempRoot,
  removeFullSyncTempDirs,
} from "./testHelpers"
import { fullXmlSyncTestOutput } from "./testTopology"

afterEach(async () => {
  await removeFullSyncTempDirs()
})

describe("full XML sync failure integration", () => {
  const context = {
    version: "2.20",
    defaultLanguage: "ru",
    exportToYAML: { toTyped: false },
  } as ConfigurationContext

  it("does not touch a non-empty XML target", async () => {
    const root = createTempRoot()
    const xmlDir = join(root, "xml")
    fs.mkdirSync(xmlDir, { recursive: true })
    fs.writeFileSync(join(xmlDir, "marker.txt"), "keep")

    const result = await syncComponentToXml({
      context,
      projectDir: root,
      componentPath: "cf",
      xmlDir,
    })

    expect(result.failed).toEqual([
      expect.objectContaining({ code: "full_xml_sync_target_not_empty" }),
    ])
    expect(fs.readFileSync(join(xmlDir, "marker.txt"), "utf8")).toBe("keep")
  })

  it("keeps written XML but preserves the previous snapshot when transfer fails", async () => {
    const state = await createIndexedProject()
    const before = fs.readFileSync(state.indexPath)
    const deps = failureDeps(state.previous, state.projectDir, state.xmlDir)

    const result = await syncComponentToXml({
      context,
      projectDir: state.projectDir,
      componentPath: "cf",
      xmlDir: state.xmlDir,
    }, deps)

    expect(result.failed).toEqual([
      expect.objectContaining({ code: "full_xml_sync_operation_failed" }),
    ])
    expect(fs.readFileSync(join(state.xmlDir, "partial.xml"), "utf8"))
      .toBe("partial")
    expect(fs.readFileSync(state.indexPath)).toEqual(before)
  })

  it("does not transfer files or update the snapshot after a worker error", async () => {
    const state = await createIndexedProject()
    const before = fs.readFileSync(state.indexPath)
    let transferred = false
    let written = false
    const baseDeps = failureDeps(state.previous, state.projectDir, state.xmlDir)
    const deps: FullXmlSyncCoordinatorDependencies = {
      ...baseDeps,
      createWorkerPool: () => ({
        async initialize() {},
        async execute() {
          return {
            warnings: [],
            diagnostics: [{
              severity: "error" as const,
              code: "full_xml_sync_assignment_failed",
              message: "Не удалось построить XML",
            }],
            writtenFiles: [],
            expectedOutputs: [],
            fragmentData: { sourceProjectPaths: [], entities: [] },
          }
        },
        async close() {},
      }),
      async transferExternalFiles() {
        transferred = true
        return { copiedFiles: [], projectFiles: [] }
      },
      async writeIndex() {
        written = true
      },
    }

    const result = await syncComponentToXml({
      context,
      projectDir: state.projectDir,
      componentPath: "cf",
      xmlDir: state.xmlDir,
    }, deps)

    expect(result.failed).toEqual([
      expect.objectContaining({ code: "full_xml_sync_assignment_failed" }),
    ])
    expect(transferred).toBe(false)
    expect(written).toBe(false)
    expect(fs.readFileSync(state.indexPath)).toEqual(before)
  })

  it("сохраняет прежние байты снимка при ошибке проверки результата", async () => {
    const state = await createIndexedProject()
    const before = fs.readFileSync(state.indexPath)
    const baseDeps = failureDeps(state.previous, state.projectDir, state.xmlDir)
    const deps: FullXmlSyncCoordinatorDependencies = {
      ...baseDeps,
      async transferExternalFiles() {
        return { copiedFiles: [], projectFiles: [] }
      },
      validateWrittenFiles() {
        return [{
          severity: "error",
          code: "full_xml_sync_output_invalid",
          message: "Некорректный результат",
        }]
      },
    }

    const result = await syncComponentToXml({
      context,
      projectDir: state.projectDir,
      componentPath: "cf",
      xmlDir: state.xmlDir,
    }, deps)

    expect(result.failed).toEqual([
      expect.objectContaining({ code: "full_xml_sync_output_invalid" }),
    ])
    expect(fs.readFileSync(state.indexPath)).toEqual(before)
  })

  it("does not start workers when cfe confirmation cannot find an adopted UUID", async () => {
    const state = await createIndexedProject()
    let workerCreated = false
    const baseDeps = failureDeps(state.previous, state.projectDir, state.xmlDir)
    const deps: FullXmlSyncCoordinatorDependencies = {
      ...baseDeps,
      resolveProfile: () => ({
        kind: "configurationExtension",
        supports: () => true,
        baseAddress: () => ({ kind: "configuration" }),
        confirm() {
          throw new Error("Не найден UUID заимствованного элемента")
        },
      }),
      createWorkerPool: () => {
        workerCreated = true
        throw new Error("worker must not be created")
      },
    }

    const result = await syncComponentToXml({
      context,
      projectDir: state.projectDir,
      componentPath: "cfe/Дополнение",
      xmlDir: state.xmlDir,
    }, deps)

    expect(result.failed).toEqual([
      expect.objectContaining({
        message: "Не найден UUID заимствованного элемента",
      }),
    ])
    expect(workerCreated).toBe(false)
  })
})

async function createIndexedProject() {
  const projectDir = createTempRoot()
  const xmlDir = join(projectDir, "xml")
  fs.mkdirSync(xmlDir)
  const previous: ConfigurationSnapshot = {
    specificationVersion: "1.3",
    indexGeneration: 1n,
    componentPath: "cf",
    files: [
      { projectPath: "Конфигурация.yaml", contentHash: 10n },
      { projectPath: "Модуль.bsl", contentHash: 20n },
    ],
    entities: [
      entity("СтароеСостояние", "Конфигурация.yaml"),
      entity("ВнешнееСостояние", "Модуль.bsl"),
    ],
  }
  await writeConfigurationIndexAtomically({
    projectDir,
    address: { kind: "configuration" },
    data: previous,
  })
  await writeConfigurationIndexAtomically({
    projectDir,
    address: { kind: "configurationExtension", name: "Дополнение" },
    data: {
      ...previous,
      componentPath: "cfe/Дополнение",
    },
  })
  return {
    projectDir,
    xmlDir,
    previous,
    indexPath: configurationIndexPath(projectDir, { kind: "configuration" }),
  }
}

function failureDeps(
  previous: ConfigurationSnapshot,
  projectDir: string,
  xmlDir: string
): FullXmlSyncCoordinatorDependencies {
  const topology = compileRegisteredMetadataResourceTopology()
  const metadata = createSharedValidationSnapshot({ records: [], filePaths: [] })
  const deps: FullXmlSyncCoordinatorDependencies = {
    async exists(path) {
      return path === projectDir || path === xmlDir
    },
    async isDirectoryEmpty() {
      return true
    },
    async mkdir() {},
    async readStructure({ address }) {
      const componentPath =
        address.kind === "configuration" ? "cf" : `cfe/${address.name}`
      return {
        address,
        componentPath,
        componentDir: join(projectDir, componentPath),
        topology,
        resources: [],
        projectPaths: ["Конфигурация.yaml"],
      }
    },
    async readSnapshot({ address }) {
      return snapshotConfigurationIndex(encodeConfigurationIndex({
        ...previous,
        componentPath:
          address.kind === "configuration" ? "cf" : `cfe/${address.name}`,
      }))
    },
    async readHashes({ structure }) {
      return {
        componentPath: structure.componentPath,
        projectFiles: [{ projectPath: "Конфигурация.yaml", contentHash: 10n }],
      }
    },
    async readIndexes({ structure, hashes }) {
      return {
        componentPath: structure.componentPath,
        sourceProjectFiles: hashes.projectFiles,
        metadata,
        dependencies: [],
        logicalAddresses: [],
      }
    },
    confirmState(params) {
      return Object.freeze(params)
    },
    resolveProfile() {
      return {
        kind: "configuration",
        supports: () => true,
        baseAddress: () => undefined,
        confirm({ target }) {
          return {
            kind: "configuration",
            target,
            workerProfile: {
              kind: "configuration",
              componentKind: "configuration",
              adoptedUuids: {},
            },
          }
        },
      }
    },
    buildPlan({ structure }) {
      return {
        assignments: [{
          id: "Конфигурация.yaml",
          sourceProjectPath: "Конфигурация.yaml",
          sourcePath: join(structure.componentDir, "Конфигурация.yaml"),
          expectedContentHash: 10n,
          role: "configuration",
          itemType: "MetadataConfiguration",
          itemName: "Конфигурация",
          logicalAddress: "Конфигурация",
          ...fullXmlSyncTestOutput("partial.xml"),
        }],
        externalFiles: [{
          assignmentId: "Конфигурация.yaml",
          sourceProjectPath: "Модуль.bsl",
          sourcePath: join(structure.componentDir, "Модуль.bsl"),
          expectedContentHash: 20n,
          targetXmlPath: "Module.bsl",
        }],
      }
    },
    createWorkerPool() {
      return {
        async initialize() {},
        async execute() {
          fs.writeFileSync(join(xmlDir, "partial.xml"), "partial")
          return {
            diagnostics: [],
            warnings: [],
            writtenFiles: [{
              assignmentId: "Конфигурация.yaml",
              targetXmlPath: "partial.xml",
            }],
            expectedOutputs: [{
              assignmentId: "Конфигурация.yaml",
              targetXmlPath: "partial.xml",
            }],
            fragmentData: {
              sourceProjectPaths: ["Конфигурация.yaml"],
              entities: [],
            },
          }
        },
        async close() {},
      }
    },
    async transferExternalFiles() {
      throw new Error("copy failed")
    },
    validateWrittenFiles() {
      return []
    },
    writeIndex: writeConfigurationIndexAtomically,
  }
  return deps
}
