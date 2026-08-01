import { describe, expect, it } from "vitest"
import {
  assertProjectStateFileHashBatch,
  type ProjectStateFileHashBatch,
  type ProjectStateReadToken,
} from "./contracts"
import {
  assertProjectStateFileUpdateBatch,
  type ProjectStateFileUpdate,
  type ProjectStateYamlFileUpdate,
} from "./fileUpdate"
import {
  ProjectStateReadSessionClosedError,
  type ProjectStateReadSession,
} from "./readSession"
import { runProjectStateStoreContract } from "./storeContract"
import type { ProjectStateStore } from "./store"
import { ProjectStateReadSessionClosedError as PublicReadSessionClosedError } from "../../index"

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

describe("переносимый ProjectStateFileUpdateBatch", () => {
  it("переживает structuredClone, но отвергает rule-объекты, функции и неправильный общий буфер", () => {
    const update = {
      kind: "resource" as const,
      projectPath: "cf/Модуль.bsl",
      componentPath: "cf",
      resourceKind: "resource" as const,
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
      { requestId: "r1", status: "found", target: { kind: "object", canonical: "Catalog.Товары" } },
    ])

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
  const token = new Uint8Array(1) as ProjectStateReadToken

  function assertOpen(): void {
    if (closed) throw new ProjectStateReadSessionClosedError(token)
  }

  return {
    resolveTargets(requests) {
      assertOpen()
      return requests.map(({ requestId, canonicalTarget }) => ({
        requestId,
        status: "found" as const,
        target: { kind: "object" as const, canonical: canonicalTarget },
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
    close() {
      closed = true
    },
  }
}

function createTestStoreContractFixture() {
  const committed = new Map<string, StoredUpdate>()
  let staged: Map<string, StoredUpdate> | undefined
  const tokens = new Set<string>()
  let nextToken = 1

  function current(): Map<string, StoredUpdate> {
    return staged ?? committed
  }

  function updateTarget(target: Map<string, StoredUpdate>, update: ProjectStateFileUpdate, hashBytes: Uint8Array): void {
    target.set(update.projectPath, { update, hashBytes: hashBytes.slice() })
  }

  const store: ProjectStateStore = {
    readCompatibility: () => undefined,
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
    },
    replaceFiles(batch) {
      assertProjectStateFileUpdateBatch(batch)
      if (staged === undefined) throw new Error("Нет активного обновления")
      batch.updates.forEach((update, index) => updateTarget(staged!, update, batch.hashBytes.slice(index * 8, (index + 1) * 8)))
    },
    deleteFiles(projectPaths) {
      if (staged === undefined) throw new Error("Нет активного обновления")
      projectPaths.forEach((projectPath) => staged!.delete(projectPath))
    },
    readLocalDiagnostics: () => [...committed.values()]
      .map(({ update }) => update)
      .flatMap((update) => update.kind === "yaml"
        ? update.localValidation.diagnostics.map((diagnostic) => ({ ...diagnostic, filePath: update.projectPath }))
        : []),
    readDependencyCheckBatch: ({ requests }) => ({
      results: requests.map(({ requestId, componentPath, projectPath, check }) => {
        const visible = visibleYamlUpdates(current(), componentPath)
        return visible.some((update) => update.projectPath === projectPath && hasOwner(update, check.owner))
          ? { requestId, status: "found" as const, input: dependencyInput(visible) }
          : { requestId, status: "missing" as const }
      }),
    }),
    validateDependencies: () => [],
    readComponentProjection(componentPath) {
      return {
        componentPath,
        updates: [...current().values()]
          .map(({ update }) => update)
          .filter((update) => update.componentPath === componentPath),
      }
    },
    createReadToken() {
      const token = new Uint8Array([nextToken++]) as ProjectStateReadToken
      tokens.add(tokenKey(token))
      return token
    },
    commitUpdate() {
      if (staged === undefined) throw new Error("Нет активного обновления")
      committed.clear()
      staged.forEach((value, key) => committed.set(key, value))
      staged = undefined
    },
    rollbackUpdate() {
      staged = undefined
    },
    async checkpoint() {},
    close() {},
  }

  return {
    store,
    openReadSession(token: ProjectStateReadToken): ProjectStateReadSession {
      if (!tokens.has(tokenKey(token))) throw new Error("Неизвестный token чтения")
      return testStoreReadSession(token, committed, () => tokens.delete(tokenKey(token)))
    },
  }
}

function testStoreReadSession(
  token: ProjectStateReadToken,
  updates: Map<string, StoredUpdate>,
  onClose?: () => void
): ProjectStateReadSession {
  let closed = false
  const assertOpen = (): void => {
    if (closed) throw new ProjectStateReadSessionClosedError(token)
  }
  const visibleYamlUpdatesForSession = (componentPath: string) => visibleYamlUpdates(updates, componentPath)

  return {
    resolveTargets(requests) {
      assertOpen()
      return requests.map(({ requestId, componentPath, canonicalTarget }) => {
        const targets = visibleYamlUpdatesForSession(componentPath)
          .flatMap((update) => update.references)
          .filter((reference) => reference.canonical === canonicalTarget)
        return targets.length !== 1
          ? { requestId, status: "missing" as const }
          : { requestId, status: "found" as const, target: targets[0]! }
      })
    },
    readOwners(requests) {
      assertOpen()
      return requests.map(({ requestId, componentPath, owner }) => {
        const matches = visibleYamlUpdatesForSession(componentPath)
          .flatMap((update) => update.owners)
          .filter(({ owner: candidate }) => candidate.kind === owner.kind && candidate.name === owner.name)
        return matches.length !== 1
          ? { requestId, status: "missing" as const }
          : { requestId, status: "found" as const, facts: matches[0]!.facts }
      })
    },
    findReferences(requests) {
      assertOpen()
      return requests.map(({ requestId, componentPath, canonical }) => ({
        requestId,
        references: visibleYamlUpdatesForSession(componentPath)
          .filter((update) => update.references.some((reference) => reference.canonical === canonical))
          .map(({ projectPath, componentPath }) => ({ projectPath, componentPath })),
      }))
    },
    readDependencyInputs(requests) {
      assertOpen()
      return requests.map(({ requestId, componentPath, projectPath, check }) => {
        const visible = visibleYamlUpdatesForSession(componentPath)
        if (!visible.some((update) => update.projectPath === projectPath && hasOwner(update, check.owner))) {
          return { requestId, status: "missing" as const }
        }
        return {
          requestId,
          status: "found" as const,
          input: dependencyInput(visible),
        }
      })
    },
    close() {
      if (closed) return
      closed = true
      onClose?.()
    },
  }
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

function dependencyInput(updates: readonly ProjectStateYamlFileUpdate[]) {
  return {
    owners: updates.flatMap((update) => update.owners),
    fields: updates.flatMap((update) => update.fields),
    forms: updates.flatMap((update) => update.forms),
  }
}

function hasOwner(update: ProjectStateYamlFileUpdate, expected: { readonly kind: string; readonly name?: string }): boolean {
  return update.owners.some(({ owner }) => owner.kind === expected.kind && owner.name === expected.name)
}

interface StoredUpdate {
  readonly update: ProjectStateFileUpdate
  readonly hashBytes: Uint8Array
}

function equalBytes(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength && left.every((byte, index) => byte === right[index])
}

function identity(update: ProjectStateFileUpdate) {
  const { projectPath, componentPath, resourceKind, yamlRole } = update
  return yamlRole === undefined
    ? { projectPath, componentPath, resourceKind }
    : { projectPath, componentPath, resourceKind, yamlRole }
}

function tokenKey(token: Uint8Array): string {
  return [...token].join(",")
}
