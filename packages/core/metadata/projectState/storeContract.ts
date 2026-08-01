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
    it("позиционно сопоставляет несколько разных восьмибайтовых big-endian хэшей", () => {
      const { store } = factory()
      const updates = [
        yamlUpdate("cf/Товары.yaml", "cf", "Catalog.Товары"),
        resourceUpdate("cf/Модуль.bsl", "cf"),
        resourceUpdate("cf/Картинка.bin", "cf"),
      ]
      const hashBytes = Uint8Array.from([
        0x80, 2, 3, 4, 5, 6, 7, 8,
        9, 10, 11, 12, 13, 14, 15, 16,
        17, 18, 19, 20, 21, 22, 23, 0xff,
      ])

      store.beginUpdate()
      store.replaceFiles({ updates, hashBytes })
      store.commitUpdate()

      expect(store.compareFiles({ files: updates.map(identity), hashBytes })).toEqual({ changed: [], deleted: [] })
      const changedBytes = hashBytes.slice()
      changedBytes[8] = 0xff
      expect(store.compareFiles({ files: updates.map(identity), hashBytes: changedBytes })).toEqual({
        changed: [{ index: 1, file: identity(updates[1]!) }],
        deleted: [],
      })
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

    it("отвергает вложенную внешнюю транзакцию", () => {
      const { store } = factory()
      store.beginUpdate()

      expect(() => store.beginUpdate()).toThrow()

      store.rollbackUpdate()
    })

    it("сохраняет замену, откатывает удаление и каскадно удаляет все вклады файла", () => {
      const { store, openReadSession } = factory()
      const update = richYamlUpdate("cfe/Цены/Товары.yaml", "cfe/Цены", "Catalog.Цены", "Исходная локальная ошибка")
      const replacement = richYamlUpdate(
        update.projectPath,
        update.componentPath,
        "Catalog.ИзменённыеЦены",
        "Новая локальная ошибка"
      )
      const hashBytes = new Uint8Array(8)
      const presentContribution = { owner: "found", reference: 1, dependency: "found", fields: 1, forms: 1 }
      const missingContribution = { owner: "missing", reference: 0, dependency: "missing", fields: 0, forms: 0 }

      expect(diagnostic(replacement)).not.toEqual(diagnostic(update))

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
      const cfe = richYamlUpdate("cfe/Цены/Цены.yaml", "cfe/Цены", "Catalog.Цены", "Локальная ошибка цен")
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
      expect(result[0]).toEqual({
        requestId: "cfe",
        status: "found",
        target: { kind: "object", canonical: "Catalog.Цены" },
      })

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

    it("не выбирает произвольный результат при неоднозначном target или owner", () => {
      const { store, openReadSession } = factory()
      const first = yamlUpdate("cf/Первый.yaml", "cf", "Catalog.Дубликат")
      const second = yamlUpdate("cf/Второй.yaml", "cf", "Catalog.Дубликат")
      store.beginUpdate()
      store.replaceFiles({ updates: [first, second], hashBytes: new Uint8Array(16) })
      store.commitUpdate()

      const session = openReadSession(store.createReadToken())
      expect(session.resolveTargets([
        { requestId: "target", componentPath: "cf", canonicalTarget: "Catalog.Дубликат" },
      ])).toEqual([{ requestId: "target", status: "missing" }])
      expect(session.readOwners([
        { requestId: "owner", componentPath: "cf", owner: owner("Catalog.Дубликат") },
      ])).toEqual([{ requestId: "owner", status: "missing" }])
      session.close()
    })

    it("сохраняет dependency-вклад source-файла при удалении target-файла", () => {
      const { store } = factory()
      const source = {
        ...richYamlUpdate("cf/Источник.yaml", "cf", "Catalog.Источник", "Ошибка источника"),
        dependencies: ["Catalog.Цель"],
      }
      const target = yamlUpdate("cf/Цель.yaml", "cf", "Catalog.Цель")
      store.beginUpdate()
      store.replaceFiles({ updates: [source, target], hashBytes: new Uint8Array(16) })
      store.commitUpdate()

      store.beginUpdate()
      store.deleteFiles([target.projectPath])
      store.commitUpdate()

      expect(store.readComponentProjection("cf").updates).toEqual([source])
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

function richYamlUpdate(
  projectPath: string,
  componentPath: string,
  canonical: string,
  diagnosticMessage: string
): ProjectStateYamlFileUpdate {
  const update = yamlUpdate(projectPath, componentPath, canonical)
  const typeInfo = { kinds: ["scalar"] as const, nextTypes: [] }
  return {
    ...update,
    localValidation: {
      contributedFacts: true,
      diagnostics: [
        { line: 1, col: 1, severity: "error", source: "cross-file", message: diagnosticMessage },
        { line: 2, col: 3, severity: "warning", source: "external-file", message: `${diagnosticMessage}: вторая` },
      ],
      schemaDiagnostics: [],
    },
    pendingReferences: [{
      yamlPath: ["Ссылка"],
      canonical: "Catalog.Товары",
      target: { kind: "object", root: "Catalog", objectName: "Товары" },
      constraint: { kind: "object" },
    }],
    owners: [{ owner: owner(canonical), facts: { registerType: "InformationRegister" } }],
    fields: [{ owner: owner(canonical), name: "Код", kind: "attribute", typeInfo }],
    forms: [{
      kind: "root",
      owner: owner(canonical),
      name: "Объект",
      source: { kind: "formAttribute", name: "Объект", typeInfo },
    }],
    pendingChecks: [{
      kind: "dataPath",
      location: { line: 4, col: 5, path: "/ПутьКДанным" },
      owner: owner(canonical),
      value: "Объект.Код",
      policyInput: { yaml: "ПутьКДанным" },
      policy: "formDataPath",
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
