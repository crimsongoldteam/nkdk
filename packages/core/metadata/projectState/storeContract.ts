import { describe, expect, it } from "vitest"
import type { ProjectStateReadToken } from "./contracts"
import type { ProjectStateFileUpdate } from "./fileUpdate"
import type { ProjectStateReadSession } from "./readSession"
import type { ProjectStateStore } from "./store"

export interface ProjectStateStoreContractFixture {
  readonly store: ProjectStateStore
  openReadSession(token: ProjectStateReadToken): ProjectStateReadSession
}

export type ProjectStateStoreContractFactory = () => ProjectStateStoreContractFixture

export function runProjectStateStoreContract(factory: ProjectStateStoreContractFactory): void {
  describe("ProjectStateStore contract", () => {
    it("заменяет файлы и сопоставляет все восемь big-endian байтов хэша", () => {
      const { store } = factory()
      const update = yamlUpdate("cf/Товары.yaml", "cf", "Catalog.Товары")
      const hashBytes = Uint8Array.from([0x80, 2, 3, 4, 5, 6, 7, 8])

      store.beginUpdate()
      store.replaceFiles({ updates: [update], hashBytes })
      store.commitUpdate()

      expect(store.compareFiles({ files: [identity(update)], hashBytes })).toEqual({ changed: [], deleted: [] })
      expect(
        store.compareFiles({
          files: [identity(update)],
          hashBytes: Uint8Array.from([8, 7, 6, 5, 4, 3, 2, 0x80]),
        })
      ).toEqual({ changed: [{ index: 0, file: identity(update) }], deleted: [] })
    })

    it.each([new Uint8Array(7), new Uint8Array(9)])("отклоняет общий буфер хэшей неправильной длины", (hashBytes) => {
      const { store } = factory()
      store.beginUpdate()
      expect(() => store.replaceFiles({ updates: [resourceUpdate("cf/a.bin", "cf")], hashBytes })).toThrow()
      store.rollbackUpdate()
    })

    it("откатывает замену и каскадно удаляет связанные с файлом данные", () => {
      const { store, openReadSession } = factory()
      const update = yamlUpdate("cfe/Цены/Товары.yaml", "cfe/Цены", "Catalog.Цены")
      const hashBytes = new Uint8Array(8)

      store.beginUpdate()
      store.replaceFiles({ updates: [update], hashBytes })
      store.rollbackUpdate()
      expect(store.readComponentProjection("cfe/Цены").updates).toEqual([])

      store.beginUpdate()
      store.replaceFiles({ updates: [update], hashBytes })
      store.commitUpdate()
      const beforeDeletion = openReadSession(store.createReadToken())
      expect(beforeDeletion.resolveTargets([
        { requestId: "before", componentPath: "cfe/Цены", canonicalTarget: "Catalog.Цены" },
      ])).toMatchObject([{ requestId: "before", status: "found" }])
      beforeDeletion.close()

      store.beginUpdate()
      store.deleteFiles([update.projectPath])
      store.commitUpdate()
      const afterDeletion = openReadSession(store.createReadToken())
      expect(afterDeletion.resolveTargets([
        { requestId: "after", componentPath: "cfe/Цены", canonicalTarget: "Catalog.Цены" },
      ])).toEqual([{ requestId: "after", status: "missing" }])
    })

    it("ограничивает видимость cf и своего компонента, сохраняя порядок пакетных ответов", () => {
      const { store, openReadSession } = factory()
      const cf = yamlUpdate("cf/Товары.yaml", "cf", "Catalog.Товары")
      const cfe = yamlUpdate("cfe/Цены/Цены.yaml", "cfe/Цены", "Catalog.Цены")

      store.beginUpdate()
      store.replaceFiles({ updates: [cf, cfe], hashBytes: new Uint8Array(16) })
      store.commitUpdate()

      const session = openReadSession(store.createReadToken())
      const result = session.resolveTargets([
        { requestId: "cfe", componentPath: "cfe/Цены", canonicalTarget: "Catalog.Цены" },
        { requestId: "cf", componentPath: "cfe/Цены", canonicalTarget: "Catalog.Товары" },
        { requestId: "hidden", componentPath: "cf", canonicalTarget: "Catalog.Цены" },
      ])

      expect(result.map(({ requestId, status }) => ({ requestId, status }))).toEqual([
        { requestId: "cfe", status: "found" },
        { requestId: "cf", status: "found" },
        { requestId: "hidden", status: "missing" },
      ])
    })

    it("отвергает чужой token и не даёт закрытому сеансу читать или писать", () => {
      const { store, openReadSession } = factory()
      expect(() => openReadSession(new Uint8Array(1) as ProjectStateReadToken)).toThrow()

      const session = openReadSession(store.createReadToken())
      expect("replaceFiles" in session).toBe(false)
      session.close()
      expect(() => session.resolveTargets([])).toThrow()
      expect(() => session.readOwners([])).toThrow()
      expect(() => session.findReferences([])).toThrow()
      expect(() => session.readDependencyInputs([])).toThrow()
    })
  })
}

function resourceUpdate(projectPath: string, componentPath: string): ProjectStateFileUpdate {
  return { kind: "resource", projectPath, componentPath, resourceKind: "resource" }
}

function yamlUpdate(projectPath: string, componentPath: string, canonical: string): ProjectStateFileUpdate {
  return {
    kind: "yaml",
    projectPath,
    componentPath,
    resourceKind: "yaml",
    yamlRole: "configuration",
    localValidation: { contributedFacts: true, diagnostics: [], schemaDiagnostics: [] },
    references: [{ kind: "object", canonical }],
    pendingReferences: [],
    owners: [],
    fields: [],
    forms: [],
    pendingChecks: [],
    dependencies: [],
  }
}

function identity(update: ProjectStateFileUpdate) {
  const { projectPath, componentPath, resourceKind, yamlRole } = update
  return yamlRole === undefined
    ? { projectPath, componentPath, resourceKind }
    : { projectPath, componentPath, resourceKind, yamlRole }
}
