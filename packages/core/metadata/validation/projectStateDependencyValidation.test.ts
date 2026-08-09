import { describe, expect, it } from "vitest"
import { parseMetadataTargetFromYAML } from "../ruleRuntime/metadataTarget"
import { validationComponentLayers } from "./componentVisibility"
import {
  createOwnerMetadataCacheFromValidationTable,
  type OwnerMetadataCache,
} from "./dataPath/ownerCache"
import { createProjectValidationGraph } from "./projectValidationGraph"
import type { FormDataPathIndex } from "./dataPath/formIndex"
import type { FormDataPathColumnSource, OwnerTypeRef } from "./dataPath/types"
import type { ObjectFieldIndex } from "./dataPath/objectFields"
import { validatePendingChecks } from "./projectValidationPendingChecks"
import {
  createProjectReferenceIndex,
  createProjectReferenceSnapshot,
  validatePendingReferencesWithIndex,
  type PendingMetadataTargetReference,
  type ProjectMemberIndexEntry,
} from "./projectReferenceIndex"
import {
  registerProjectReferenceValueContributor,
  restoreProjectReferenceIndexRegistryForTests,
  snapshotProjectReferenceIndexRegistryForTests,
} from "./projectReferenceIndexRegistry"
import { createValidationObjectTable } from "./projectValidationObjectTable"
import type {
  ComponentValidationLayer,
  ProjectValidationGraph,
  ValidationObjectRecord,
} from "./projectValidationTypes"
import type { ProjectStateFileUpdate, ProjectStateYamlFileUpdate } from "../projectState/fileUpdate"
import { createProjectStateFragmentWriter } from "../projectState/binary/fragment"
import { createBinaryProjectStateTestFixture } from "../projectState/binary/testFixture"
import { createBinaryProjectStateQueryPort } from "../projectState/binary/readSession"
import { ProjectStateSnapshotView } from "../projectState/binary/snapshot"
import {
  createProjectStateDependencyValidator,
  validateProjectStateDependencyBatch,
  validateProjectStateOwnerBatch,
  validateProjectStateReferenceBatch,
} from "./projectStateDependencyValidation"

const memberTargetResult = parseMetadataTargetFromYAML({
  value: "Справочник.Товары.Реквизит.Артикул",
  constraint: { kind: "member", owner: "explicit" },
})
if (!memberTargetResult.ok || memberTargetResult.target.kind !== "member") {
  throw new Error("Некорректная тестовая ссылка")
}
const memberTarget = memberTargetResult.target
const canonical = "Catalog.Товары.Attribute.Артикул"
const objectTargetResult = parseMetadataTargetFromYAML({
  value: "Справочник.НетТакого",
  constraint: { kind: "object" },
})
if (!objectTargetResult.ok || objectTargetResult.target.kind !== "object") {
  throw new Error("Некорректная тестовая ссылка на объект")
}
const objectTarget = objectTargetResult.target

describe("dependency validation из ProjectState", () => {
  it("Б5 принимает пустую ссылку, если владелец существует", () => {
    const reference = valueReference("Справочник.Товары.ПустаяСсылка", {
      roots: ["Catalog"],
      valueKinds: ["emptyRef"],
      allowEmptyRef: true,
    })

    const diagnostics = validateProjectStateReferenceBatch({
      projectDir: "/project",
      checks: [{ requestId: "empty-ref", componentPath: "cf", reference }],
      queryPort: missingValueQueryPort({}),
    })

    expect(diagnostics).toEqual([])
  })

  it("Б5 проверяет предопределённое значение общим поставщиком по сведениям владельца", () => {
    const registry = snapshotProjectReferenceIndexRegistryForTests()
    try {
      registerProjectReferenceValueContributor("Catalog", ({ owner, target }) => {
        if (target.valueKind === "emptyRef") return undefined
        const predefined = owner.facts.predefined as readonly { name: string }[] | undefined
        return predefined?.some(({ name }) => name === target.valueName) === true
          ? { ok: true, filePath: owner.filePath }
          : undefined
      })
      const reference = valueReference("Справочник.Товары.Основной", {
        roots: ["Catalog"],
        valueKinds: ["predefinedValue"],
      })

      const diagnostics = validateProjectStateReferenceBatch({
        projectDir: "/project",
        checks: [{ requestId: "predefined", componentPath: "cf", reference }],
        queryPort: missingValueQueryPort({ predefined: [{ name: "Основной" }] }),
      })

      expect(diagnostics).toEqual([])
    } finally {
      restoreProjectReferenceIndexRegistryForTests(registry)
    }
  })

  it("Б5 сообщает об отсутствующем предопределённом значении существующего владельца", () => {
    const registry = snapshotProjectReferenceIndexRegistryForTests()
    try {
      registerProjectReferenceValueContributor("Catalog", () => undefined)
      const reference = valueReference("Справочник.Товары.НетТакого", {
        roots: ["Catalog"],
        valueKinds: ["predefinedValue"],
      })

      const diagnostics = validateProjectStateReferenceBatch({
        projectDir: "/project",
        checks: [{ requestId: "missing-predefined", componentPath: "cf", reference }],
        queryPort: missingValueQueryPort({ predefined: [] }),
      })

      expect(diagnostics).toEqual([expect.objectContaining({
        source: "reference",
        message: 'Не найдена ссылка "Catalog.Товары.НетТакого"',
      })])
    } finally {
      restoreProjectReferenceIndexRegistryForTests(registry)
    }
  })

  it("проверяет одинакового владельца компонента один раз", () => {
    const owner = { kind: "Справочник", name: "Товары" }
    const requestBatchSizes: number[] = []

    const diagnostics = validateProjectStateOwnerBatch({
      projectDir: "/project",
      checks: [
        { requestId: "first", componentPath: "cf", owner },
        { requestId: "second", componentPath: "cf", owner },
      ],
      queryPort: {
        readOwners(requests) {
          requestBatchSizes.push(requests.length)
          return requests.map(({ requestId }) => ({ requestId, status: "found" as const, facts: {} }))
        },
      },
    })

    expect(diagnostics).toEqual([])
    expect(requestBatchSizes).toEqual([1])
  })

  it("загружает общие сведения формы один раз для всех проверок одного файла", () => {
    const source = ownerDependencySource("cf", { kind: "Справочник", name: "Товары" }, "Объект")
    const queryPort = pagedDependencyQueryPort({
      source,
      ownerFacts: new Map(),
      readPage: () => ({ refs: [] }),
    })
    const requestBatchSizes: number[] = []

    const diagnostics = validateProjectStateDependencyBatch({
      projectDir: "/project",
      checks: [
        dependencyQuery("first", source),
        { ...dependencyQuery("second", source), check: { ...source.pendingChecks[0]!, yamlPath: ["ДругойПуть"] } },
      ],
      queryPort: {
        ...queryPort,
        readDependencyInputs(requests) {
          requestBatchSizes.push(requests.length)
          return queryPort.readDependencyInputs(requests)
        },
      },
    })

    expect(diagnostics).toEqual([])
    expect(requestBatchSizes).toEqual([1])
  })

  it("проверяет fillValue через сохранённые сведения DefinedType", () => {
    const check = {
      kind: "fillValue" as const,
      yamlPath: ["Реквизиты", "Автор", "ЗначениеЗаполнения"],
      location: { line: 4, col: 5 },
      itemType: "MetadataAttribute",
      type: { type: ["DefinedType.АвторДействия"] },
      value: { type: "ref" as const, value: "Catalog.Пользователи.Администратор" },
      tagged: false,
    }
    const query = { requestId: "fill", componentPath: "cf", projectPath: "cf/Справочник/Товары/Свойства.yaml", check }
    const definedType = { kind: "ОпределяемыйТип", name: "АвторДействия" }

    expect(validateProjectStateDependencyBatch({
      projectDir: "/project",
      checks: [query],
      queryPort: {
        readDependencyInputs: () => [{
          requestId: "fill",
          status: "found",
          input: { owners: [{ owner: definedType, facts: { type: { type: ["CatalogRef.Пользователи"] } } }], fields: [], forms: [] },
        }],
        readDependencyOwnerInputs: () => [],
        readOwnerRefPage: () => ({ refs: [] }),
      },
    })).toEqual([])
  })

  it.each([
    referenceCase("missing", "cf", []),
    referenceCase("found / cf -> cf", "cf", ["cf"]),
    referenceCase("ambiguous", "cf", ["cf", "cf"]),
    referenceCase(
      "filter",
      "cf",
      ["cf"],
      { kind: "member", owner: "explicit", filters: [{ kind: "hasType", type: "string" }] },
      { kind: "attribute", typeInfo: { kinds: ["decimal"], sourceText: "decimal" } },
    ),
    referenceCase("cfe/x -> cfe/x", "cfe/x", ["cfe/x"]),
    referenceCase("fallback cfe/x -> cf", "cfe/x", ["cf"]),
    referenceCase("forbidden cfe/x -> cfe/y", "cfe/x", ["cfe/y"]),
  ])("полностью совпадает с чистым validation-графом: $name", ({ sourceComponent, updates, graph }) => {
    const graphDiagnostics = validatePendingReferencesWithIndex({
      index: createReferenceIndexFromGraphForTests(graph, sourceComponent),
      references: graph.layers.find(({ componentPath }) => componentPath === sourceComponent)!.contribution
        .pendingReferences!,
    }).diagnostics
    const store = storeWithUpdates(updates)

    const storeDiagnostics = store.validateDependencies({
      requests: [{ requestId: "reference", componentPath: sourceComponent, projectPath: updates[0]!.projectPath }],
    })

    expect(storeDiagnostics).toEqual(graphDiagnostics)
    store.rollbackUpdate()
  })

  it("привязывает отсутствующий объект к ожидаемому Свойства.yaml", () => {
    const source: ProjectStateYamlFileUpdate = {
      ...yamlUpdate("cf/ИсточникОбъекта.yaml", "cf", false),
      targets: [],
      pendingReferences: [{
        yamlPath: ["Ссылка"],
        canonical: "Catalog.НетТакого",
        target: objectTarget,
        constraint: { kind: "object" },
      }],
    }
    const configuration = configurationUpdate(true)
    const store = storeWithUpdates([source, configuration])

    expect(store.validateDependencies({ requests: [] })).toEqual([{
      filePath: "cf/Справочник/НетТакого/Свойства.yaml",
      line: 1,
      col: 1,
      severity: "error",
      source: "reference",
      message: 'Не найден объект "Справочник.НетТакого"',
    }])
    store.rollbackUpdate()
  })

  it("сохраняет префикс компонента в пути отсутствующего объекта расширения", () => {
    const source: ProjectStateYamlFileUpdate = {
      ...yamlUpdate("cfe/Продажи/ИсточникОбъекта.yaml", "cfe/Продажи", false),
      targets: [],
      pendingReferences: [{
        yamlPath: ["Ссылка"],
        canonical: "Catalog.НетТакого",
        target: objectTarget,
        constraint: { kind: "object" },
      }],
    }
    const store = storeWithUpdates([source, configurationUpdate(true)])

    expect(store.validateDependencies({ requests: [] })).toEqual([
      expect.objectContaining({
        filePath: "cfe/Продажи/Справочник/НетТакого/Свойства.yaml",
        source: "reference",
      }),
    ])
    store.rollbackUpdate()
  })

  it("полностью совпадает с чистым validation-графом для отсутствующего владельца", () => {
    const source = ownerDependencySource()
    const graph = createProjectValidationGraph([
      {
        componentPath: "cf",
        contribution: {
          objectRecords: [],
          objectIndexEntries: [],
          memberIndexEntries: [],
          valueIndexEntries: [],
          pendingReferences: [],
        },
      },
    ])
    const index = {
      roots: new Map(source.forms.filter((entry) => entry.kind === "root").map((entry) => [entry.name, entry.source])),
      additionalColumnsByTablePath: new Map(),
      tabularElementsByName: new Map(),
      duplicateDiagnostics: [],
      getRoot(name: string) {
        return this.roots.get(name)
      },
    }
    const graphDiagnostics = graphDependencyDiagnostics({ source, graph, componentPath: "cf", index })
    const store = storeWithUpdates([source])

    const storeDiagnostics = store.validateDependencies({
      requests: [{ requestId: "owner", componentPath: "cf", projectPath: source.projectPath }],
    })

    expect(storeDiagnostics).toEqual(graphDiagnostics)
    store.rollbackUpdate()
  })

  it("полностью совпадает с чистым validation-графом для отсутствующего поля владельца", () => {
    const source = ownerDependencySource()
    const owner = ownerUpdate()
    const fieldIndex = { fields: new Map(), standardAttributeAliases: new Map(), diagnostics: [] }
    const ownerRecord: ValidationObjectRecord = {
      filePath: owner.projectPath,
      projectPath: owner.projectPath,
      kind: "properties",
      owner: { dir: "Справочник", name: "Товары" },
      ownerRef: owner.owners[0]!.owner,
      fieldIndex,
      importDiagnostics: [],
    }
    const graph = createProjectValidationGraph([
      {
        componentPath: "cf",
        contribution: {
          objectRecords: [ownerRecord],
          objectIndexEntries: [],
          memberIndexEntries: [],
          valueIndexEntries: [],
          pendingReferences: [],
        },
      },
    ])
    const roots = new Map(source.forms.filter((entry) => entry.kind === "root").map((entry) => [entry.name, entry.source]))
    const index = {
      roots,
      additionalColumnsByTablePath: new Map(),
      tabularElementsByName: new Map(),
      duplicateDiagnostics: [],
      getRoot(name: string) {
        return roots.get(name)
      },
    }
    const graphDiagnostics = graphDependencyDiagnostics({ source, graph, componentPath: "cf", index })
    const store = storeWithUpdates([source, owner])

    const storeDiagnostics = store.validateDependencies({
      requests: [{ requestId: "field", componentPath: "cf", projectPath: source.projectPath }],
    })

    expect(storeDiagnostics).toEqual(graphDiagnostics)
    store.rollbackUpdate()
  })

  it("берёт DataPath-поля владельца только из приоритетного слоя", () => {
    const source = ownerDependencySource("cfe/x")
    const directOwner = ownerUpdate("cfe/x")
    const fallbackOwner = ownerUpdate("cf", [
      {
        owner: { kind: "Справочник", name: "Товары" },
        name: "Артикул",
        kind: "attribute",
        typeInfo: { kinds: ["scalar"], nextTypes: [], sourceText: "String" },
      },
    ])
    const configuration = configurationUpdate(true)
    const emptyFieldIndex = { fields: new Map(), standardAttributeAliases: new Map(), diagnostics: [] }
    const fallbackFieldIndex: ObjectFieldIndex = {
      fields: new Map([
        [
          "Артикул",
          {
            name: "Артикул",
            kind: "attribute" as const,
            typeInfo: { kinds: ["scalar"], nextTypes: [], sourceText: "String" },
          },
        ],
      ]),
      standardAttributeAliases: new Map(),
      diagnostics: [],
    }
    const graph = createProjectValidationGraph([
      ownerLayer("cfe/x", directOwner, emptyFieldIndex),
      ownerLayer("cf", fallbackOwner, fallbackFieldIndex),
    ])
    const roots = new Map(source.forms.filter((entry) => entry.kind === "root").map((entry) => [entry.name, entry.source]))
    const graphDiagnostics = graphDependencyDiagnostics({
      source,
      graph,
      componentPath: "cfe/x",
      index: {
        roots,
        additionalColumnsByTablePath: new Map(),
        tabularElementsByName: new Map(),
        duplicateDiagnostics: [],
        getRoot(name: string) {
          return roots.get(name)
        },
      },
    })
    const store = storeWithUpdates([source, directOwner, fallbackOwner, configuration])

    const storeDiagnostics = store.validateDependencies({
      requests: [{ requestId: "data-path", componentPath: "cfe/x", projectPath: source.projectPath }],
    })

    expect(storeDiagnostics).toEqual(graphDiagnostics)
    store.rollbackUpdate()
  })

  it("использует связанных владельцев при reverse lookup стандартного реквизита", () => {
    const register = { kind: "РегистрНакопления", name: "Продажи" }
    const source = ownerDependencySource("cf", register, "Объект.Регистратор", "cf/ФормаReverseLookup.yaml")
    const registerOwner = ownerUpdate("cf", [], register)
    const documentOwner = ownerUpdate("cf", [], { kind: "Документ", name: "Реализация" }, {
      registerRecords: ["AccumulationRegister.Продажи"],
    })
    const configuration = configurationUpdate(true)
    const store = storeWithUpdates([source, registerOwner, documentOwner, configuration])

    expect(store.validateDependencies({ requests: [] })).toEqual([])
    store.rollbackUpdate()
  })

  it("читает только текущего владельца и страницы требуемого kind для разных cfe", () => {
    const register = { kind: "РегистрНакопления", name: "Продажи" }
    const documentRefs = Array.from({ length: 3 }, (_, index) => ({
      kind: "Документ",
      name: `Документ${index.toString().padStart(4, "0")}`,
    }))
    const baseDocuments: ProjectStateYamlFileUpdate = {
      ...emptyYamlUpdate("cf/Документы.yaml", "cf", "configuration"),
      owners: documentRefs.map((owner, index) => ({
        owner,
        facts: index === 0 ? { registerRecords: ["AccumulationRegister.Base"] } : {},
      })),
      fields: documentRefs.map((owner) => ({
        owner,
        name: "Номер",
        kind: "attribute" as const,
        typeInfo: { kinds: ["scalar" as const], nextTypes: [], sourceText: "String" },
      })),
    }
    const localDocument = ownerUpdate("cfe/x", [], documentRefs[0], {
      registerRecords: ["AccumulationRegister.Local"],
    })
    const sourceX = ownerDependencySource("cfe/x", register, "Объект.Регистратор", "cfe/x/Форма.yaml")
    const sourceY = ownerDependencySource("cfe/y", register, "Объект.Регистратор", "cfe/y/Форма.yaml")
    const { store } = createBinaryProjectStateTestFixture()
    const updates = [
      baseDocuments,
      localDocument,
      ownerUpdate("cf", [], register),
      sourceX,
      sourceY,
      configurationUpdate(true),
    ]
    store.beginUpdate()
    replaceFiles(store, updates)
    store.commitUpdate()
    const session = createBinaryProjectStateQueryPort(
      new ProjectStateSnapshotView(store.createReadToken().buffers),
      { pageSize: 2, dependencyValidator: createProjectStateDependencyValidator() },
    )
    const inputs = session.readDependencyInputs([
      dependencyQuery("input-x", sourceX),
      dependencyQuery("input-y", sourceY),
    ])

    expect(inputs).toEqual([
      currentOwnerInput("input-x", register, sourceX),
      currentOwnerInput("input-y", register, sourceY),
    ])

    const pagedSession = session as typeof session & PagedDependencyQueryPort
    const pageSizes = new Map<string, number[]>()
    for (const componentPath of ["cfe/x", "cfe/y"]) {
      let cursor: string | undefined
      do {
        const page = pagedSession.readOwnerRefPage({ componentPath, kind: "Документ", cursor })
        const sizes = pageSizes.get(componentPath) ?? []
        sizes.push(page.refs.length)
        pageSizes.set(componentPath, sizes)
        cursor = page.nextCursor
      } while (cursor !== undefined)
    }
    expect(pageSizes).toEqual(new Map([
      ["cfe/x", [2, 1]],
      ["cfe/y", [2, 1]],
    ]))

    const layeredOwners = pagedSession.readDependencyOwnerInputs([
      { requestId: "local", componentPath: "cfe/x", owner: documentRefs[0]! },
      { requestId: "fallback", componentPath: "cfe/y", owner: documentRefs[0]! },
    ])
    expect(layeredOwners).toEqual([
      dependencyOwnerInput("local", documentRefs[0]!, { registerRecords: ["AccumulationRegister.Local"] }),
      dependencyOwnerInput("fallback", documentRefs[0]!, { registerRecords: ["AccumulationRegister.Base"] }, "Номер"),
    ])
  })

  it("останавливает closed reverse lookup до следующей страницы", () => {
    const task = { kind: "ЗадачаОбъект", name: "ЗадачаИсполнителя" }
    const businessProcess = { kind: "БизнесПроцесс", name: "Согласование" }
    const source = ownerDependencySource("cf", task, "Объект.ТочкаМаршрута", "cf/ФормаЗадачи.yaml")
    const pageCursors: (string | undefined)[] = []
    const queryPort = pagedDependencyQueryPort({
      source,
      ownerFacts: new Map([[ownerRefKey(businessProcess), { task: "Task.ЗадачаИсполнителя" }]]),
      readPage(query) {
        pageCursors.push(query.cursor)
        if (query.cursor !== undefined) throw new Error("closed reverse lookup запросил лишнюю страницу")
        return { refs: [businessProcess], nextCursor: "unused" }
      },
    })

    expect(validateProjectStateDependencyBatch({
      checks: [dependencyQuery("closed", source)],
      projectDir: "/project",
      queryPort,
    })).toEqual([])
    expect(pageCursors).toEqual([undefined])
  })

  it("пробрасывает ошибку следующей страницы reverse lookup", () => {
    const register = { kind: "РегистрНакопления", name: "Продажи" }
    const unrelatedDocument = { kind: "Документ", name: "Заказ" }
    const source = ownerDependencySource("cf", register, "Объект.Регистратор", "cf/ФормаОшибкиСтраницы.yaml")
    const queryPort = pagedDependencyQueryPort({
      source,
      ownerFacts: new Map([[ownerRefKey(unrelatedDocument), {}]]),
      readPage({ cursor }) {
        if (cursor !== undefined) throw new Error("Не удалось прочитать следующую страницу владельцев")
        return { refs: [unrelatedDocument], nextCursor: "second" }
      },
    })

    expect(() => validateProjectStateDependencyBatch({
      checks: [dependencyQuery("page-error", source)],
      projectDir: "/project",
      queryPort,
    })).toThrow("Не удалось прочитать следующую страницу владельцев")
  })

  it("сохраняет приоритет штатной колонки формы над дополнительной", () => {
    const source = formPolicySource()
    const owner = ownerUpdate()
    const emptyFieldIndex = { fields: new Map(), standardAttributeAliases: new Map(), diagnostics: [] }
    const graph = createProjectValidationGraph([ownerLayer("cf", owner, emptyFieldIndex)])
    const table = { kind: "ValueTable" as const }
    const intrinsicColumn: FormDataPathColumnSource = {
      name: "Значение",
      typeInfo: { kinds: ["scalar"], nextTypes: [], sourceText: "String" },
    }
    const additionalColumn: FormDataPathColumnSource = {
      name: "Значение",
      typeInfo: { kinds: ["dateTime"], nextTypes: [], sourceText: "Date" },
    }
    const roots: FormDataPathIndex["roots"] = new Map([
      [
        "Таблица",
        {
          kind: "formAttribute" as const,
          name: "Таблица",
          typeInfo: { kinds: ["tableSource"], nextTypes: [], table },
          tableSource: { table, columns: new Map([["Значение", intrinsicColumn]]), hasColumns: true },
        },
      ],
    ])
    const graphDiagnostics = graphDependencyDiagnostics({
      source,
      graph,
      componentPath: "cf",
      index: {
        roots,
        additionalColumnsByTablePath: new Map([["Таблица", new Map([["Значение", additionalColumn]])]]),
        tabularElementsByName: new Map(),
        duplicateDiagnostics: [],
        getRoot(name: string) {
          return roots.get(name)
        },
      },
    })
    const store = storeWithUpdates([source, owner])

    const storeDiagnostics = store.validateDependencies({
      requests: [{ requestId: "form", componentPath: "cf", projectPath: source.projectPath }],
    })

    expect(storeDiagnostics).toEqual(graphDiagnostics)
    store.rollbackUpdate()
  })

  it.each([
    {
      name: "missing reference / facts not contributed",
      target: false,
      readiness: { contributedFacts: false, schemaReady: true },
    },
    {
      name: "cf fallback / schema not ready",
      target: true,
      readiness: { contributedFacts: true, schemaReady: false },
    },
  ])("деградирует cfe при неготовой cf: $name", ({ target, readiness }) => {
    const source = yamlUpdate("cfe/x/Источник.yaml", "cfe/x", true)
    const configuration = configurationUpdate(readiness)
    const updates = [
      source,
      ...(target ? [yamlUpdate("cf/Цель.yaml", "cf", false)] : []),
      configuration,
    ]
    const expected = [
      {
        filePath: "cfe/x/Конфигурация.yaml",
        line: 1,
        col: 1,
        severity: "error" as const,
        source: "cross-file" as const,
        message: "Семантическая валидация расширения невозможна из-за ошибок базовой конфигурации",
      },
    ]
    const store = storeWithUpdates(updates)

    const storeDiagnostics = store.validateDependencies({
      requests: [{ requestId: "readiness", componentPath: "cfe/x", projectPath: source.projectPath }],
    })

    expect(storeDiagnostics).toEqual(expected)
    store.rollbackUpdate()
  })

  it("публикует только schema-диагностики заблокированного cfe", () => {
    const schemaDiagnostic = {
      line: 2,
      col: 3,
      severity: "error" as const,
      source: "structure" as const,
      message: "schema cfe",
    }
    const extension = {
      ...yamlUpdate("cfe/x/Форма.yaml", "cfe/x", false),
      localValidation: {
        contributedFacts: true,
        diagnostics: [
          schemaDiagnostic,
          { line: 4, col: 5, severity: "error" as const, source: "cross-file" as const, message: "semantic cfe" },
        ],
        schemaDiagnostics: [schemaDiagnostic],
      },
    }
    const configuration = configurationUpdate(false)
    const store = storeWithUpdates([extension, configuration])

    expect(store.readLocalDiagnostics({ mode: "published" })).toEqual([{
      ...schemaDiagnostic,
      filePath: extension.projectPath,
    }])
    store.rollbackUpdate()
  })

  it("не блокирует cfe из-за schema warning в cf", () => {
    const source = yamlUpdate("cfe/x/Источник.yaml", "cfe/x", true)
    const readyConfiguration = configurationUpdate(true)
    const configuration = {
      ...readyConfiguration,
      localValidation: {
        ...readyConfiguration.localValidation,
        schemaDiagnostics: [{
          line: 1,
          col: 1,
          severity: "warning" as const,
          source: "structure" as const,
          message: "schema warning",
        }],
      },
    }
    const store = storeWithUpdates([source, configuration])

    expect(store.validateDependencies({ requests: [] })).toEqual([missingMemberDiagnostic(source.projectPath)])
    store.rollbackUpdate()
  })

  it("при отсутствии корня cf блокирует только cfe", () => {
    const extensionSource = yamlUpdate("cfe/x/Источник.yaml", "cfe/x", true)
    const configurationSource = yamlUpdate("cf/Источник.yaml", "cf", true)
    const nonRootConfiguration = configurationUpdate({
      contributedFacts: true,
      schemaReady: true,
      projectPath: "cf/Другой.yaml",
    })
    const updates = [extensionSource, configurationSource, nonRootConfiguration]
    const store = storeWithUpdates(updates)

    const storeDiagnostics = store.validateDependencies({
      requests: [{ requestId: "readiness-root", componentPath: "cf", projectPath: configurationSource.projectPath }],
    })

    expect(storeDiagnostics).toEqual([
      missingMemberDiagnostic("cf/Источник.yaml"),
      {
        filePath: "cfe/x/Конфигурация.yaml",
        line: 1,
        col: 1,
        severity: "error",
        source: "cross-file",
        message: "Семантическая валидация расширения невозможна из-за ошибок базовой конфигурации",
      },
    ])
    store.rollbackUpdate()
  })

  it.each(["changed", "deleted"] as const)(
    "видит %s target внутри незавершённой writer-транзакции",
    (change) => {
      const source = yamlUpdate("cf/ИсточникТранзакции.yaml", "cf", true)
      const target = yamlUpdate("cf/ЦельТранзакции.yaml", "cf", false)
      const configuration = configurationUpdate(true)
      const { store } = createBinaryProjectStateTestFixture()
      store.beginUpdate()
      replaceFiles(store, [source, target, configuration])
      store.commitUpdate()

      store.beginUpdate()
      if (change === "deleted") store.deleteFiles([target.projectPath])
      else {
        replaceFiles(store, [{ ...target, targets: [{ kind: "member", canonical: "Catalog.Другая.Attribute.Ссылка" }] }])
      }

      expect(store.validateDependencies({ requests: [] })).toEqual([missingMemberDiagnostic(source.projectPath)])
      store.rollbackUpdate()
    },
  )

  it("Б5 проверяет ссылку по файловым целям и удаляет её с последним подтверждением", () => {
    const parsed = parseMetadataTargetFromYAML({
      value: "Отчет.Продажи.Макет.Схема",
      constraint: { kind: "member", owner: "explicit", memberKinds: ["Template"] },
    })
    if (!parsed.ok || parsed.target.kind !== "member") throw new Error("Некорректная ссылка на макет")
    const templateCanonical = "Report.Продажи.Template.Схема"
    const source = {
      ...yamlUpdate("cf/Отчет/Продажи/Свойства.yaml", "cf", false),
      targets: [],
      pendingReferences: [{
        yamlPath: ["ОсновнаяСхемаКомпоновкиДанных"],
        canonical: templateCanonical,
        target: parsed.target,
        constraint: { kind: "member" as const, owner: "explicit" as const, memberKinds: ["Template" as const] },
      }],
    }
    const target = {
      kind: "member" as const,
      canonical: templateCanonical,
      fileBacked: {
        itemProjectPath: "cf/Отчет/Продажи/Шаблоны/Схема",
        ownerProjectPath: source.projectPath,
      },
    }
    const first = {
      kind: "resource" as const,
      projectPath: "cf/Отчет/Продажи/Шаблоны/Схема/Template.xml",
      componentPath: "cf",
      resourceKind: "resource" as const,
      targets: [target],
    }
    const second = {
      ...first,
      projectPath: "cf/Отчет/Продажи/Шаблоны/Схема/Ext/schema.bin",
    }
    const { store } = createBinaryProjectStateTestFixture()
    store.beginUpdate()
    replaceFiles(store, [source, first, second, configurationUpdate(true)])
    expect(store.validateDependencies({ requests: [] })).toEqual([])

    store.deleteFiles([first.projectPath])
    expect(store.validateDependencies({ requests: [] })).toEqual([])

    store.deleteFiles([second.projectPath])
    expect(store.validateDependencies({ requests: [] })).toEqual([expect.objectContaining({
      filePath: source.projectPath,
      source: "reference",
      message: `Не найдена ссылка "${templateCanonical}"`,
    })])

    replaceFiles(store, [{ ...source, pendingReferences: [] }])
    expect(store.validateDependencies({ requests: [] })).toEqual([])
    store.rollbackUpdate()
  })

  it("даёт одинаковую reference-диагностику в writer-транзакции и read-only session после commit", () => {
    const source = yamlUpdate("cf/ИсточникСеанса.yaml", "cf", true)
    const configuration = configurationUpdate(true)
    const { store, openReadSession } = createBinaryProjectStateTestFixture()
    store.beginUpdate()
    replaceFiles(store, [source, configuration])
    const writerDiagnostics = store.validateDependencies({ requests: [] })
    store.commitUpdate()
    const session = openReadSession(store.createReadToken())
    const pending = source.pendingReferences[0]!

    const sessionDiagnostics = validateProjectStateReferenceBatch({
      projectDir: "/project",
      checks: [
        {
          requestId: "session-reference",
          componentPath: source.componentPath,
          reference: { ...pending, filePath: source.projectPath },
        },
      ],
      queryPort: session,
    })

    expect(sessionDiagnostics).toEqual(writerDiagnostics)
    session.close()
  })
})

function valueReference(
  value: string,
  constraint: {
    roots: readonly ["Catalog"]
    valueKinds: readonly ["emptyRef"] | readonly ["predefinedValue"]
    allowEmptyRef?: true
  },
): PendingMetadataTargetReference {
  const parsed = parseMetadataTargetFromYAML({ value, constraint: { kind: "value", ...constraint } })
  if (!parsed.ok || parsed.target.kind !== "value") throw new Error(`Некорректная тестовая ссылка ${value}`)
  return {
    filePath: "cf/Справочник/Источник/Свойства.yaml",
    yamlPath: ["ЗначениеЗаполнения"],
    canonical: parsed.canonical,
    target: parsed.target,
    constraint: { kind: "value", ...constraint },
  }
}

function missingValueQueryPort(facts: Record<string, unknown>) {
  return {
    resolveTargets(requests: readonly { requestId: string }[]) {
      return requests.map(({ requestId }) => ({ requestId, status: "missing" as const }))
    },
    readOwners(requests: readonly { requestId: string }[]) {
      return requests.map(({ requestId }) => ({ requestId, status: "found" as const, facts }))
    },
  }
}

function storeWithUpdates(updates: readonly ProjectStateYamlFileUpdate[]) {
  const { store } = createBinaryProjectStateTestFixture()
  store.beginUpdate()
  replaceFiles(store, updates)
  return store
}

function replaceFiles(
  store: ReturnType<typeof createBinaryProjectStateTestFixture>["store"],
  updates: readonly ProjectStateFileUpdate[],
): void {
  const writer = createProjectStateFragmentWriter()
  updates.forEach((update) => writer.appendFile(update, 0n))
  store.appendFragment(writer.finish())
}

interface PagedDependencyQueryPort {
  readOwnerRefPage(query: {
    readonly componentPath: string
    readonly kind: string
    readonly cursor?: string
  }): { readonly refs: readonly OwnerTypeRef[]; readonly nextCursor?: string }
  readDependencyOwnerInputs(requests: readonly {
    readonly requestId: string
    readonly componentPath: string
    readonly owner: OwnerTypeRef
  }[]): readonly ReturnType<typeof dependencyOwnerInput>[]
}

function pagedDependencyQueryPort(params: {
  source: ProjectStateYamlFileUpdate
  ownerFacts: ReadonlyMap<string, ProjectStateYamlFileUpdate["owners"][number]["facts"]>
  readPage: PagedDependencyQueryPort["readOwnerRefPage"]
}) {
  const currentCheck = params.source.pendingChecks[0]!
  if (currentCheck.kind !== "dataPath") throw new Error("Ожидалась DataPath-проверка")
  const currentOwner = currentCheck.owner
  return {
    readDependencyInputs: (requests: readonly { readonly requestId: string }[]) =>
      requests.map(({ requestId }) => currentOwnerInput(requestId, currentOwner, params.source)),
    readOwnerRefPage: params.readPage,
    readDependencyOwnerInputs(requests: readonly {
      readonly requestId: string
      readonly componentPath: string
      readonly owner: OwnerTypeRef
    }[]) {
      return requests.flatMap(({ requestId, owner }) => {
        const facts = params.ownerFacts.get(ownerRefKey(owner))
        return facts === undefined ? [] : [dependencyOwnerInput(requestId, owner, facts)]
      })
    },
  }
}

function dependencyQuery(requestId: string, source: ProjectStateYamlFileUpdate) {
  return {
    requestId,
    componentPath: source.componentPath,
    projectPath: source.projectPath,
    check: source.pendingChecks[0]!,
  }
}

function currentOwnerInput(
  requestId: string,
  owner: OwnerTypeRef,
  source: ProjectStateYamlFileUpdate,
) {
  return {
    requestId,
    status: "found" as const,
    input: {
      owners: [{ owner, facts: {} }],
      fields: [],
      forms: source.forms,
    },
  }
}

function dependencyOwnerInput(
  requestId: string,
  owner: OwnerTypeRef,
  facts: ProjectStateYamlFileUpdate["owners"][number]["facts"],
  fieldName?: string,
) {
  return {
    requestId,
    status: "found" as const,
    input: {
      owner,
      facts,
      fields: fieldName === undefined
        ? []
        : [{
            owner,
            name: fieldName,
            kind: "attribute" as const,
            typeInfo: { kinds: ["scalar" as const], nextTypes: [], sourceText: "String" },
          }],
    },
  }
}

function ownerRefKey(owner: OwnerTypeRef): string {
  return `${owner.kind}:${owner.name ?? ""}`
}

function emptyYamlUpdate(
  projectPath: string,
  componentPath: string,
  yamlRole: ProjectStateYamlFileUpdate["yamlRole"],
): ProjectStateYamlFileUpdate {
  return {
    ...yamlUpdate(projectPath, componentPath, false),
    yamlRole,
    targets: [],
  }
}

function missingMemberDiagnostic(filePath: string) {
  return {
    filePath,
    line: 1,
    col: 1,
    severity: "error" as const,
    source: "reference" as const,
    message: 'Не найдена ссылка "Catalog.Товары.Attribute.Артикул"',
  }
}

function graphDependencyDiagnostics(params: {
  source: ProjectStateYamlFileUpdate
  graph: ProjectValidationGraph
  componentPath: string
  index: FormDataPathIndex
}) {
  return validatePendingChecks({
    ownerCache: createOwnerCacheFromGraphForTests(params.graph, params.componentPath),
    checks: params.source.pendingChecks.map((check) => ({
      ...check,
      location: { ...check.location, filePath: params.source.projectPath },
      index: params.index,
    })),
  }).diagnostics
}

function createReferenceIndexFromGraphForTests(
  graph: ProjectValidationGraph,
  componentPath: string,
) {
  const visibleLayers = validationComponentLayers(componentPath)
    .map((path) => graph.layers.find((layer) => layer.componentPath === path))
    .filter((layer): layer is ComponentValidationLayer => layer !== undefined)
  const snapshot = createProjectReferenceSnapshot({
    objectIndexEntries: visibleLayerEntries(visibleLayers, (layer) => layer.contribution.objectIndexEntries ?? []),
    memberIndexEntries: visibleLayerEntries(visibleLayers, (layer) => layer.contribution.memberIndexEntries ?? []),
    valueIndexEntries: visibleLayerEntries(visibleLayers, (layer) => layer.contribution.valueIndexEntries ?? []),
    pendingReferences: [],
  })
  return createProjectReferenceIndex({ projectDir: "/project", snapshot })
}

function visibleLayerEntries<Entry extends { readonly canonical: string }>(
  layers: readonly ComponentValidationLayer[],
  select: (layer: ComponentValidationLayer) => readonly Entry[],
): Entry[] {
  const result: Entry[] = []
  const claimed = new Set<string>()
  for (const layer of layers) {
    const entries = select(layer)
    result.push(...entries.filter((entry) => !claimed.has(entry.canonical)))
    for (const entry of entries) claimed.add(entry.canonical)
  }
  return result
}

function createOwnerCacheFromGraphForTests(
  graph: ProjectValidationGraph,
  componentPath: string,
): OwnerMetadataCache {
  const table = createValidationObjectTable()
  for (const layerPath of [...validationComponentLayers(componentPath)].reverse()) {
    const layer = graph.layers.find(({ componentPath: candidate }) => candidate === layerPath)
    if (layer !== undefined) table.mergeRecords(layer.contribution.objectRecords)
  }
  return createOwnerMetadataCacheFromValidationTable({
    projectDir: `/project/${componentPath}`,
    table,
  })
}

function configurationUpdate(
  readiness: boolean | {
    contributedFacts: boolean
    schemaReady: boolean
    projectPath?: string
  },
): ProjectStateYamlFileUpdate {
  const contributedFacts = typeof readiness === "boolean" ? readiness : readiness.contributedFacts
  const schemaReady = typeof readiness === "boolean" ? readiness : readiness.schemaReady
  return {
    kind: "yaml",
    projectPath: typeof readiness === "boolean" ? "cf/Конфигурация.yaml" : readiness.projectPath ?? "cf/Конфигурация.yaml",
    componentPath: "cf",
    resourceKind: "yaml",
    yamlRole: "configuration",
    localValidation: {
      contributedFacts,
      diagnostics: [],
      schemaDiagnostics: schemaReady
        ? []
        : [{ line: 1, col: 1, severity: "error", source: "structure", message: "invalid cf" }],
    },
    targets: [],
    pendingReferences: [],
    owners: [],
    fields: [],
    forms: [],
    pendingChecks: [],
    dependencies: [],
  }
}

function formPolicySource(): ProjectStateYamlFileUpdate {
  const owner = { kind: "Справочник", name: "Товары" }
  const table = { kind: "ValueTable" as const }
  return {
    ...emptyYamlUpdate("cf/ФормаПолитики.yaml", "cf", "form"),
    forms: [
      {
        kind: "root",
        owner,
        name: "Таблица",
        source: {
          kind: "formAttribute",
          name: "Таблица",
          typeInfo: { kinds: ["tableSource"], nextTypes: [], table },
          table,
          tableHasColumns: true,
        },
      },
      {
        kind: "additionalColumn",
        owner,
        tablePath: "Таблица",
        name: "Значение",
        source: {
          name: "Значение",
          typeInfo: { kinds: ["scalar"], nextTypes: [], sourceText: "String" },
        },
      },
      {
        kind: "additionalColumn",
        owner,
        tablePath: "Таблица",
        name: "Значение",
        source: {
          name: "Значение",
          typeInfo: { kinds: ["dateTime"], nextTypes: [], sourceText: "Date" },
        },
      },
    ],
    pendingChecks: [
      {
        kind: "dataPath",
        yamlPath: ["Элементы", "Календарь", "ПутьКДанным"],
        location: { line: 8, col: 13, path: "/Элементы/Календарь/ПутьКДанным" },
        owner,
        value: "Таблица.Значение",
        policyInput: { yaml: "ПутьКДанным", allowedKinds: ["dateTime"] },
        policy: "formDataPath",
      },
    ],
  }
}

function ownerLayer(
  componentPath: string,
  update: ProjectStateYamlFileUpdate,
  fieldIndex: ValidationObjectRecord["fieldIndex"],
): ComponentValidationLayer {
  return {
    componentPath,
    contribution: {
      objectRecords: [
        {
          filePath: update.projectPath,
          projectPath: update.projectPath,
          kind: "properties",
          owner: { dir: "Справочник", name: "Товары" },
          ownerRef: { kind: "Справочник", name: "Товары" },
          fieldIndex,
          importDiagnostics: [],
        },
      ],
      objectIndexEntries: [],
      memberIndexEntries: [],
      valueIndexEntries: [],
      pendingReferences: [],
    },
  }
}

function ownerUpdate(
  componentPath = "cf",
  fields: ProjectStateYamlFileUpdate["fields"] = [],
  owner: ProjectStateYamlFileUpdate["owners"][number]["owner"] = { kind: "Справочник", name: "Товары" },
  facts: ProjectStateYamlFileUpdate["owners"][number]["facts"] = {},
): ProjectStateYamlFileUpdate {
  return {
    ...emptyYamlUpdate(`${componentPath}/${owner.kind}/${owner.name}/Свойства.yaml`, componentPath, "configuration"),
    owners: [{ owner, facts }],
    fields,
  }
}

function ownerDependencySource(
  componentPath = "cf",
  owner: Extract<ProjectStateYamlFileUpdate["pendingChecks"][number], { kind: "dataPath" }>["owner"] = { kind: "Справочник", name: "Товары" },
  value = "Объект.Артикул",
  projectPath = `${componentPath}/Форма.yaml`,
): ProjectStateYamlFileUpdate {
  return {
    ...emptyYamlUpdate(projectPath, componentPath, "form"),
    forms: [
      {
        kind: "root",
        owner,
        name: "Объект",
        source: {
          kind: "formAttribute",
          name: "Объект",
          typeInfo: { kinds: ["object"], nextTypes: [owner] },
        },
      },
    ],
    pendingChecks: [
      {
        kind: "dataPath",
        yamlPath: ["ПутьКДанным"],
        location: { line: 3, col: 15, path: "/ПутьКДанным" },
        owner,
        value,
        policyInput: { yaml: "ПутьКДанным" },
        policy: "formDataPath",
      },
    ],
  }
}

function referenceCase(
  name: string,
  sourceComponent: string,
  targetComponents: readonly string[],
  constraint: PendingMetadataTargetReference["constraint"] = { kind: "member", owner: "explicit" },
  details?: ProjectStateYamlFileUpdate["targets"][number]["details"],
) {
  const source = yamlUpdate(`${sourceComponent}/Источник.yaml`, sourceComponent, true, constraint)
  const targets = targetComponents.map((componentPath, index) =>
    yamlUpdate(`${componentPath}/Цель-${index}.yaml`, componentPath, false, undefined, details),
  )
  const byComponent = new Map<string, { updates: ProjectStateYamlFileUpdate[]; entries: ProjectMemberIndexEntry[] }>()
  const readiness = sourceComponent.startsWith("cfe/") ? [configurationUpdate(true)] : []
  for (const update of [source, ...targets, ...readiness]) {
    const layer = byComponent.get(update.componentPath) ?? { updates: [], entries: [] }
    layer.updates.push(update)
    if (update.targets.length > 0) {
      layer.entries.push({
        canonical,
        target: memberTarget,
        result: { ok: true, filePath: update.projectPath, ...(details === undefined ? {} : { details }) },
      })
    }
    byComponent.set(update.componentPath, layer)
  }
  const layers: ComponentValidationLayer[] = [...byComponent.entries()].map(([componentPath, layer]) => ({
    componentPath,
    contribution: {
      objectRecords: [],
      objectIndexEntries: [],
      memberIndexEntries: layer.entries,
      valueIndexEntries: [],
      pendingReferences: layer.updates.flatMap((update) =>
        update.pendingReferences.map((reference) => ({ ...reference, filePath: update.projectPath })),
      ),
    },
  }))
  return { name, sourceComponent, updates: [source, ...targets, ...readiness], graph: createProjectValidationGraph(layers) }
}

function yamlUpdate(
  projectPath: string,
  componentPath: string,
  pending: boolean,
  constraint: PendingMetadataTargetReference["constraint"] = { kind: "member", owner: "explicit" },
  details?: ProjectStateYamlFileUpdate["targets"][number]["details"],
): ProjectStateYamlFileUpdate {
  return {
    kind: "yaml",
    projectPath,
    componentPath,
    resourceKind: "yaml",
    yamlRole: "configuration",
    localValidation: { contributedFacts: true, diagnostics: [], schemaDiagnostics: [] },
    targets: pending ? [] : [{ kind: "member", canonical, ...(details === undefined ? {} : { details }) }],
    pendingReferences: pending
      ? [{ yamlPath: ["Ссылка"], canonical, target: memberTarget, constraint }]
      : [],
    owners: [],
    fields: [],
    forms: [],
    pendingChecks: [],
    dependencies: [],
  }
}
