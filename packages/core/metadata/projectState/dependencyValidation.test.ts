import { describe, expect, it } from "vitest"
import { parseMetadataTargetFromYAML } from "../commonObjects/metadataTargets"
import {
  createSharedProjectReferenceIndex,
  createSharedProjectReferenceSnapshotFromGraph,
} from "../validation/sharedProjectReferenceIndex"
import { createProjectValidationGraph } from "../validation/projectValidationGraph"
import { createSharedProjectValidationGraph } from "../validation/sharedValidationSnapshot"
import { createOwnerMetadataCacheFromSharedProjectValidationGraph } from "../validation/dataPath/sharedOwnerCache"
import type { FormDataPathIndex } from "../validation/dataPath/formIndex"
import type { FormDataPathColumnSource } from "../validation/dataPath/types"
import type { ObjectFieldIndex } from "../validation/dataPath/objectFields"
import { validatePendingChecks } from "../validation/projectValidationPendingChecks"
import {
  validatePendingReferencesWithIndex,
  type PendingMetadataTargetReference,
  type ProjectMemberIndexEntry,
} from "../validation/projectReferenceIndex"
import type { ComponentValidationLayer, ValidationObjectRecord } from "../validation/projectValidationTypes"
import type { ProjectStateYamlFileUpdate } from "./fileUpdate"
import { createSqliteProjectStateTestFixture } from "./sqlite/testFixture"
import { validateProjectStateReferenceBatch } from "./dependencyValidation"

const memberTargetResult = parseMetadataTargetFromYAML({
  value: "Справочник.Товары.Реквизит.Артикул",
  constraint: { kind: "member", owner: "explicit" },
})
if (!memberTargetResult.ok || memberTargetResult.target.kind !== "member") {
  throw new Error("Некорректная тестовая ссылка")
}
const memberTarget = memberTargetResult.target
const canonical = "Catalog.Товары.Attribute.Артикул"

describe("dependency validation из ProjectState", () => {
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
  ])("полностью совпадает с shared graph: $name", ({ sourceComponent, updates, graph }) => {
    const sharedDiagnostics = validatePendingReferencesWithIndex({
      index: createSharedProjectReferenceIndex({
        projectDir: "/project",
        componentPath: sourceComponent,
        snapshot: createSharedProjectReferenceSnapshotFromGraph(graph),
      }),
      references: graph.layers.find(({ componentPath }) => componentPath === sourceComponent)!.contribution
        .pendingReferences!,
    }).diagnostics
    const { store } = createSqliteProjectStateTestFixture()
    store.beginUpdate()
    store.replaceFiles({ updates, hashBytes: new Uint8Array(updates.length * 8) })

    const storeDiagnostics = store.validateDependencies({
      requests: [{ requestId: "reference", componentPath: sourceComponent, projectPath: updates[0]!.projectPath }],
    })

    expect(storeDiagnostics).toEqual(sharedDiagnostics)
    store.rollbackUpdate()
  })

  it("полностью совпадает с shared graph для отсутствующего владельца", () => {
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
      duplicateDiagnostics: [],
      getRoot(name: string) {
        return this.roots.get(name)
      },
    }
    const sharedDiagnostics = validatePendingChecks({
      ownerCache: createOwnerMetadataCacheFromSharedProjectValidationGraph({
        projectDir: "/project",
        componentPath: "cf",
        graph: createSharedProjectValidationGraph(graph),
      }),
      checks: source.pendingChecks.map((check) => ({
        ...check,
        location: { ...check.location, filePath: source.projectPath },
        index,
      })),
    }).diagnostics
    const { store } = createSqliteProjectStateTestFixture()
    store.beginUpdate()
    store.replaceFiles({ updates: [source], hashBytes: new Uint8Array(8) })

    const storeDiagnostics = store.validateDependencies({
      requests: [{ requestId: "owner", componentPath: "cf", projectPath: source.projectPath }],
    })

    expect(storeDiagnostics).toEqual(sharedDiagnostics)
    store.rollbackUpdate()
  })

  it("полностью совпадает с shared graph для отсутствующего поля владельца", () => {
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
      duplicateDiagnostics: [],
      getRoot(name: string) {
        return roots.get(name)
      },
    }
    const sharedDiagnostics = validatePendingChecks({
      ownerCache: createOwnerMetadataCacheFromSharedProjectValidationGraph({
        projectDir: "/project",
        componentPath: "cf",
        graph: createSharedProjectValidationGraph(graph),
      }),
      checks: source.pendingChecks.map((check) => ({
        ...check,
        location: { ...check.location, filePath: source.projectPath },
        index,
      })),
    }).diagnostics
    const { store } = createSqliteProjectStateTestFixture()
    store.beginUpdate()
    store.replaceFiles({ updates: [source, owner], hashBytes: new Uint8Array(16) })

    const storeDiagnostics = store.validateDependencies({
      requests: [{ requestId: "field", componentPath: "cf", projectPath: source.projectPath }],
    })

    expect(storeDiagnostics).toEqual(sharedDiagnostics)
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
    const sharedDiagnostics = validatePendingChecks({
      ownerCache: createOwnerMetadataCacheFromSharedProjectValidationGraph({
        projectDir: "/project",
        componentPath: "cfe/x",
        graph: createSharedProjectValidationGraph(graph),
      }),
      checks: source.pendingChecks.map((check) => ({
        ...check,
        location: { ...check.location, filePath: source.projectPath },
        index: {
          roots,
          additionalColumnsByTablePath: new Map(),
          duplicateDiagnostics: [],
          getRoot(name: string) {
            return roots.get(name)
          },
        },
      })),
    }).diagnostics
    const { store } = createSqliteProjectStateTestFixture()
    store.beginUpdate()
    store.replaceFiles({ updates: [source, directOwner, fallbackOwner, configuration], hashBytes: new Uint8Array(32) })

    const storeDiagnostics = store.validateDependencies({
      requests: [{ requestId: "data-path", componentPath: "cfe/x", projectPath: source.projectPath }],
    })

    expect(storeDiagnostics).toEqual(sharedDiagnostics)
    store.rollbackUpdate()
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
    const sharedDiagnostics = validatePendingChecks({
      ownerCache: createOwnerMetadataCacheFromSharedProjectValidationGraph({
        projectDir: "/project",
        componentPath: "cf",
        graph: createSharedProjectValidationGraph(graph),
      }),
      checks: source.pendingChecks.map((check) => ({
        ...check,
        location: { ...check.location, filePath: source.projectPath },
        index: {
          roots,
          additionalColumnsByTablePath: new Map([["Таблица", new Map([["Значение", additionalColumn]])]]),
          duplicateDiagnostics: [],
          getRoot(name: string) {
            return roots.get(name)
          },
        },
      })),
    }).diagnostics
    const { store } = createSqliteProjectStateTestFixture()
    store.beginUpdate()
    store.replaceFiles({ updates: [source, owner], hashBytes: new Uint8Array(16) })

    const storeDiagnostics = store.validateDependencies({
      requests: [{ requestId: "form", componentPath: "cf", projectPath: source.projectPath }],
    })

    expect(storeDiagnostics).toEqual(sharedDiagnostics)
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
    const { store } = createSqliteProjectStateTestFixture()
    store.beginUpdate()
    store.replaceFiles({ updates, hashBytes: new Uint8Array(updates.length * 8) })

    const storeDiagnostics = store.validateDependencies({
      requests: [{ requestId: "readiness", componentPath: "cfe/x", projectPath: source.projectPath }],
    })

    expect(storeDiagnostics).toEqual(expected)
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
    const { store } = createSqliteProjectStateTestFixture()
    store.beginUpdate()
    store.replaceFiles({ updates: [source, configuration], hashBytes: new Uint8Array(16) })

    expect(store.validateDependencies({ requests: [] })).toEqual([
      {
        filePath: source.projectPath,
        line: 1,
        col: 1,
        severity: "error",
        source: "reference",
        message: 'Не найдена ссылка "Catalog.Товары.Attribute.Артикул"',
      },
    ])
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
    const { store } = createSqliteProjectStateTestFixture()
    store.beginUpdate()
    store.replaceFiles({ updates, hashBytes: new Uint8Array(updates.length * 8) })

    const storeDiagnostics = store.validateDependencies({
      requests: [{ requestId: "readiness-root", componentPath: "cf", projectPath: configurationSource.projectPath }],
    })

    expect(storeDiagnostics).toEqual([
      {
        filePath: "cf/Источник.yaml",
        line: 1,
        col: 1,
        severity: "error",
        source: "reference",
        message: 'Не найдена ссылка "Catalog.Товары.Attribute.Артикул"',
      },
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
      const { store } = createSqliteProjectStateTestFixture()
      store.beginUpdate()
      store.replaceFiles({ updates: [source, target, configuration], hashBytes: new Uint8Array(24) })
      store.commitUpdate()

      store.beginUpdate()
      if (change === "deleted") store.deleteFiles([target.projectPath])
      else {
        store.replaceFiles({
          updates: [{ ...target, references: [{ kind: "member", canonical: "Catalog.Другая.Attribute.Ссылка" }] }],
          hashBytes: new Uint8Array(8),
        })
      }

      expect(store.validateDependencies({ requests: [] })).toEqual([
        {
          filePath: source.projectPath,
          line: 1,
          col: 1,
          severity: "error",
          source: "reference",
          message: 'Не найдена ссылка "Catalog.Товары.Attribute.Артикул"',
        },
      ])
      store.rollbackUpdate()
    },
  )

  it("даёт одинаковую reference-диагностику в writer-транзакции и read-only session после commit", () => {
    const source = yamlUpdate("cf/ИсточникСеанса.yaml", "cf", true)
    const configuration = configurationUpdate(true)
    const { store, openReadSession } = createSqliteProjectStateTestFixture()
    store.beginUpdate()
    store.replaceFiles({ updates: [source, configuration], hashBytes: new Uint8Array(16) })
    const writerDiagnostics = store.validateDependencies({ requests: [] })
    store.commitUpdate()
    const session = openReadSession(store.createReadToken())
    const pending = source.pendingReferences[0]!

    const sessionDiagnostics = validateProjectStateReferenceBatch({
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
    references: [],
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
    kind: "yaml",
    projectPath: "cf/ФормаПолитики.yaml",
    componentPath: "cf",
    resourceKind: "yaml",
    yamlRole: "form",
    localValidation: { contributedFacts: true, diagnostics: [], schemaDiagnostics: [] },
    references: [],
    pendingReferences: [],
    owners: [],
    fields: [],
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
        location: { line: 8, col: 13, path: "/Элементы/Календарь/ПутьКДанным" },
        owner,
        value: "Таблица.Значение",
        policyInput: { yaml: "ПутьКДанным", allowedKinds: ["dateTime"] },
        policy: "formDataPath",
      },
    ],
    dependencies: [],
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
): ProjectStateYamlFileUpdate {
  return {
    kind: "yaml",
    projectPath: `${componentPath}/Справочник/Товары/Свойства.yaml`,
    componentPath,
    resourceKind: "yaml",
    yamlRole: "configuration",
    localValidation: { contributedFacts: true, diagnostics: [], schemaDiagnostics: [] },
    references: [],
    pendingReferences: [],
    owners: [{ owner: { kind: "Справочник", name: "Товары" }, facts: {} }],
    fields,
    forms: [],
    pendingChecks: [],
    dependencies: [],
  }
}

function ownerDependencySource(componentPath = "cf"): ProjectStateYamlFileUpdate {
  const owner = { kind: "Справочник", name: "Товары" }
  return {
    kind: "yaml",
    projectPath: `${componentPath}/Форма.yaml`,
    componentPath,
    resourceKind: "yaml",
    yamlRole: "form",
    localValidation: { contributedFacts: true, diagnostics: [], schemaDiagnostics: [] },
    references: [],
    pendingReferences: [],
    owners: [],
    fields: [],
    forms: [
      {
        kind: "root",
        owner,
        name: "Объект",
        source: {
          kind: "formAttribute",
          name: "Объект",
          typeInfo: { kinds: ["object"], nextTypes: [owner], sourceText: "CatalogObject.Товары" },
        },
      },
    ],
    pendingChecks: [
      {
        kind: "dataPath",
        location: { line: 3, col: 15, path: "/ПутьКДанным" },
        owner,
        value: "Объект.Артикул",
        policyInput: { yaml: "ПутьКДанным" },
        policy: "formDataPath",
      },
    ],
    dependencies: [],
  }
}

function referenceCase(
  name: string,
  sourceComponent: string,
  targetComponents: readonly string[],
  constraint: PendingMetadataTargetReference["constraint"] = { kind: "member", owner: "explicit" },
  details?: ProjectStateYamlFileUpdate["references"][number]["details"],
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
    if (update.references.length > 0) {
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
  details?: ProjectStateYamlFileUpdate["references"][number]["details"],
): ProjectStateYamlFileUpdate {
  return {
    kind: "yaml",
    projectPath,
    componentPath,
    resourceKind: "yaml",
    yamlRole: "configuration",
    localValidation: { contributedFacts: true, diagnostics: [], schemaDiagnostics: [] },
    references: pending ? [] : [{ kind: "member", canonical, ...(details === undefined ? {} : { details }) }],
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
