import { describe, expect, it } from "vitest"
import {
  assertProjectStateFileBaseline,
  assertProjectStateFileBaselinePathPage,
  assertProjectStateFileHashBatch,
  type ProjectStateFileHashBatch,
  type ProjectStateReadToken,
} from "./contracts"
import {
  assertProjectStateFileUpdateBatch,
  type ProjectStateFileIdentity,
  type ProjectStateFileUpdate,
  type ProjectStateYamlFileUpdate,
} from "./fileUpdate"
import {
  ProjectStateReadSessionClosedError,
  type ProjectStateReadSession,
} from "./readSession"
import { runProjectStateStoreContract } from "./storeContract"
import type { ProjectStateStore } from "./store"
import { buildProjectStateSnapshot } from "./binary/builder"
import { createProjectStateFragmentWriter, openProjectStateFragment } from "./binary/fragment"
import { ProjectStateSnapshotView } from "./binary/snapshot"
import { createTypedProjectStateReader } from "./binary/typedReader"
import { createBinaryProjectStateReadToken } from "./binary/readToken"
import { openBinaryProjectStateReadSession } from "./binary/readSession"
import { ProjectStateReadSessionClosedError as PublicReadSessionClosedError } from "../../index"
import { createProjectStateDependencyValidator } from "../validation/projectStateDependencyValidation"

describe("ProjectStateFileHashBatch", () => {
  it("требует один собственный буфер хэшей по восемь байт на файл", () => {
    const batch = {
      files: [file("cf/Конфигурация.yaml"), file("cf/Модуль.bsl")],
      hashBytes: Uint8Array.from([...Array(16).keys()]),
    } satisfies ProjectStateFileHashBatch

    expect(structuredClone(batch)).toEqual(batch)
    expect(() => assertProjectStateFileHashBatch(batch)).not.toThrow()
    expect(() =>
      assertProjectStateFileHashBatch({
        ...batch,
        hashBytes: new Uint8Array(new ArrayBuffer(17), 1, 16),
      })
    ).toThrow("нулевого смещения")
    expect(() =>
      assertProjectStateFileHashBatch({
        ...batch,
        files: [file("cf/Конфигурация.yaml"), { ...file("cf/Модуль.bsl"), callback: () => undefined }],
      })
    ).toThrow()
  })

  it.each([
    ["необъектный batch", null],
    ["files не массив", { files: {}, hashBytes: new Uint8Array(0) }],
    ["не Uint8Array", { files: [], hashBytes: new ArrayBuffer(0) }],
    ["короткий буфер", { files: [file("cf/a.bin")], hashBytes: new Uint8Array(7) }],
    ["длинный буфер", { files: [file("cf/a.bin")], hashBytes: new Uint8Array(9) }],
    ["увеличенный backing buffer", { files: [file("cf/a.bin")], hashBytes: new Uint8Array(new ArrayBuffer(9), 0, 8) }],
    ["необъектный файл", { files: [null], hashBytes: new Uint8Array(8) }],
    ["projectPath не строка", { files: [{ ...file("cf/a.bin"), projectPath: 1 }], hashBytes: new Uint8Array(8) }],
    ["componentPath не строка", { files: [{ ...file("cf/a.bin"), componentPath: 1 }], hashBytes: new Uint8Array(8) }],
    ["неизвестный resourceKind", { files: [{ ...file("cf/a.bin"), resourceKind: "other" }], hashBytes: new Uint8Array(8) }],
    ["неизвестный yamlRole", { files: [{ ...file("cf/a.bin"), yamlRole: "other" }], hashBytes: new Uint8Array(8) }],
    ["лишнее поле batch", { files: [], hashBytes: new Uint8Array(0), callback: () => undefined }],
  ])("отвергает %s", (_name, batch) => {
    expect(() => assertProjectStateFileHashBatch(batch)).toThrow()
  })
})

describe("ProjectStateFileBaselinePathPage", () => {
  const valid = () => ({
    knownHashBits: Uint8Array.of(0b0000_0001),
    hashBytes: new Uint8Array(16),
    previousFileIds: Int32Array.of(0, -1),
    storedFileCount: 1,
  })

  it("принимает позиционную страницу известных путей", () => {
    expect(() => assertProjectStateFileBaselinePathPage(valid(), 2)).not.toThrow()
  })

  it.each([
    ["короткие биты", { knownHashBits: new Uint8Array(0) }],
    ["короткие хэши", { hashBytes: new Uint8Array(15) }],
    ["короткие идентификаторы", { previousFileIds: Int32Array.of(0) }],
    ["неизвестный идентификатор", { previousFileIds: Int32Array.of(1, -1) }],
    ["лишнее поле", { callback: () => undefined }],
  ])("отвергает %s", (_name, override) => {
    expect(() => assertProjectStateFileBaselinePathPage({ ...valid(), ...override }, 2)).toThrow()
  })
})

describe("переносимый ProjectStateFileUpdateBatch", () => {
  it("переживает structuredClone, но отвергает rule-объекты, функции и неправильный общий буфер", () => {
    const update = {
      kind: "resource" as const,
      projectPath: "cf/Модуль.bsl",
      componentPath: "cf",
      resourceKind: "resource" as const,
      targets: [],
    }
    const batch = { updates: [update], hashBytes: new Uint8Array(8) }

    expect(structuredClone(batch)).toEqual(batch)
    expect(() => assertProjectStateFileUpdateBatch(batch)).not.toThrow()
    expect(() => assertProjectStateFileUpdateBatch({
      updates: [{ ...update, rule: { type: "DataPath" } }],
      hashBytes: new Uint8Array(8),
    })).toThrow()
    expect(() => assertProjectStateFileUpdateBatch({
      updates: [{ ...update, callback: () => undefined }],
      hashBytes: new Uint8Array(8),
    })).toThrow()
    expect(() => assertProjectStateFileUpdateBatch({ updates: [update], hashBytes: new Uint8Array(7) })).toThrow()
  })
})

describe("ProjectStateReadSession", () => {
  it("сопоставляет пакетные ответы по requestId и закрывается контролируемой ошибкой", () => {
    const session = testReadSession()

    expect(
      session.resolveTargets([
        { requestId: "r1", componentPath: "cf", canonicalTarget: "Catalog.Товары" },
      ])
    ).toEqual([
      {
        requestId: "r1",
        status: "found",
        target: { kind: "object", canonical: "Catalog.Товары" },
        source: { projectPath: "cf/Справочник/Товары/Свойства.yaml", componentPath: "cf" },
      },
    ])
    expect(session.readComponentTargetPage({ componentPath: "cf" })).toEqual({
      entries: [{
        logicalAddress: "Catalog.Товары",
        sourceProjectPath: "cf/Справочник/Товары/Свойства.yaml",
      }],
    })
    expect(session.readFileMetadataTargetReferences([{
      requestId: "references",
      componentPath: "cf",
      projectPath: "cf/Справочник/Товары/Свойства.yaml",
    }])).toEqual([{
      requestId: "references",
      status: "found",
      references: [{ yamlPath: ["Ссылка"], canonical: "Catalog.Поставщики" }],
    }])

    session.close()
    expect(() => session.readOwners([])).toThrow(ProjectStateReadSessionClosedError)
  })
})

describe("публичная граница project state", () => {
  it("экспортирует нейтральную ошибку закрытого read session", () => {
    expect(PublicReadSessionClosedError).toBe(ProjectStateReadSessionClosedError)
  })
})

runProjectStateStoreContract(createTestStoreContractFixture)

function file(projectPath: string) {
  return { projectPath, componentPath: "cf", resourceKind: "resource" as const }
}

function testReadSession(): ProjectStateReadSession {
  let closed = false
  const token = createBinaryProjectStateReadToken(buildProjectStateSnapshot({ fragments: [], deletions: [] }))

  function assertOpen(): void {
    if (closed) throw new ProjectStateReadSessionClosedError(token)
  }

  let session!: ProjectStateReadSession
  session = {
    resolveTargets(requests) {
      assertOpen()
      return requests.map(({ requestId, canonicalTarget }) => ({
        requestId,
        status: "found" as const,
        target: { kind: "object" as const, canonical: canonicalTarget },
        source: { projectPath: "cf/Справочник/Товары/Свойства.yaml", componentPath: "cf" },
      }))
    },
    readOwners(requests) {
      assertOpen()
      return requests.map(({ requestId }) => ({ requestId, status: "missing" as const }))
    },
    findReferences(requests) {
      assertOpen()
      return requests.map(({ requestId }) => ({ requestId, references: [] }))
    },
    readDependencyInputs(requests) {
      assertOpen()
      return requests.map(({ requestId }) => ({ requestId, status: "missing" as const }))
    },
    readDependencyOwnerInputs(requests) {
      assertOpen()
      return requests.map(({ requestId }) => ({ requestId, status: "missing" as const }))
    },
    readOwnerRefPage() {
      assertOpen()
      return { refs: [] }
    },
    readComponentTargetPage() {
      assertOpen()
      return {
        entries: [{
          logicalAddress: "Catalog.Товары",
          sourceProjectPath: "cf/Справочник/Товары/Свойства.yaml",
        }],
      }
    },
    readValidationStatus() {
      assertOpen()
      return []
    },
    readFileMetadataTargetReferences(requests) {
      assertOpen()
      return requests.map(({ requestId }) => ({
        requestId,
        status: "found" as const,
        references: [{ yamlPath: ["Ссылка"], canonical: "Catalog.Поставщики" }],
      }))
    },
    close() {
      closed = true
    },
  }
  return session
}

function createTestStoreContractFixture() {
  const committed = new Map<string, StoredUpdate>()
  const committedIdentities = new Map<string, ProjectStateFileIdentity>()
  let staged: Map<string, StoredUpdate> | undefined
  let stagedIdentities: Map<string, ProjectStateFileIdentity> | undefined

  function current(): Map<string, StoredUpdate> {
    return staged ?? committed
  }

  function updateTarget(target: Map<string, StoredUpdate>, update: ProjectStateFileUpdate, hashBytes: Uint8Array): void {
    target.set(update.projectPath, { update, hashBytes: hashBytes.slice() })
  }

  const store: ProjectStateStore = {
    readFileBaseline(files) {
      const knownHashBits = new Uint8Array(Math.ceil(files.length / 8))
      const hashBytes = new Uint8Array(files.length * 8)
      files.forEach((file, index) => {
        const previous = committed.get(file.projectPath)
        if (previous === undefined) return
        knownHashBits[Math.floor(index / 8)]! |= 1 << (index % 8)
        hashBytes.set(previous.hashBytes, index * 8)
      })
      const known = new Set(files.map(({ projectPath }) => projectPath))
      const result = {
        knownHashBits,
        hashBytes,
        deleted: [...committed.values()]
          .map(({ update }) => identity(update))
          .filter(({ projectPath }) => !known.has(projectPath)),
      }
      assertProjectStateFileBaseline(result, files.length)
      return result
    },
    readFileBaselinePathPage(projectPaths) {
      const paths = [...committed.keys()]
      const knownHashBits = new Uint8Array(Math.ceil(projectPaths.length / 8))
      const hashBytes = new Uint8Array(projectPaths.length * 8)
      const previousFileIds = new Int32Array(projectPaths.length).fill(-1)
      projectPaths.forEach((projectPath, index) => {
        const fileId = paths.indexOf(projectPath)
        const previous = committed.get(projectPath)
        if (fileId < 0 || previous === undefined) return
        previousFileIds[index] = fileId
        knownHashBits[Math.floor(index / 8)]! |= 1 << (index % 8)
        hashBytes.set(previous.hashBytes, index * 8)
      })
      return { knownHashBits, hashBytes, previousFileIds, storedFileCount: paths.length }
    },
    compareFiles(batch) {
      assertProjectStateFileHashBatch(batch)
      const changed = batch.files.flatMap((file, index) => {
        const previous = committed.get(file.projectPath)
        const hash = batch.hashBytes.slice(index * 8, (index + 1) * 8)
        return previous === undefined || !equalBytes(previous.hashBytes, hash) ? [{ index, file }] : []
      })
      const known = new Set(batch.files.map(({ projectPath }) => projectPath))
      const deleted = [...committed.values()]
        .map(({ update }) => identity(update))
        .filter(({ projectPath }) => !known.has(projectPath))
      return { changed, deleted }
    },
    beginUpdate() {
      if (staged !== undefined) throw new Error("Обновление уже начато")
      staged = new Map(committed)
      stagedIdentities = new Map(committedIdentities)
    },
    appendFragment(fragment) {
      if (staged === undefined) throw new Error("Нет активного обновления")
      const snapshot = new ProjectStateSnapshotView(buildProjectStateSnapshot({
        fragments: [openProjectStateFragment(fragment)],
        deletions: [],
      }))
      const reader = createTypedProjectStateReader(snapshot)
      Array.from({ length: snapshot.fileCount }, (_, fileId): ProjectStateFileUpdate => {
        const record = snapshot.fileRecord(fileId)
        const base = {
          projectPath: snapshot.filePath(fileId),
          componentPath: snapshot.componentPath(fileId),
          resourceKind: record.resourceKind === 1 ? "yaml" as const : "resource" as const,
        }
        if (record.updateKind === 2) return reader.fileUpdate(fileId)
        const yamlRole = ([undefined, "configuration", "properties", "form"] as const)[record.yamlRole]
        const facts = reader.yamlFacts(fileId)
        if (yamlRole === undefined || facts === undefined) throw new Error("Неполный индекс YAML")
        return {
          ...base,
          kind: "yaml",
          yamlRole,
          ...facts,
          localValidation: reader.localValidation(fileId)
            ?? { contributedFacts: false, diagnostics: [], schemaDiagnostics: [] },
        }
      }).forEach((update, fileId) => {
        updateTarget(staged!, update, hashBytes(snapshot.fileRecord(fileId).hash))
        stagedIdentities!.set(update.projectPath, identity(update))
      })
    },
    clearImportOutput(componentPaths) {
      const target = requireStaged(staged)
      const identities = requireStagedIdentities(stagedIdentities)
      const components = new Set(componentPaths)
      for (const [projectPath, file] of identities) {
        if (components.has(file.componentPath)) {
          identities.delete(projectPath)
          target.delete(projectPath)
        }
      }
    },
    deleteFiles(projectPaths) {
      if (staged === undefined) throw new Error("Нет активного обновления")
      projectPaths.forEach((projectPath) => {
        staged!.delete(projectPath)
        stagedIdentities!.delete(projectPath)
      })
    },
    deleteUnseenFiles(seenFileIds) {
      const paths = [...committed.keys()]
      let deleted = 0
      paths.forEach((projectPath, fileId) => {
        if ((seenFileIds[Math.floor(fileId / 8)]! & (1 << (fileId % 8))) !== 0) return
        staged!.delete(projectPath)
        stagedIdentities!.delete(projectPath)
        deleted += 1
      })
      return deleted
    },
    readLocalDiagnostics: () => [...committed.values()]
      .map(({ update }) => update)
      .flatMap((update) => update.kind === "yaml"
        ? update.localValidation.diagnostics.map((diagnostic) => ({ ...diagnostic, filePath: update.projectPath }))
        : []),
    readDependencyCheckBatch: ({ requests }) => ({
      results: requests.map(({ requestId, componentPath, projectPath, check }) => {
        const visible = visibleYamlUpdates(current(), componentPath)
        if (check.kind === "fillValue") {
          return {
            requestId,
            status: "found" as const,
            input: {
              owners: visible.flatMap((update) => update.owners)
                .filter(({ owner }) => owner.kind === "ОпределяемыйТип"),
              fields: [],
              forms: [],
            },
          }
        }
        const input = dependencyInput(visible, componentPath, projectPath, check.owner)
        return input === undefined
          ? { requestId, status: "missing" as const }
          : { requestId, status: "found" as const, input }
      }),
    }),
    validateDependencies: () => [],
    readComponentProjection(componentPath) {
      const entries = [...current().values()].filter(({ update }) => update.componentPath === componentPath)
      const hashBytes = new Uint8Array(entries.length * 8)
      entries.forEach((entry, index) => hashBytes.set(entry.hashBytes, index * 8))
      return {
        componentPath,
        updates: entries.map(({ update }) => update),
        hashBytes,
      }
    },
    createReadToken() {
      return createBinaryProjectStateReadToken(snapshotFromStored(committed))
    },
    commitUpdate() {
      if (staged === undefined) throw new Error("Нет активного обновления")
      committed.clear()
      staged.forEach((value, key) => committed.set(key, value))
      committedIdentities.clear()
      stagedIdentities!.forEach((value, key) => committedIdentities.set(key, value))
      staged = undefined
      stagedIdentities = undefined
      return true
    },
    rollbackUpdate() {
      staged = undefined
      stagedIdentities = undefined
    },
    async checkpoint() {},
    close() {},
  }

  return {
    store,
    openReadSession(token: ProjectStateReadToken): ProjectStateReadSession {
      return openBinaryProjectStateReadSession(token, createProjectStateDependencyValidator())
    },
  }
}

function snapshotFromStored(stored: ReadonlyMap<string, StoredUpdate>) {
  const writer = createProjectStateFragmentWriter()
  for (const { update, hashBytes: bytes } of stored.values()) {
    writer.appendFile(update, new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getBigUint64(0, false))
  }
  return buildProjectStateSnapshot({
    fragments: stored.size === 0 ? [] : [openProjectStateFragment(writer.finish())],
    deletions: [],
  })
}

function hashBytes(hash: bigint): Uint8Array {
  const bytes = new Uint8Array(8)
  new DataView(bytes.buffer).setBigUint64(0, hash, false)
  return bytes
}

function visibleYamlUpdates(
  updates: ReadonlyMap<string, StoredUpdate>,
  componentPath: string
): ProjectStateYamlFileUpdate[] {
  return [...updates.values()]
    .map(({ update }) => update)
    .filter((update): update is ProjectStateYamlFileUpdate =>
      update.kind === "yaml" && (update.componentPath === "cf" || update.componentPath === componentPath)
    )
}

function dependencyInput(
  updates: readonly ProjectStateYamlFileUpdate[],
  componentPath: string,
  projectPath: string,
  owner: { readonly kind: string; readonly name?: string },
) {
  const ownerInput = dependencyOwnerInput(updates, componentPath, owner)
  if (ownerInput === undefined) return undefined
  return {
    owners: [{ owner: ownerInput.owner, facts: ownerInput.facts }],
    fields: ownerInput.fields,
    forms: updates.find((update) => update.projectPath === projectPath)?.forms ?? [],
  }
}

function dependencyOwnerInput(
  updates: readonly ProjectStateYamlFileUpdate[],
  componentPath: string,
  owner: { readonly kind: string; readonly name?: string },
) {
  const candidates = updates.flatMap((update) => update.owners
    .filter(({ owner: candidate }) => sameOwner(candidate, owner))
    .map((entry) => ({ update, entry })))
  const local = candidates.filter(({ update }) => update.componentPath === componentPath)
  const preferred = local.length > 0 ? local : candidates.filter(({ update }) => update.componentPath === "cf")
  if (preferred.length !== 1) return undefined
  const [{ update, entry }] = preferred
  return {
    owner: entry.owner,
    facts: entry.facts,
    fields: update.fields.filter((field) => sameOwner(field.owner, owner)),
  }
}

function sameOwner(
  left: { readonly kind: string; readonly name?: string },
  right: { readonly kind: string; readonly name?: string },
): boolean {
  return left.kind === right.kind && left.name === right.name
}

interface StoredUpdate {
  readonly update: ProjectStateFileUpdate
  readonly hashBytes: Uint8Array
}

function requireStaged(staged: Map<string, StoredUpdate> | undefined): Map<string, StoredUpdate> {
  if (staged === undefined) throw new Error("Нет активного обновления")
  return staged
}

function requireStagedIdentities(
  identities: Map<string, ProjectStateFileIdentity> | undefined,
): Map<string, ProjectStateFileIdentity> {
  if (identities === undefined) throw new Error("Нет активного обновления")
  return identities
}

function equalBytes(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength && left.every((byte, index) => byte === right[index])
}

function identity(update: ProjectStateFileIdentity) {
  const { projectPath, componentPath, resourceKind, yamlRole } = update
  return yamlRole === undefined
    ? { projectPath, componentPath, resourceKind }
    : { projectPath, componentPath, resourceKind, yamlRole }
}
