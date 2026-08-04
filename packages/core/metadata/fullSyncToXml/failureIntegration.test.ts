import fs from "node:fs"
import { dirname, join } from "node:path"
import { afterEach, beforeAll, describe, expect, it } from "vitest"
import { encodeConfigurationIndex } from "../configurationIndex/encode"
import {
  configurationIndexPath,
  writeConfigurationIndexAtomically,
} from "../configurationIndex/fileIO"
import { snapshotConfigurationIndex } from "../configurationIndex/sharedSnapshot"
import { entity } from "../configurationIndex/testData"
import type { ConfigurationSnapshot } from "../configurationIndex/types"
import type { ConfigurationContext } from "../context/types"
import type { ProjectStateReadSession, ProjectStateService } from "../projectState"
import { createUnusedMetadataWorkerPool } from "../../tests/metadataWorkerTestPool"
import { createTestProjectStateReadToken } from "../projectState/tests/readToken"
import { createMetadataDiagnosticCollectionFromDiagnostics } from "../diagnostics/collection"
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

const fullSyncTopology = compileRegisteredMetadataResourceTopology()

afterEach(async () => {
  await removeFullSyncTempDirs()
})

describe("full XML sync failure integration", () => {
  const context = {
    version: "2.20",
    defaultLanguage: "ru",
    exportToYAML: { toTyped: false },
  } as ConfigurationContext
  let missingAdoptedUuidResult: Awaited<ReturnType<typeof syncComponentToXml>>
  let workerStartedForMissingAdoptedUuid: boolean

  function syncIndexedProject(
    state: Awaited<ReturnType<typeof createIndexedProject>>,
    deps: FullXmlSyncCoordinatorDependencies,
    componentPath = "cf",
  ) {
    return syncComponentToXml({
      context,
      projectDir: state.projectDir,
      componentPath,
      xmlDir: state.xmlDir,
      projectState: testProjectState(state.previous),
    }, deps)
  }

  beforeAll(async () => {
    const state = await createIndexedProject()
    workerStartedForMissingAdoptedUuid = false
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
        workerStartedForMissingAdoptedUuid = true
        throw new Error("worker must not be created")
      },
    }

    missingAdoptedUuidResult = await syncIndexedProject(state, deps, "cfe/Дополнение")
  })

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
      projectState: testProjectState(),
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

    const result = await syncIndexedProject(state, deps)

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

    const result = await syncIndexedProject(state, deps)

    expect(result.failed).toEqual([
      expect.objectContaining({ code: "full_xml_sync_assignment_failed" }),
    ])
    expect(transferred).toBe(false)
    expect(written).toBe(false)
    expect(fs.readFileSync(state.indexPath)).toEqual(before)
  })

  it("rejects an incomplete selection before creating XML or confirming the snapshot", async () => {
    const state = await createIndexedProject()
    const before = fs.readFileSync(state.indexPath)
    fs.rmdirSync(state.xmlDir)
    let componentStateConfirmed = false
    let profileConfirmed = false
    const baseDeps = failureDeps(state.previous, state.projectDir, state.xmlDir)
    const deps: FullXmlSyncCoordinatorDependencies = {
      ...baseDeps,
      async exists(path) {
        return path === state.projectDir
      },
      async mkdir(path) {
        await fs.promises.mkdir(path, { recursive: true })
      },
      confirmState(params) {
        componentStateConfirmed = true
        return Object.freeze(params)
      },
      resolveProfile() {
        return {
          kind: "configuration",
          supports: () => true,
          baseAddress: () => undefined,
          confirm({ target }) {
            profileConfirmed = true
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
      createWorkerPool() {
        throw new Error("worker pool must not be created")
      },
    }

    const result = await syncComponentToXml({
      context,
      projectDir: state.projectDir,
      componentPath: "cf",
      xmlDir: state.xmlDir,
      projectState: testProjectState(state.previous),
      selection: { kind: "selected", projectPaths: [] },
    }, deps)

    expect(result.failed).toEqual([
      expect.objectContaining({ message: "Публичная частичная синхронизация в XML пока не поддерживается" }),
    ])
    expect(fs.existsSync(state.xmlDir)).toBe(false)
    expect(componentStateConfirmed).toBe(false)
    expect(profileConfirmed).toBe(false)
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

    const result = await syncIndexedProject(state, deps)

    expect(result.failed).toEqual([
      expect.objectContaining({ code: "full_xml_sync_output_invalid" }),
    ])
    expect(fs.readFileSync(state.indexPath)).toEqual(before)
  })

  it("does not start workers when cfe confirmation cannot find an adopted UUID", () => {
    expect(missingAdoptedUuidResult.failed).toEqual([
      expect.objectContaining({
        message: "Не найден UUID заимствованного элемента",
      }),
    ])
    expect(workerStartedForMissingAdoptedUuid).toBe(false)
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
  const configurationPath = configurationIndexPath(projectDir, { kind: "configuration" })
  const extensionPath = configurationIndexPath(projectDir, {
    kind: "configurationExtension",
    name: "Дополнение",
  })
  await Promise.all([
    writeSnapshot(configurationPath, previous),
    writeSnapshot(extensionPath, { ...previous, componentPath: "cfe/Дополнение" }),
  ])
  return {
    workers: createUnusedMetadataWorkerPool(),
    projectDir,
    xmlDir,
    previous,
    indexPath: configurationPath,
  }
}

async function writeSnapshot(path: string, snapshot: ConfigurationSnapshot): Promise<void> {
  await fs.promises.mkdir(dirname(path), { recursive: true })
  await fs.promises.writeFile(path, encodeConfigurationIndex(snapshot))
}

function failureDeps(
  previous: ConfigurationSnapshot,
  projectDir: string,
  xmlDir: string
): FullXmlSyncCoordinatorDependencies {
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
        topology: fullSyncTopology,
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

function testProjectState(snapshot?: ConfigurationSnapshot): ProjectStateService {
  const readToken = createTestProjectStateReadToken()
  return {
    workers: createUnusedMetadataWorkerPool(),
    async beginImport() { throw new Error("not used") },
    async refreshAndValidate() {
      return {
        diagnostics: createMetadataDiagnosticCollectionFromDiagnostics([]),
        readToken,
        stats: { hashedFiles: 0, parsedYamlFiles: 0, changedFiles: 0, deletedFiles: 0 },
      }
    },
    async createReadToken() { return createTestProjectStateReadToken() },
    async readComponentProjection({ componentPath }) {
      const files = snapshot?.files ?? []
      const hashBytes = new Uint8Array(files.length * 8)
      const view = new DataView(hashBytes.buffer)
      files.forEach(({ contentHash }, index) => view.setBigUint64(index * 8, contentHash, false))
      return {
        componentPath,
        projectFiles: files.map(({ projectPath }) => ({ projectPath: `${componentPath}/${projectPath}` })),
        hashBytes,
      }
    },
    openReadSession() {
      return {
        readComponentTargetPage: () => ({ entries: [] }),
        close() {},
      } as unknown as ProjectStateReadSession
    },
    async reset() {},
    async rebuild() { throw new Error("not used") },
    async close() {},
  }
}
