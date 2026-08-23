import fs from "node:fs"
import os from "node:os"
import { join } from "node:path"
import { createConfigurationLanguages, type ComponentAddress } from "@nkdk/runtime"
import type { ConfigurationIndexCandidateStore, ConfigurationIndexStore } from "@nkdk/runtime/configuration-index-store"
import type { ComponentHashState, ComponentIndexes, ComponentProjectStructure } from "../project/componentState"
import { compileRegisteredMetadataResourceTopology } from "../resourceTopology/adapters/registeredRules"
import type { FullXmlSyncCoordinatorDependencies } from "./syncConfiguration"
import {
  createFullXmlSyncDiagnosticCollectionFromDiagnostics,
  createFullXmlSyncFileCollectionFromFiles,
} from "./workerPool"
import { fullXmlSyncTestTopologyFields } from "./testTopology"
import type { ProjectStateReadSession } from "../projectState"

const tempDirs: string[] = []

export async function removeFullSyncTempDirs(): Promise<void> {
  for (const dir of tempDirs.splice(0)) {
    await fs.promises.rm(dir, { recursive: true, force: true })
  }
}

export function createTempRoot(): string {
  const root = fs.mkdtempSync(join(os.tmpdir(), "nkdk-full-sync-"))
  tempDirs.push(root)
  return root
}

export function emptyProjectStateReadSession(
  overrides: Partial<ProjectStateReadSession> = {},
): ProjectStateReadSession {
  return {
    resolveTargets: (requests) => requests.map(({ requestId }) => ({ requestId, status: "missing" as const })),
    readOwners: (requests) => requests.map(({ requestId }) => ({ requestId, status: "missing" as const })),
    findReferences: (requests) => requests.map(({ requestId }) => ({ requestId, references: [] })),
    readDependencyInputs: (requests) => requests.map(({ requestId }) => ({ requestId, status: "missing" as const })),
    readDependencyOwnerInputs: (requests) => requests.map(({ requestId }) => ({ requestId, status: "missing" as const })),
    readOwnerRefPage: () => ({ refs: [] }),
    readComponentTargetPage: () => ({ entries: [] }),
    readValidationStatus: () => [],
    readFileMetadataTargetReferences: (requests) => requests.map((request) => ({
      requestId: request.requestId,
      status: "missing" as const,
    })),
    readStructuredDocumentEntries: () => [],
    close() {},
    ...overrides,
  }
}

export function createMockFullSyncDependencies(
  overrides: Partial<FullXmlSyncCoordinatorDependencies> = {}
): FullXmlSyncCoordinatorDependencies {
  const topology = compileRegisteredMetadataResourceTopology()
  const defaults: FullXmlSyncCoordinatorDependencies = {
    async exists(path) {
      return path === "/project"
    },
    async isDirectoryEmpty() {
      return true
    },
    async mkdir() {},
    async loadLanguages() {
      return createConfigurationLanguages({ default: "ru", registered: ["ru"] })
    },
    async readStructure({ address }) {
      return structure(address, topology)
    },
    async readSnapshot({ address }) {
      return snapshot(address)
    },
    async readHashes({ structure: value }) {
      return hashes(value)
    },
    async readIndexes({ structure: value, hashes: valueHashes }) {
      return indexes(value, valueHashes)
    },
    confirmState(params) {
      return Object.freeze(params)
    },
    resolveProfile(address) {
      if (address.kind !== "configuration" && address.kind !== "configurationExtension") {
        throw new Error(`Unsupported test component: ${address.kind}`)
      }
      return {
        kind: address.kind,
        supports: () => true,
        baseAddress: () => (address.kind === "configurationExtension" ? { kind: "configuration" } : undefined),
        confirm({ target, base }) {
          return {
            kind: address.kind,
            target,
            ...(base === undefined ? {} : { base }),
            workerProfile: {
              kind: address.kind,
              componentKind: address.kind,
              adoptedUuids: {},
              ...(base === undefined
                ? {}
                : {
                    baseForms: {
                      componentDir: base.structure.componentDir,
                      projectFiles: base.hashes.projectFiles,
                      snapshot: base.snapshot.descriptor,
                    },
                  }),
            },
          }
        },
      }
    },
    buildPlan({ structure: value }) {
      return {
        assignments: [
          {
            id: "Конфигурация.yaml",
            sourceProjectPath: "Конфигурация.yaml",
            sourcePath: `${value.componentDir}/Конфигурация.yaml`,
            expectedContentHash: 10n,
            role: "configuration",
            itemType:
              value.address.kind === "configuration"
                ? "MetadataConfiguration"
                : "MetadataConfigurationExtension",
            itemName: "Конфигурация",
            logicalAddress: "Конфигурация",
            ...fullXmlSyncTestTopologyFields("Конфигурация.yaml"),
          },
        ],
        externalFiles: [],
      }
    },
    createWorkerPool() {
      return {
        async initialize() {},
        async execute(_assignments, options) {
          await options?.onBatch?.({ generatedDocuments: [], configurationFragments: [{ targetProjectPath: "Конфигурация.yaml", entities: [] }] })
          return {
            diagnostics: createFullXmlSyncDiagnosticCollectionFromDiagnostics([]),
            warnings: createFullXmlSyncDiagnosticCollectionFromDiagnostics([]),
            writtenFiles: createFullXmlSyncFileCollectionFromFiles([
              {
                assignmentId: "Конфигурация.yaml",
                targetXmlPath: "Configuration.xml",
              },
            ]),
            expectedOutputs: createFullXmlSyncFileCollectionFromFiles([
              {
                assignmentId: "Конфигурация.yaml",
                targetXmlPath: "Configuration.xml",
              },
            ]),
          }
        },
        async close() {},
      }
    },
    async transferExternalFiles() {
      return { copiedFiles: [], projectFiles: [] }
    },
    validateWrittenFiles() {
      return []
    },
    openIndexStore: () => createFakeConfigurationIndexStore(),
    async createIndexCandidate() { return createFakeConfigurationIndexCandidateStore() },
    async publishCandidate() {},
  }

  return { ...defaults, ...overrides }
}

function structure(
  address: ComponentAddress,
  topology: ReturnType<typeof compileRegisteredMetadataResourceTopology>
): ComponentProjectStructure {
  const componentPath = address.kind === "configuration" ? "cf" : `cfe/${address.name}`
  return {
    address,
    componentPath,
    componentDir: `/project/${componentPath}`,
    topology,
    resources: [],
    projectPaths: ["Конфигурация.yaml"],
  }
}

function hashes(structure: ComponentProjectStructure): ComponentHashState {
  return {
    componentPath: structure.componentPath,
    projectFiles: [{ projectPath: "Конфигурация.yaml", contentHash: 10n }],
  }
}

function indexes(structure: ComponentProjectStructure, hashState: ComponentHashState): ComponentIndexes {
  return {
    componentPath: structure.componentPath,
    sourceProjectFiles: hashState.projectFiles,
    logicalAddresses: [
      {
        logicalAddress: "Конфигурация",
        sourceProjectPath: "Конфигурация.yaml",
      },
    ],
  }
}

function snapshot(address: ComponentAddress) {
  const componentPath = address.kind === "configuration" ? "cf" : `cfe/${address.name}`
  return {
    descriptor: {
      dataPath: `/project/.nkdk/components/${componentPath}/configuration-index.lmdb`,
      lockPath: `/project/.nkdk/components/${componentPath}/configuration-index.lmdb-lock`,
      schemaVersion: 1,
    },
    projectFiles: [{ projectPath: "Конфигурация.yaml", contentHash: 10n }],
  }
}

export function createFakeConfigurationIndexStore(): ConfigurationIndexStore {
  return {
    descriptor: () => snapshot({ kind: "configuration" }).descriptor,
    readHashes: () => [], getBlocks: () => new Map(), hasBlock: () => false, hasPending: () => false,
    async replaceActiveFrom() {}, async publishImportedCandidate() {}, async writePending() {},
    pendingAlreadyApplied: () => false, async applyPending() {}, async clearPending() {}, async flush() {}, async close() {},
  }
}

export function createFakeConfigurationIndexCandidateStore(): ConfigurationIndexCandidateStore {
  return {
    ...createFakeConfigurationIndexStore(), mergeBlockFragments() {}, replaceHashes() {}, copyActiveBlocksFrom() {}, validateCandidate() {}, async discard() {},
  }
}
