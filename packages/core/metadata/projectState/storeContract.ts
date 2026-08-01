import { describe, expect, it } from "vitest"
import type { ProjectStateReadToken } from "./contracts"
import type { ProjectStateFileUpdate, ProjectStateYamlFileUpdate } from "./fileUpdate"
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

    it.each([
      ["короткий", new Uint8Array(7)],
      ["длинный", new Uint8Array(9)],
      ["смещённый", new Uint8Array(new ArrayBuffer(9), 1, 8)],
      ["с увеличенным backing buffer", new Uint8Array(new ArrayBuffer(9), 0, 8)],
    ])("отклоняет %s общий буфер хэшей в replaceFiles и compareFiles", (_name, hashBytes) => {
      const { store } = factory()
      store.beginUpdate()
      expect(() => store.replaceFiles({ updates: [resourceUpdate("cf/a.bin", "cf")], hashBytes })).toThrow()
      store.rollbackUpdate()
      expect(() => store.compareFiles({ files: [identity(resourceUpdate("cf/a.bin", "cf"))], hashBytes })).toThrow()
    })

    it("сохраняет замену, откатывает удаление и каскадно удаляет все вклады файла", () => {
      const { store, openReadSession } = factory()
      const update = richYamlUpdate("cfe/Цены/Товары.yaml", "cfe/Цены", "Catalog.Цены")
      const replacement = richYamlUpdate(update.projectPath, update.componentPath, "Catalog.ИзменённыеЦены")
      const hashBytes = new Uint8Array(8)
      const presentContribution = { owner: "found", reference: 1, dependency: "found", fields: 1, forms: 1 }
      const missingContribution = { owner: "missing", reference: 0, dependency: "missing", fields: 0, forms: 0 }

      store.beginUpdate()
      store.replaceFiles({ updates: [update], hashBytes })
      store.commitUpdate()
      expectStoredFile(store, openReadSession, update, presentContribution)

      store.beginUpdate()
      store.replaceFiles({ updates: [replacement], hashBytes })
      store.rollbackUpdate()
      expectStoredFile(store, openReadSession, update, presentContribution)

      store.beginUpdate()
      store.replaceFiles({ updates: [replacement], hashBytes })
      store.commitUpdate()
      expectStoredFile(store, openReadSession, replacement, presentContribution)
      expect(readFileContributions(openReadSession(store.createReadToken()), update)).toEqual(missingContribution)

      store.beginUpdate()
      store.deleteFiles([replacement.projectPath])
      store.rollbackUpdate()
      expectStoredFile(store, openReadSession, replacement, presentContribution)

      store.beginUpdate()
      store.deleteFiles([replacement.projectPath])
      store.commitUpdate()
      expect(store.readComponentProjection(replacement.componentPath).updates).toEqual([])
      expect(store.readLocalDiagnostics()).toEqual([])
      expect(readFileContributions(openReadSession(store.createReadToken()), replacement)).toEqual(missingContribution)
      expect(readStoredDependency(store, replacement)).toEqual({ status: "missing" })
    })

    it("ограничивает видимость cf и своего компонента, сохраняя порядок пакетных ответов", () => {
      const { store, openReadSession } = factory()
      const cf = yamlUpdate("cf/Товары.yaml", "cf", "Catalog.Товары")
      const cfe = yamlUpdate("cfe/Цены/Цены.yaml", "cfe/Цены", "Catalog.Цены")
      const foreignCfe = yamlUpdate("cfe/Скидки/Скидки.yaml", "cfe/Скидки", "Catalog.Скидки")

      store.beginUpdate()
      store.replaceFiles({ updates: [cf, cfe, foreignCfe], hashBytes: new Uint8Array(24) })
      store.commitUpdate()

      const session = openReadSession(store.createReadToken())
      const result = session.resolveTargets([
        { requestId: "cfe", componentPath: "cfe/Цены", canonicalTarget: "Catalog.Цены" },
        { requestId: "cf", componentPath: "cfe/Цены", canonicalTarget: "Catalog.Товары" },
        { requestId: "foreign", componentPath: "cfe/Цены", canonicalTarget: "Catalog.Скидки" },
      ])

      expect(result.map(({ requestId, status }) => ({ requestId, status }))).toEqual([
        { requestId: "cfe", status: "found" },
        { requestId: "cf", status: "found" },
        { requestId: "foreign", status: "missing" },
      ])

      expect(session.readOwners([
        { requestId: "own-owner", componentPath: "cfe/Цены", owner: owner("Catalog.Цены") },
        { requestId: "cf-owner", componentPath: "cfe/Цены", owner: owner("Catalog.Товары") },
        { requestId: "foreign-owner", componentPath: "cfe/Цены", owner: owner("Catalog.Скидки") },
      ]).map(({ requestId, status }) => ({ requestId, status }))).toEqual([
        { requestId: "own-owner", status: "found" },
        { requestId: "cf-owner", status: "found" },
        { requestId: "foreign-owner", status: "missing" },
      ])
      expect(session.findReferences([
        { requestId: "own-reference", componentPath: "cfe/Цены", canonical: "Catalog.Цены" },
        { requestId: "cf-reference", componentPath: "cfe/Цены", canonical: "Catalog.Товары" },
        { requestId: "foreign-reference", componentPath: "cfe/Цены", canonical: "Catalog.Скидки" },
      ]).map(({ requestId, references }) => ({ requestId, found: references.length > 0 }))).toEqual([
        { requestId: "own-reference", found: true },
        { requestId: "cf-reference", found: true },
        { requestId: "foreign-reference", found: false },
      ])
      expect(session.readDependencyInputs([
        dependencyQuery("own-dependency", "cfe/Цены", cfe.projectPath, "Catalog.Цены"),
        dependencyQuery("cf-dependency", "cfe/Цены", cf.projectPath, "Catalog.Товары"),
        dependencyQuery("foreign-dependency", "cfe/Цены", foreignCfe.projectPath, "Catalog.Скидки"),
      ]).map(({ requestId, status }) => ({ requestId, status }))).toEqual([
        { requestId: "own-dependency", status: "found" },
        { requestId: "cf-dependency", status: "found" },
        { requestId: "foreign-dependency", status: "missing" },
      ])
    })

    it("отвергает чужой и уже использованный закрытый token, не давая сеансу писать", () => {
      const { store, openReadSession } = factory()
      expect(() => openReadSession(new Uint8Array(1) as ProjectStateReadToken)).toThrow()

      const token = store.createReadToken()
      const session = openReadSession(token)
      expect("replaceFiles" in session).toBe(false)
      session.close()
      expect(() => session.resolveTargets([])).toThrow()
      expect(() => session.readOwners([])).toThrow()
      expect(() => session.findReferences([])).toThrow()
      expect(() => session.readDependencyInputs([])).toThrow()
      expect(() => openReadSession(token)).toThrow()
    })
  })
}

function resourceUpdate(projectPath: string, componentPath: string): ProjectStateFileUpdate {
  return { kind: "resource", projectPath, componentPath, resourceKind: "resource" }
}

function yamlUpdate(projectPath: string, componentPath: string, canonical: string): ProjectStateYamlFileUpdate {
  return {
    kind: "yaml",
    projectPath,
    componentPath,
    resourceKind: "yaml",
    yamlRole: "configuration",
    localValidation: { contributedFacts: true, diagnostics: [], schemaDiagnostics: [] },
    references: [{ kind: "object", canonical }],
    pendingReferences: [],
    owners: [{ owner: owner(canonical), facts: {} }],
    fields: [],
    forms: [],
    pendingChecks: [],
    dependencies: [],
  }
}

function owner(canonical: string) {
  return { kind: "Справочник", name: canonical }
}

function dependencyQuery(requestId: string, componentPath: string, projectPath: string, ownerName = "Catalog.Товары") {
  return {
    requestId,
    componentPath,
    projectPath,
    check: {
      kind: "dataPath" as const,
      location: { line: 1, col: 1 },
      owner: owner(ownerName),
      value: "Объект",
      policyInput: { yaml: "ПутьКДанным" },
      policy: "formDataPath" as const,
    },
  }
}

function richYamlUpdate(projectPath: string, componentPath: string, canonical: string): ProjectStateYamlFileUpdate {
  const update = yamlUpdate(projectPath, componentPath, canonical)
  const typeInfo = { kinds: ["scalar"] as const, nextTypes: [] }
  return {
    ...update,
    localValidation: {
      contributedFacts: true,
      diagnostics: [{ line: 1, col: 1, severity: "error", source: "cross-file", message: "Локальная ошибка" }],
      schemaDiagnostics: [],
    },
    fields: [{ owner: owner(canonical), name: "Код", kind: "attribute", typeInfo }],
    forms: [{
      kind: "root",
      owner: owner(canonical),
      name: "Объект",
      source: { kind: "formAttribute", name: "Объект", typeInfo },
    }],
    dependencies: ["Catalog.Товары"],
  }
}

function diagnostic(update: ProjectStateFileUpdate) {
  if (update.kind !== "yaml") throw new Error("Диагностика бывает только у YAML-файла")
  return update.localValidation.diagnostics.map((item) => ({ ...item, filePath: update.projectPath }))
}

function readFileContributions(session: ProjectStateReadSession, update: ProjectStateFileUpdate) {
  if (update.kind !== "yaml") throw new Error("Вклады бывают только у YAML-файла")
  const ownerResult = session.readOwners([
    { requestId: "owner", componentPath: update.componentPath, owner: update.owners[0]!.owner },
  ])
  const referenceResult = session.findReferences([
    { requestId: "reference", componentPath: update.componentPath, canonical: update.references[0]!.canonical },
  ])
  const dependencyResult = session.readDependencyInputs([
    dependencyQuery("dependency", update.componentPath, update.projectPath, update.owners[0]!.owner.name ?? ""),
  ])
  session.close()
  return {
    owner: ownerResult[0]!.status,
    reference: referenceResult[0]!.references.length,
    dependency: dependencyResult[0]!.status,
    fields: dependencyResult[0]!.status === "found" ? dependencyResult[0]!.input.fields.length : 0,
    forms: dependencyResult[0]!.status === "found" ? dependencyResult[0]!.input.forms.length : 0,
  }
}

function readStoredDependency(store: ProjectStateStore, update: ProjectStateFileUpdate) {
  const [result] = store.readDependencyCheckBatch({
    requests: [dependencyQuery("stored-dependency", update.componentPath, update.projectPath, update.kind === "yaml" ? update.owners[0]!.owner.name ?? "" : "")],
  }).results
  return result?.status === "found"
    ? { status: result.status, input: result.input }
    : { status: "missing" as const }
}

function expectStoredFile(
  store: ProjectStateStore,
  openReadSession: (token: ProjectStateReadToken) => ProjectStateReadSession,
  update: ProjectStateYamlFileUpdate,
  contribution: { readonly owner: string; readonly reference: number; readonly dependency: string; readonly fields: number; readonly forms: number }
): void {
  expect(store.readComponentProjection(update.componentPath).updates).toEqual([update])
  expect(store.readLocalDiagnostics()).toEqual(diagnostic(update))
  expect(readFileContributions(openReadSession(store.createReadToken()), update)).toEqual(contribution)
  expect(readStoredDependency(store, update)).toEqual({ status: "found", input: expectedDependencyInput(update) })
}

function expectedDependencyInput(update: ProjectStateYamlFileUpdate) {
  return {
    owners: update.owners,
    fields: update.fields,
    forms: update.forms,
  }
}

function identity(update: ProjectStateFileUpdate) {
  const { projectPath, componentPath, resourceKind, yamlRole } = update
  return yamlRole === undefined
    ? { projectPath, componentPath, resourceKind }
    : { projectPath, componentPath, resourceKind, yamlRole }
}
