import { existsSync } from "node:fs"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { configurationIndexStoreDescriptor } from "./storePath"
import { ConfigurationIndexStoreTestScope } from "./storeTestScope"
import type { ConfigurationIndexStore } from "./store"

const scope = new ConfigurationIndexStoreTestScope()

let replacementState: ReturnType<typeof readReplacementState>
let mvccState: ReturnType<typeof readMvccState>
let pendingInvisibleState: ReturnType<typeof readPendingPublicationState>
let pendingAppliedState: ReturnType<typeof readPendingPublicationState>
let pendingCleared: boolean
let invalidState: ReturnType<typeof readInvalidState>
let blockedState: ReturnType<typeof readBlockedState>
let importedState: ReturnType<typeof readImportedState>

beforeAll(async () => {
  const replacementProject = await scope.temporaryProject()
  const replacementActive = scope.open(
    configurationIndexStoreDescriptor(replacementProject, { kind: "configuration" }),
    "readWrite",
  )
  const initial = await scope.candidate({ projectDir: replacementProject, operationId: "initial" })
  initial.replaceHashes([{ projectPath: "old.yaml", contentHash: 1n }])
  initial.mergeBlockFragment({
    targetProjectPath: "old.yaml",
    entities: [{ logicalAddress: "Старый", xmlId: "1" }],
  })
  await replacementActive.replaceActiveFrom(initial)
  const replacement = await scope.candidate({ projectDir: replacementProject, operationId: "replacement" })
  replacement.replaceHashes([
    { projectPath: "new.yaml", contentHash: 2n },
    { projectPath: "module.bsl", contentHash: 3n },
  ])
  replacement.mergeBlockFragment({
    targetProjectPath: "new.yaml",
    entities: [{ logicalAddress: "Новый", xmlId: "2" }],
  })
  await replacementActive.replaceActiveFrom(replacement)
  replacementState = readReplacementState(replacementActive)

  const mvccProject = await scope.temporaryProject()
  const mvccDescriptor = configurationIndexStoreDescriptor(mvccProject, { kind: "configuration" })
  const mvccActive = scope.open(mvccDescriptor, "readWrite")
  const mvccInitial = await scope.candidate({ projectDir: mvccProject, operationId: "mvcc-initial" })
  mvccInitial.replaceHashes([{ projectPath: "А.yaml", contentHash: 1n }])
  await mvccActive.replaceActiveFrom(mvccInitial)
  const oldReader = scope.open(mvccDescriptor, "readOnly")
  const mvccReplacement = await scope.candidate({ projectDir: mvccProject, operationId: "mvcc-replacement" })
  mvccReplacement.replaceHashes([{ projectPath: "Б.yaml", contentHash: 2n }])
  await mvccActive.replaceActiveFrom(mvccReplacement)
  const newReader = scope.open(mvccDescriptor, "readOnly")
  mvccState = readMvccState(oldReader, newReader)

  const pendingProject = await scope.temporaryProject()
  const pendingActive = scope.open(
    configurationIndexStoreDescriptor(pendingProject, { kind: "configuration" }),
    "readWrite",
  )
  const pendingInitial = await scope.candidate({ projectDir: pendingProject, operationId: "pending-initial" })
  pendingInitial.replaceHashes([{ projectPath: "А.yaml", contentHash: 1n }])
  pendingInitial.mergeBlockFragment({
    targetProjectPath: "А.yaml",
    entities: [{ logicalAddress: "А", xmlId: "1" }],
  })
  await pendingActive.replaceActiveFrom(pendingInitial)
  await pendingActive.writePending({
    hashes: new Map([["Б.bsl", { kind: "put", contentHash: 2n }]]),
    blocks: new Map([["А.yaml", { kind: "delete" }]]),
  })
  pendingInvisibleState = readPendingPublicationState(pendingActive)
  await pendingActive.applyPending()
  pendingAppliedState = readPendingPublicationState(pendingActive)
  await pendingActive.clearPending()
  pendingCleared = pendingActive.hasPending()

  const invalidProject = await scope.temporaryProject()
  const invalidActive = scope.open(
    configurationIndexStoreDescriptor(invalidProject, { kind: "configuration" }),
    "readWrite",
  )
  const invalidCandidate = await scope.candidate({ projectDir: invalidProject, operationId: "invalid" })
  invalidCandidate.mergeBlockFragment({
    targetProjectPath: "missing.yaml",
    entities: [{ logicalAddress: "А", xmlId: "1" }],
  })
  const validationError = captureError(() => invalidCandidate.validateCandidate())
  const replacementError = await captureAsyncError(() => invalidActive.replaceActiveFrom(invalidCandidate))
  invalidState = readInvalidState(validationError, replacementError, invalidActive)

  const blockedProject = await scope.temporaryProject()
  const blockedActive = scope.open(
    configurationIndexStoreDescriptor(blockedProject, { kind: "configuration" }),
    "readWrite",
  )
  await blockedActive.writePending({
    hashes: new Map([["А.yaml", { kind: "put", contentHash: 1n }]]),
    blocks: new Map(),
  })
  const blockedReplacement = await scope.candidate({ projectDir: blockedProject, operationId: "blocked" })
  blockedReplacement.replaceHashes([{ projectPath: "А.yaml", contentHash: 1n }])
  const fullPublicationError = await captureAsyncError(() => blockedActive.replaceActiveFrom(blockedReplacement))
  const secondPrepareError = await captureAsyncError(() => blockedActive.writePending({
    hashes: new Map([["Б.yaml", { kind: "delete" }]]),
    blocks: new Map(),
  }))
  blockedState = readBlockedState(fullPublicationError, secondPrepareError)

  const importedProject = await scope.temporaryProject()
  const importedDescriptor = configurationIndexStoreDescriptor(importedProject, { kind: "configuration" })
  const importedActive = scope.open(importedDescriptor, "readWrite")
  const importedCandidate = await scope.candidate({
    projectDir: importedProject,
    operationId: "imported",
    purpose: "import",
  })
  importedCandidate.replaceHashes([{ projectPath: "А.yaml", contentHash: 4n }])
  const importedCandidatePath = importedCandidate.descriptor().dataPath
  await importedActive.publishImportedCandidate(importedCandidate)
  const importedReader = scope.open(importedDescriptor, "readOnly")
  importedState = readImportedState(importedCandidatePath, importedReader)
})

afterAll(async () => {
  await scope.close()
})

describe("configuration index publication", () => {
  it("replaces all active hashes and blocks in one publication", () => {
    expect(replacementState).toEqual({
      hashes: [
        { projectPath: "module.bsl", contentHash: 3n },
        { projectPath: "new.yaml", contentHash: 2n },
      ],
      blocks: new Map([["new.yaml", { entities: [{ logicalAddress: "Новый", xmlId: "2" }] }]]),
    })
  })

  it("keeps an earlier read session on its MVCC view", () => {
    expect(mvccState).toEqual({
      oldHashes: [{ projectPath: "А.yaml", contentHash: 1n }],
      newHashes: [{ projectPath: "Б.yaml", contentHash: 2n }],
    })
  })

  describe("pending publication", () => {
    it("keeps disjoint pending hashes and blocks invisible", () => {
      expect(pendingInvisibleState).toEqual({
        hashes: [{ projectPath: "А.yaml", contentHash: 1n }],
        hasBlock: true,
        hasPending: true,
        alreadyApplied: false,
      })
    })

    it("applies pending hashes and blocks atomically", () => {
      expect(pendingAppliedState).toEqual({
        hashes: [
          { projectPath: "А.yaml", contentHash: 1n },
          { projectPath: "Б.bsl", contentHash: 2n },
        ],
        hasBlock: false,
        hasPending: true,
        alreadyApplied: true,
      })
    })

    it("clears an applied pending publication", () => {
      expect(pendingCleared).toBe(false)
    })
  })

  it("rejects a candidate block without a hash before changing active state", () => {
    expect(invalidState).toEqual({
      validationError: expect.stringContaining("missing.yaml"),
      replacementError: expect.stringContaining("missing.yaml"),
      hashes: [],
    })
  })

  it("blocks full publication and a second prepare while pending exists", () => {
    expect(blockedState).toEqual({
      fullPublicationError: expect.stringContaining("pending"),
      secondPrepareError: expect.stringContaining("pending"),
    })
  })

  it("publishes an imported candidate by moving its data file", () => {
    expect(importedState).toEqual({
      candidateExists: false,
      candidateLockExists: false,
      hashes: [{ projectPath: "А.yaml", contentHash: 4n }],
    })
  })
})

function readReplacementState(store: ConfigurationIndexStore) {
  return {
    hashes: store.readHashes(),
    blocks: store.getBlocks(["old.yaml", "new.yaml"]),
  }
}

function readMvccState(oldReader: ConfigurationIndexStore, newReader: ConfigurationIndexStore) {
  return {
    oldHashes: oldReader.readHashes(),
    newHashes: newReader.readHashes(),
  }
}

function readPendingPublicationState(store: ConfigurationIndexStore) {
  return {
    hashes: store.readHashes(),
    hasBlock: store.hasBlock("А.yaml"),
    hasPending: store.hasPending(),
    alreadyApplied: store.pendingAlreadyApplied(),
  }
}

function readInvalidState(
  validationError: unknown,
  replacementError: unknown,
  store: ConfigurationIndexStore,
) {
  return {
    validationError: errorMessage(validationError),
    replacementError: errorMessage(replacementError),
    hashes: store.readHashes(),
  }
}

function readBlockedState(fullPublicationError: unknown, secondPrepareError: unknown) {
  return {
    fullPublicationError: errorMessage(fullPublicationError),
    secondPrepareError: errorMessage(secondPrepareError),
  }
}

function readImportedState(candidatePath: string, reader: ConfigurationIndexStore) {
  return {
    candidateExists: existsSync(candidatePath),
    candidateLockExists: existsSync(`${candidatePath}-lock`),
    hashes: reader.readHashes(),
  }
}

function captureError(operation: () => void): unknown {
  try {
    operation()
    return undefined
  } catch (error) {
    return error
  }
}

async function captureAsyncError(operation: () => Promise<void>): Promise<unknown> {
  try {
    await operation()
    return undefined
  } catch (error) {
    return error
  }
}

function errorMessage(error: unknown): string | undefined {
  return error instanceof Error ? error.message : undefined
}
