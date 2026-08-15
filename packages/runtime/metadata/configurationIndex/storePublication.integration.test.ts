import { existsSync } from "node:fs"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { configurationIndexStoreDescriptor } from "./storePath"
import { ConfigurationIndexStoreTestScope } from "./storeTestScope"
import type { ConfigurationIndexCandidateStore, ConfigurationIndexStore } from "./store"

const scope = new ConfigurationIndexStoreTestScope()

let replacementActive: ConfigurationIndexStore
let replacement: ConfigurationIndexCandidateStore
let mvccActive: ConfigurationIndexStore
let mvccDescriptor: ReturnType<typeof configurationIndexStoreDescriptor>
let oldReader: ConfigurationIndexStore
let mvccReplacement: ConfigurationIndexCandidateStore
let pendingActive: ConfigurationIndexStore
let invalidActive: ConfigurationIndexStore
let invalidCandidate: ConfigurationIndexCandidateStore
let blockedActive: ConfigurationIndexStore
let blockedReplacement: ConfigurationIndexCandidateStore
let importedActive: ConfigurationIndexStore
let importedDescriptor: ReturnType<typeof configurationIndexStoreDescriptor>
let importedCandidate: ConfigurationIndexCandidateStore
let importedCandidatePath: string

beforeAll(async () => {
  const replacementProject = await scope.temporaryProject()
  replacementActive = scope.open(
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
  replacement = await scope.candidate({ projectDir: replacementProject, operationId: "replacement" })
  replacement.replaceHashes([
    { projectPath: "new.yaml", contentHash: 2n },
    { projectPath: "module.bsl", contentHash: 3n },
  ])
  replacement.mergeBlockFragment({
    targetProjectPath: "new.yaml",
    entities: [{ logicalAddress: "Новый", xmlId: "2" }],
  })

  const mvccProject = await scope.temporaryProject()
  mvccDescriptor = configurationIndexStoreDescriptor(mvccProject, { kind: "configuration" })
  mvccActive = scope.open(mvccDescriptor, "readWrite")
  const mvccInitial = await scope.candidate({ projectDir: mvccProject, operationId: "mvcc-initial" })
  mvccInitial.replaceHashes([{ projectPath: "А.yaml", contentHash: 1n }])
  await mvccActive.replaceActiveFrom(mvccInitial)
  oldReader = scope.open(mvccDescriptor, "readOnly")
  expect(oldReader.readHashes()).toEqual([{ projectPath: "А.yaml", contentHash: 1n }])
  mvccReplacement = await scope.candidate({ projectDir: mvccProject, operationId: "mvcc-replacement" })
  mvccReplacement.replaceHashes([{ projectPath: "Б.yaml", contentHash: 2n }])

  const pendingProject = await scope.temporaryProject()
  pendingActive = scope.open(
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

  const invalidProject = await scope.temporaryProject()
  invalidActive = scope.open(
    configurationIndexStoreDescriptor(invalidProject, { kind: "configuration" }),
    "readWrite",
  )
  invalidCandidate = await scope.candidate({ projectDir: invalidProject, operationId: "invalid" })
  invalidCandidate.mergeBlockFragment({
    targetProjectPath: "missing.yaml",
    entities: [{ logicalAddress: "А", xmlId: "1" }],
  })

  const blockedProject = await scope.temporaryProject()
  blockedActive = scope.open(
    configurationIndexStoreDescriptor(blockedProject, { kind: "configuration" }),
    "readWrite",
  )
  await blockedActive.writePending({
    hashes: new Map([["А.yaml", { kind: "put", contentHash: 1n }]]),
    blocks: new Map(),
  })
  blockedReplacement = await scope.candidate({ projectDir: blockedProject, operationId: "blocked" })
  blockedReplacement.replaceHashes([{ projectPath: "А.yaml", contentHash: 1n }])

  const importedProject = await scope.temporaryProject()
  importedDescriptor = configurationIndexStoreDescriptor(importedProject, { kind: "configuration" })
  importedActive = scope.open(importedDescriptor, "readWrite")
  importedCandidate = await scope.candidate({
    projectDir: importedProject,
    operationId: "imported",
    purpose: "import",
  })
  importedCandidate.replaceHashes([{ projectPath: "А.yaml", contentHash: 4n }])
  importedCandidatePath = importedCandidate.descriptor().dataPath
})

afterAll(async () => {
  await scope.close()
})

describe("configuration index publication", () => {
  it("replaces all active hashes and blocks in one publication", async () => {
    await replacementActive.replaceActiveFrom(replacement)

    expect(replacementActive.readHashes()).toEqual([
      { projectPath: "module.bsl", contentHash: 3n },
      { projectPath: "new.yaml", contentHash: 2n },
    ])
    expect(replacementActive.getBlocks(["old.yaml", "new.yaml"])).toEqual(
      new Map([["new.yaml", { entities: [{ logicalAddress: "Новый", xmlId: "2" }] }]]),
    )
  })

  it("keeps an earlier read session on its MVCC view", async () => {
    await mvccActive.replaceActiveFrom(mvccReplacement)

    expect(oldReader.readHashes()).toEqual([{ projectPath: "А.yaml", contentHash: 1n }])
    const newReader = scope.open(mvccDescriptor, "readOnly")
    expect(newReader.readHashes()).toEqual([{ projectPath: "Б.yaml", contentHash: 2n }])
  })

  describe.sequential("pending publication", () => {
    it("keeps disjoint pending hashes and blocks invisible", async () => {
      await pendingActive.writePending({
        hashes: new Map([["Б.bsl", { kind: "put", contentHash: 2n }]]),
        blocks: new Map([["А.yaml", { kind: "delete" }]]),
      })

      expect(pendingActive.hasPending()).toBe(true)
      expect(pendingActive.readHashes()).toEqual([{ projectPath: "А.yaml", contentHash: 1n }])
      expect(pendingActive.hasBlock("А.yaml")).toBe(true)
      expect(pendingActive.pendingAlreadyApplied()).toBe(false)
    })

    it("applies pending hashes and blocks atomically", async () => {
      await pendingActive.applyPending()

      expect(pendingActive.readHashes()).toEqual([
        { projectPath: "А.yaml", contentHash: 1n },
        { projectPath: "Б.bsl", contentHash: 2n },
      ])
      expect(pendingActive.hasBlock("А.yaml")).toBe(false)
      expect(pendingActive.hasPending()).toBe(true)
      expect(pendingActive.pendingAlreadyApplied()).toBe(true)
    })

    it("clears an applied pending publication", async () => {
      await pendingActive.clearPending()

      expect(pendingActive.hasPending()).toBe(false)
    })
  })

  it("rejects a candidate block without a hash before changing active state", async () => {
    expect(() => invalidCandidate.validateCandidate()).toThrow("missing.yaml")
    await expect(invalidActive.replaceActiveFrom(invalidCandidate)).rejects.toThrow("missing.yaml")
    expect(invalidActive.readHashes()).toEqual([])
  })

  it("blocks full publication and a second prepare while pending exists", async () => {
    await expect(blockedActive.replaceActiveFrom(blockedReplacement)).rejects.toThrow("pending")
    await expect(
      blockedActive.writePending({ hashes: new Map([["Б.yaml", { kind: "delete" }]]), blocks: new Map() }),
    ).rejects.toThrow("pending")
  })

  it("publishes an imported candidate by moving its data file", async () => {
    await importedActive.publishImportedCandidate(importedCandidate)

    expect(existsSync(importedCandidatePath)).toBe(false)
    expect(existsSync(`${importedCandidatePath}-lock`)).toBe(false)
    const reader = scope.open(importedDescriptor, "readOnly")
    expect(reader.readHashes()).toEqual([{ projectPath: "А.yaml", contentHash: 4n }])
  })
})
