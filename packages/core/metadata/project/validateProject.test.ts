import { resolve } from "node:path"
import { describe, expect, it } from "vitest"
import type { ProjectStateRefreshParams, ProjectStateRefreshResult } from "../projectState/refresh"
import type { ProjectStateService } from "../projectState/service"
import { createTestProjectStateReadToken } from "../projectState/tests/readToken"
import type { Diagnostic } from "../validation/types"
import {
  toRootProjectDiagnostic,
  validateProject,
} from "./validateProject"
import { createMetadataDiagnosticCollectionFromDiagnostics } from "../diagnostics/collection"
import { parseMetadataTargetFromYAML } from "../ruleRuntime/metadataTarget"
import { createBinaryProjectStateTestFixture } from "../projectState/binary/testFixture"
import { createProjectStateFragmentWriter } from "../projectState/binary/fragment"
import type { ProjectStateFileUpdate, ProjectStateYamlFileUpdate } from "../projectState/fileUpdate"

describe("validateProject", () => {
  it("всегда актуализирует весь проект через переданное состояние и не закрывает его", async () => {
    const projectState = testProjectState([
      diagnostic("cf/Конфигурация.yaml", "invalid", "structure"),
    ])

    const result = await validateProject({
      projectDir: "/project",
      concurrency: 2,
      projectState,
    })

    expect([...result.diagnostics]).toEqual([
      diagnostic("cf/Конфигурация.yaml", "invalid", "structure"),
    ])
    expect(projectState.refreshes).toEqual([{
      projectDir: "/project",
      concurrency: 2,
      context: undefined,
    }])
    expect(projectState.closed).toBe(0)
  })

  it("требует явно представить объект и его пользовательский реквизит в расширении", async () => {
    const { store } = createBinaryProjectStateTestFixture()
    const facts = extensionVisibilityFacts()
    store.beginUpdate()
    appendStateFiles(store, [facts.configuration, facts.source, facts.baseTarget])
    const projectState = testProjectState(() => store.validateDependencies({ requests: [] }))

    expect(messages(await validateProject({ projectDir: "/project", concurrency: 1, projectState }))).toEqual([
      'Ссылка "Catalog.Номенклатура" не включена в расширение',
      'Ссылка "Catalog.Номенклатура.Attribute.Артикул" не включена в расширение',
    ])

    appendStateFiles(store, [facts.extensionObject])
    expect(messages(await validateProject({ projectDir: "/project", concurrency: 1, projectState })))
      .toEqual(['Ссылка "Catalog.Номенклатура.Attribute.Артикул" не включена в расширение'])

    appendStateFiles(store, [facts.extensionObjectWithAttribute])
    expect(messages(await validateProject({ projectDir: "/project", concurrency: 1, projectState }))).toEqual([])
    store.rollbackUpdate()
  })

})

describe("toRootProjectDiagnostic", () => {
  it("returns a project-relative path", () => {
    const projectDir = resolve("/project")

    expect(
      toRootProjectDiagnostic(
        projectDir,
        diagnostic(resolve(projectDir, "cf", "Конфигурация.yaml"), "invalid", "structure")
      )
    ).toMatchObject({
      filePath: "cf/Конфигурация.yaml",
      message: "invalid",
    })
  })

  it("rejects a diagnostic path outside projectDir", () => {
    const projectDir = resolve("/project")

    expect(() =>
      toRootProjectDiagnostic(
        projectDir,
        diagnostic(resolve("/other/Свойства.yaml"), "outside", "structure")
      )
    ).toThrow("за пределами projectDir")
  })
})

function testProjectState(diagnostics: readonly Diagnostic[] | (() => readonly Diagnostic[])): ProjectStateService & {
  readonly refreshes: ProjectStateRefreshParams[]
  closed: number
} {
  const refreshes: ProjectStateRefreshParams[] = []
  return {
    refreshes,
    closed: 0,
    workers: {} as ProjectStateService["workers"],
    async beginImport() { throw new Error("unexpected beginImport") },
    async refreshAndValidate(params) {
      refreshes.push(params)
      return refreshResult(typeof diagnostics === "function" ? diagnostics() : diagnostics)
    },
    async createReadToken() {
      throw new Error("unexpected createReadToken")
    },
    openReadSession() {
      throw new Error("unexpected openReadSession")
    },
    async readComponentProjection() {
      throw new Error("unexpected readComponentProjection")
    },
    async reset() {
      throw new Error("unexpected reset")
    },
    async rebuild() {
      throw new Error("unexpected rebuild")
    },
    async close() {
      this.closed += 1
    },
  }
}

function refreshResult(diagnostics: readonly Diagnostic[]): ProjectStateRefreshResult {
  return {
    diagnostics: createMetadataDiagnosticCollectionFromDiagnostics(diagnostics),
    readToken: createTestProjectStateReadToken(),
    stats: { hashedFiles: 1, parsedYamlFiles: 1, changedFiles: 1, deletedFiles: 0 },
  }
}

function diagnostic(filePath: string, message: string, source: Diagnostic["source"]): Diagnostic {
  return {
    filePath,
    line: 1,
    col: 1,
    severity: "error",
    source,
    message,
  }
}

function messages(result: Awaited<ReturnType<typeof validateProject>>): string[] {
  return [...result.diagnostics].map(({ message }) => message).sort()
}

function extensionVisibilityFacts() {
  const object = parseMetadataTargetFromYAML({
    value: "Справочник.Номенклатура",
    constraint: { kind: "object" },
  })
  const attribute = parseMetadataTargetFromYAML({
    value: "Справочник.Номенклатура.Реквизит.Артикул",
    constraint: { kind: "member", owner: "explicit" },
  })
  if (!object.ok || object.target.kind !== "object" || !attribute.ok || attribute.target.kind !== "member") {
    throw new Error("Некорректные тестовые ссылки")
  }
  const yaml = (
    projectPath: string,
    componentPath: string,
    targets: ProjectStateYamlFileUpdate["targets"],
    pendingReferences: ProjectStateYamlFileUpdate["pendingReferences"] = [],
  ): ProjectStateYamlFileUpdate => ({
    kind: "yaml",
    projectPath,
    componentPath,
    resourceKind: "yaml",
    yamlRole: "configuration",
    localValidation: { contributedFacts: true, diagnostics: [], schemaDiagnostics: [] },
    targets,
    pendingReferences,
    owners: [],
    fields: [],
    forms: [],
    pendingChecks: [],
    dependencies: [],
  })
  const objectEntry = { kind: "object" as const, canonical: object.canonical }
  const attributeEntry = { kind: "member" as const, canonical: attribute.canonical }
  return {
    configuration: yaml("cf/Конфигурация.yaml", "cf", []),
    source: yaml("cfe/X/Источник.yaml", "cfe/X", [], [
      {
        yamlPath: ["Объект"],
        canonical: object.canonical,
        target: object.target,
        constraint: { kind: "object" },
      },
      {
        yamlPath: ["Реквизит"],
        canonical: attribute.canonical,
        target: attribute.target,
        constraint: { kind: "member", owner: "explicit" },
      },
    ]),
    baseTarget: yaml("cf/Справочник/Номенклатура/Свойства.yaml", "cf", [objectEntry, attributeEntry]),
    extensionObject: yaml("cfe/X/Справочник/Номенклатура/Свойства.yaml", "cfe/X", [objectEntry]),
    extensionObjectWithAttribute: yaml(
      "cfe/X/Справочник/Номенклатура/Свойства.yaml",
      "cfe/X",
      [objectEntry, attributeEntry],
    ),
  }
}

function appendStateFiles(
  store: ReturnType<typeof createBinaryProjectStateTestFixture>["store"],
  updates: readonly ProjectStateFileUpdate[],
): void {
  const writer = createProjectStateFragmentWriter()
  for (const update of updates) writer.appendFile(update, 0n)
  store.appendFragment(writer.finish())
}
