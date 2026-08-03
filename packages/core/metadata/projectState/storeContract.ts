import { describe, expect, it } from "vitest"
import {
  encodeProjectStateFileUpdateBatch,
  encodeProjectStateImportFinalBatch,
  encodeProjectStateImportIndexBatch,
} from "./binary/contribution"
import type { ProjectStateReadToken } from "./contracts"
import type { ProjectStateFileIdentity, ProjectStateFileUpdate, ProjectStateYamlFileUpdate } from "./fileUpdate"
import type {
  ProjectStateImportFinalFileStateBatch,
  ProjectStateImportIndexContribution,
} from "./importSession"
import { ProjectStateReadSessionClosedError, type ProjectStateReadSession } from "./readSession"
import type { ProjectStateStore } from "./store"
import { resourceUpdate, richYamlUpdate, yamlUpdate } from "./binary/testData"

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
      replaceFiles(store, { updates, hashBytes })
      store.commitUpdate()

      expect(store.compareFiles({ files: updates.map(identity), hashBytes })).toEqual({ changed: [], deleted: [] })
      const changedBytes = hashBytes.slice()
      changedBytes[8] = 0xff
      expect(store.compareFiles({ files: updates.map(identity), hashBytes: changedBytes })).toEqual({
        changed: [{ index: 1, file: identity(updates[1]!) }],
        deleted: [],
      })
    })

    it("пакетно возвращает сохранённые хэши и исчезнувшие пути", () => {
      const { store } = factory()
      const first = resourceUpdate("cf/Первый.bin", "cf")
      const second = resourceUpdate("cf/Второй.bin", "cf")
      const discovered = resourceUpdate("cf/Новый.bin", "cf")
      const firstHash = Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8])
      const secondHash = Uint8Array.from([9, 10, 11, 12, 13, 14, 15, 16])

      store.beginUpdate()
      replaceFiles(store, {
        updates: [first, second],
        hashBytes: Uint8Array.from([...firstHash, ...secondHash]),
      })
      store.commitUpdate()

      const baseline = store.readFileBaseline([identity(first), identity(discovered)])

      expect(baseline.knownHashBits).toEqual(Uint8Array.of(0b0000_0001))
      expect(baseline.hashBytes).toEqual(Uint8Array.from([...firstHash, ...new Uint8Array(8)]))
      expect(baseline.deleted).toEqual([identity(second)])
    })

    it.each([
      ["короткий", new Uint8Array(7)],
      ["длинный", new Uint8Array(9)],
      ["смещённый", new Uint8Array(new ArrayBuffer(9), 1, 8)],
      ["с увеличенным backing buffer", new Uint8Array(new ArrayBuffer(9), 0, 8)],
    ])("отклоняет %s общий буфер хэшей в replaceFiles и compareFiles", (_name, hashBytes) => {
      const { store } = factory()
      store.beginUpdate()
      expect(() => replaceFiles(store, { updates: [resourceUpdate("cf/a.bin", "cf")], hashBytes })).toThrow()
      store.rollbackUpdate()
      expect(() => store.compareFiles({ files: [identity(resourceUpdate("cf/a.bin", "cf"))], hashBytes })).toThrow()
    })

    it("отвергает вложенную внешнюю транзакцию", () => {
      const { store } = factory()
      store.beginUpdate()

      expect(() => store.beginUpdate()).toThrow()

      store.rollbackUpdate()
    })

    it.each([
      ["componentPath", { componentPath: "cfe/Чужой" }],
      ["resourceKind", { resourceKind: "resource", kind: "resource", yamlRole: undefined }],
      ["yamlRole", { yamlRole: "form" }],
    ] as const)("final import не меняет identity индексированного YAML: %s", (_field, override) => {
      const { store, openReadSession } = factory()
      const contribution = importIndex("cf/Товары.yaml", "cf", "Catalog.Товары")
      store.beginUpdate()
      store.replaceImportIndex(encodeProjectStateImportIndexBatch([contribution]))
      store.commitUpdate()

      const before = openReadSession(store.createReadToken())
      expect(before.resolveTargets([{
        requestId: "before",
        componentPath: "cf",
        canonicalTarget: "Catalog.Товары",
      }])[0]).toMatchObject({ status: "found" })
      before.close()

      store.beginUpdate()
      const finalState = "kind" in override && override.kind === "resource"
        ? {
            projectPath: contribution.projectPath,
            componentPath: contribution.componentPath,
            resourceKind: "resource" as const,
            kind: "resource" as const,
          }
        : { ...importFinal(contribution), ...override }
      expect(() => store.replaceImportFinalFileState(encodeProjectStateImportFinalBatch(importFinalBatch(finalState))))
        .toThrow(/identity|идентич/iu)
      store.rollbackUpdate()

      const after = openReadSession(store.createReadToken())
      expect(after.resolveTargets([{
        requestId: "after",
        componentPath: "cf",
        canonicalTarget: "Catalog.Товары",
      }])[0]).toMatchObject({ status: "found" })
      after.close()
    })

    it("final import требует предварительно зарегистрированную identity", () => {
      const { store } = factory()
      const contribution = importIndex("cf/Товары.yaml", "cf", "Catalog.Товары")

      store.beginUpdate()
      expect(() => store.replaceImportFinalFileState(encodeProjectStateImportFinalBatch(importFinalBatch(importFinal(contribution)))))
        .toThrow(/не зарегистрирована|identity/iu)
      store.rollbackUpdate()
    })

    it("очищает stale-файлы только внутри импортируемой component boundary", () => {
      const { store } = factory()
      const stale = yamlUpdate("cf/Старый.yaml", "cf", "Catalog.Старый")
      const neighbor = yamlUpdate("cfe/Цены/Сохранить.yaml", "cfe/Цены", "Catalog.Сохранить")
      store.beginUpdate()
      replaceFiles(store, { updates: [stale, neighbor], hashBytes: new Uint8Array(16) })
      store.commitUpdate()

      store.beginUpdate()
      ;(store as ProjectStateStore & { clearImportOutput(componentPaths: readonly string[]): void })
        .clearImportOutput(["cf"])
      const current = importIndex("cf/Новый.yaml", "cf", "Catalog.Новый")
      store.replaceImportIndex(encodeProjectStateImportIndexBatch([current]))
      store.replaceImportFinalFileState(encodeProjectStateImportFinalBatch(importFinalBatch(importFinal(current))))
      store.commitUpdate()

      expect(store.readComponentProjection("cf").updates.map(({ projectPath }) => projectPath)).toEqual(["cf/Новый.yaml"])
      expect(store.readComponentProjection("cfe/Цены").updates.map(({ projectPath }) => projectPath))
        .toEqual([neighbor.projectPath])
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
      const presentContribution = { owner: "found", reference: 1, dependency: "found", fields: 3, forms: 1 }
      const missingContribution = { owner: "missing", reference: 0, dependency: "missing", fields: 0, forms: 0 }

      expect(diagnostic(replacement)).not.toEqual(diagnostic(update))

      store.beginUpdate()
      replaceFiles(store, { updates: [update], hashBytes })
      store.commitUpdate()
      expectStoredFile(store, openReadSession, update, presentContribution)

      store.beginUpdate()
      replaceFiles(store, { updates: [replacement], hashBytes })
      store.rollbackUpdate()
      expectStoredFile(store, openReadSession, update, presentContribution)

      store.beginUpdate()
      replaceFiles(store, { updates: [replacement], hashBytes })
      store.commitUpdate()
      expectStoredFile(store, openReadSession, replacement, presentContribution)
      expect(readFileContributions(openReadSession(store.createReadToken()), update)).toEqual({
        ...missingContribution,
        reference: 1,
      })

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

    it("возвращает точные YAML-пути metadata- и DataPath-обращений", () => {
      const { store, openReadSession } = factory()
      const targetBase = richYamlUpdate("cf/Справочник/Товары/Свойства.yaml", "cf", "Catalog.Товары", "Ошибка")
      const target: ProjectStateYamlFileUpdate = { ...targetBase, pendingReferences: [], pendingChecks: [] }
      const sourceBase = richYamlUpdate("cf/Справочник/Заказы/Формы/Форма/Форма.yaml", "cf", "Catalog.Заказы", "Ошибка")
      const source: ProjectStateYamlFileUpdate = {
        ...sourceBase,
        pendingChecks: sourceBase.pendingChecks.map((check) => ({ ...check, value: "Объект.Артикул" })),
        forms: [{
          kind: "root",
          owner: owner("Catalog.Заказы"),
          name: "Объект",
          source: {
            kind: "formAttribute",
            name: "Объект",
            typeInfo: { kinds: ["object"], nextTypes: [owner("Catalog.Товары")] },
          },
        }],
      }

      store.beginUpdate()
      replaceFiles(store, { updates: [target, source], hashBytes: new Uint8Array(16) })
      store.commitUpdate()

      const session = openReadSession(store.createReadToken())
      expect(session.findReferences([{
        requestId: "target",
        componentPath: "cf",
        canonical: "Catalog.Товары",
        match: "prefix",
        dataPathTarget: { owner: owner("Catalog.Товары"), fieldName: "Артикул" },
      }])).toEqual([{
        requestId: "target",
        references: [
          {
            kind: "metadataTarget",
            projectPath: "cf/Справочник/Заказы/Формы/Форма/Форма.yaml",
            componentPath: "cf",
            yamlPath: ["Ссылка"],
            canonical: "Catalog.Товары",
          },
          {
            kind: "dataPath",
            projectPath: "cf/Справочник/Заказы/Формы/Форма/Форма.yaml",
            componentPath: "cf",
            yamlPath: ["ПутьКДанным"],
            value: "Объект.Артикул",
            resolvedSegments: ["Объект", "Артикул"],
            segmentIndex: 1,
          },
        ],
      }])
      session.close()
    })

    it("ограничивает видимость cf и своего компонента, сохраняя порядок пакетных ответов", () => {
      const { store, openReadSession } = factory()
      const cf = yamlUpdate("cf/Товары.yaml", "cf", "Catalog.Товары")
      const cfe = richYamlUpdate("cfe/Цены/Цены.yaml", "cfe/Цены", "Catalog.Цены", "Локальная ошибка цен")
      const foreignCfe = yamlUpdate("cfe/Скидки/Скидки.yaml", "cfe/Скидки", "Catalog.Скидки")

      store.beginUpdate()
      replaceFiles(store, { updates: [cf, cfe, foreignCfe], hashBytes: new Uint8Array(24) })
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
        source: { projectPath: "cfe/Цены/Цены.yaml", componentPath: "cfe/Цены" },
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
        { requestId: "own-reference", found: false },
        { requestId: "cf-reference", found: true },
        { requestId: "foreign-reference", found: false },
      ])
      expect(session.findReferences([{
        requestId: "cf-cannot-see-extension-reference",
        componentPath: "cf",
        canonical: "Catalog.Товары",
      }])).toEqual([{
        requestId: "cf-cannot-see-extension-reference",
        references: [],
      }])
      expect(session.readDependencyInputs([
        dependencyQuery("own-dependency", "cfe/Цены", cfe.projectPath, "Catalog.Цены"),
        dependencyQuery("cf-dependency", "cfe/Цены", cf.projectPath, "Catalog.Товары"),
        dependencyQuery("foreign-dependency", "cfe/Цены", foreignCfe.projectPath, "Catalog.Скидки"),
      ]).map(({ requestId, status }) => ({ requestId, status }))).toEqual([
        { requestId: "own-dependency", status: "found" },
        { requestId: "cf-dependency", status: "found" },
        { requestId: "foreign-dependency", status: "missing" },
      ])
      expect(session.readDependencyOwnerInputs([
        { requestId: "own-owner-input", componentPath: "cfe/Цены", owner: owner("Catalog.Цены") },
        { requestId: "cf-owner-input", componentPath: "cfe/Цены", owner: owner("Catalog.Товары") },
        { requestId: "foreign-owner-input", componentPath: "cfe/Цены", owner: owner("Catalog.Скидки") },
      ]).map(({ requestId, status }) => ({ requestId, status }))).toEqual([
        { requestId: "own-owner-input", status: "found" },
        { requestId: "cf-owner-input", status: "found" },
        { requestId: "foreign-owner-input", status: "missing" },
      ])
      expect(session.readOwnerRefPage({ componentPath: "cfe/Цены", kind: "Справочник" }).refs
        .map(({ name }) => name).sort()).toEqual(["Catalog.Товары", "Catalog.Цены"])
    })

    it("не выбирает произвольный результат при неоднозначном target или owner", () => {
      const { store, openReadSession } = factory()
      const first = yamlUpdate("cf/Первый.yaml", "cf", "Catalog.Дубликат")
      const second = yamlUpdate("cf/Второй.yaml", "cf", "Catalog.Дубликат")
      store.beginUpdate()
      replaceFiles(store, { updates: [first, second], hashBytes: new Uint8Array(16) })
      store.commitUpdate()

      const session = openReadSession(store.createReadToken())
      expect(session.resolveTargets([
        { requestId: "target", componentPath: "cf", canonicalTarget: "Catalog.Дубликат" },
      ])).toEqual([{ requestId: "target", status: "ambiguous" }])
      expect(session.readOwners([
        { requestId: "owner", componentPath: "cf", owner: owner("Catalog.Дубликат") },
      ])).toEqual([{ requestId: "owner", status: "ambiguous" }])
      session.close()
    })

    it("читает локальные вложенные targets компонента без fallback на cf", () => {
      const { store, openReadSession } = factory()
      const extension = yamlUpdate("cfe/Цены/Товары.yaml", "cfe/Цены", "Catalog.Товары")
      const nested = "Catalog.Товары.Attribute.Артикул"
      const base = yamlUpdate("cf/База.yaml", "cf", "Catalog.Базовый")
      store.beginUpdate()
      replaceFiles(store, {
        updates: [
          { ...extension, references: [...extension.references, { kind: "member", canonical: nested }] },
          base,
        ],
        hashBytes: new Uint8Array(16),
      })
      store.commitUpdate()

      const session = openReadSession(store.createReadToken())

      expect(session.readComponentTargetPage({ componentPath: "cfe/Цены" })).toEqual({
        entries: [
          { logicalAddress: "Catalog.Товары", sourceProjectPath: extension.projectPath },
          { logicalAddress: nested, sourceProjectPath: extension.projectPath },
        ],
      })
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
      replaceFiles(store, { updates: [source, target], hashBytes: new Uint8Array(16) })
      store.commitUpdate()

      store.beginUpdate()
      store.deleteFiles([target.projectPath])
      store.commitUpdate()

      expect(store.readComponentProjection("cf").updates).toEqual([source])
    })

    it("отвергает чужой и уже использованный закрытый token, не давая сеансу писать", () => {
      const { store, openReadSession } = factory()
      expect(() => openReadSession({} as ProjectStateReadToken)).toThrow()

      const token = store.createReadToken()
      const session = openReadSession(token)
      expect("replaceFiles" in session).toBe(false)
      session.close()
      expect(() => session.close()).not.toThrow()
      expect(() => session.resolveTargets([])).toThrow(ProjectStateReadSessionClosedError)
      expect(() => session.readOwners([])).toThrow(ProjectStateReadSessionClosedError)
      expect(() => session.findReferences([])).toThrow(ProjectStateReadSessionClosedError)
      expect(() => session.readDependencyInputs([])).toThrow(ProjectStateReadSessionClosedError)
      expect(() => session.readDependencyOwnerInputs([])).toThrow(ProjectStateReadSessionClosedError)
      expect(() => session.readOwnerRefPage({ componentPath: "cf", kind: "Справочник" }))
        .toThrow(ProjectStateReadSessionClosedError)
      expect(() => session.readComponentTargetPage({ componentPath: "cf" }))
        .toThrow(ProjectStateReadSessionClosedError)
      expect(() => session.readValidationStatus({ offset: 0, batchSize: 1 })).toThrow(ProjectStateReadSessionClosedError)
      expect(() => openReadSession(token)).toThrow()
    })
  })
}

function importIndex(
  projectPath: string,
  componentPath: string,
  canonical: string,
): ProjectStateImportIndexContribution {
  const update = yamlUpdate(projectPath, componentPath, canonical)
  return {
    projectPath,
    componentPath,
    resourceKind: "yaml",
    yamlRole: update.yamlRole!,
    references: update.references,
    owners: update.owners,
    fields: update.fields,
    forms: update.forms,
  }
}

function importFinal(identity: ProjectStateFileIdentity) {
  return {
    projectPath: identity.projectPath,
    componentPath: identity.componentPath,
    kind: "yaml" as const,
    resourceKind: "yaml" as const,
    yamlRole: identity.yamlRole!,
    localValidation: { contributedFacts: true, diagnostics: [], schemaDiagnostics: [] },
    pendingReferences: [],
    pendingChecks: [],
    dependencies: [],
  }
}

function importFinalBatch(update: ReturnType<typeof importFinal> | ProjectStateFileUpdate): ProjectStateImportFinalFileStateBatch {
  return { updates: [update as never], hashBytes: new Uint8Array(8) }
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
      yamlPath: ["ПутьКДанным"],
      location: { line: 1, col: 1 },
      owner: owner(ownerName),
      value: "Объект",
      policyInput: { yaml: "ПутьКДанным" },
      policy: "formDataPath" as const,
    },
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
  const referenceResult = session.findReferences([{
    requestId: "reference",
    componentPath: update.componentPath,
    canonical: update.pendingReferences[0]?.canonical ?? update.references[0]!.canonical,
  }])
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
  const [storedUpdate] = store.readComponentProjection(update.componentPath).updates
  expect(storedUpdate).toEqual(update)
  expect(storedUpdate?.kind === "yaml" ? storedUpdate.fields.map((field) => Object.keys(field).sort()) : []).toEqual([
    ["kind", "name", "owner", "parentName", "sourceCollection", "table", "tableHasColumns", "targetName", "typeInfo"],
    ["kind", "name", "owner", "tableHasColumns", "typeInfo"],
    ["kind", "name", "owner", "typeInfo"],
  ])
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

function replaceFiles(
  store: ProjectStateStore,
  batch: Parameters<typeof encodeProjectStateFileUpdateBatch>[0],
): void {
  store.replaceFiles(encodeProjectStateFileUpdateBatch(batch))
}
