import { resolve } from "node:path"
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { describe, expect, it, vi } from "vitest"
import type { ProjectStateRefreshParams, ProjectStateRefreshResult } from "../projectState/refresh"
import type { ProjectStateService } from "../projectState/service"
import { createTestProjectStateReadToken } from "../projectState/tests/readToken"
import type { Diagnostic } from "../validation/types"
import {
  toRootProjectDiagnostic,
  validateProject,
} from "./validateProject"
import { createConfigurationLanguages, createMetadataDiagnosticCollectionFromDiagnostics } from "@nkdk/runtime"
import { parseMetadataTargetFromYAML } from "../ruleRuntime/metadataTarget"
import { createBinaryProjectStateTestFixture } from "../projectState/binary/testFixture"
import { emptyYamlUpdate } from "../projectState/binary/testData"
import { createProjectStateFragmentWriter } from "../projectState/binary/fragment"
import type { ProjectStateFileUpdate, ProjectStateYamlFileUpdate } from "../projectState/fileUpdate"
import { createProjectStateDependencyValidator } from "../validation/projectStateDependencyValidation"
import { collectAppliedObjectDataTables } from "../appliedObjects/dataTableRules"

const testLanguages = createConfigurationLanguages({ default: "ru", registered: ["ru"] })

describe("validateProject", () => {
  it("передаёт signal в обновление состояния и не публикует результат после отмены", async () => {
    const controller = new AbortController()
    let releaseRefresh!: () => void
    const refreshGate = new Promise<void>((resolve) => { releaseRefresh = resolve })
    const projectState = testProjectState([])
    projectState.refreshAndValidate = async (params) => {
      projectState.refreshes.push(params)
      await refreshGate
      return refreshResult([])
    }

    const validation = validateTestProject({
      projectDir: "/project",
      concurrency: 1,
      projectState,
      signal: controller.signal,
    })
    await vi.waitFor(() => expect(projectState.refreshes).toHaveLength(1))
    controller.abort()
    releaseRefresh()

    await expect(validation).rejects.toMatchObject({ name: "AbortError" })
    expect(projectState.refreshes[0]?.signal).toBe(controller.signal)
  })

  it("builds the language registry before refreshing the project", async () => {
    const projectDir = await mkdtemp(resolve(tmpdir(), "nkdk-validate-languages-"))
    await writeLanguageProject(projectDir, { Русский: "ru", English: "en" })
    const projectState = testProjectState([])

    try {
      await validateProject({ projectDir, concurrency: 1, projectState })
      expect(projectState.refreshes[0]?.context?.languages).toMatchObject({
        default: "ru",
        registered: ["ru", "en"],
      })
    } finally {
      await rm(projectDir, { recursive: true, force: true })
    }
  })

  it("останавливает validation до refresh при повторном коде языка", async () => {
    const projectDir = await mkdtemp(resolve(tmpdir(), "nkdk-validate-languages-invalid-"))
    await writeLanguageProject(projectDir, { Русский: "ru", Дубликат: "ru" })
    const projectState = testProjectState([])

    try {
      await expect(validateProject({ projectDir, concurrency: 1, projectState }))
        .rejects.toThrow("код языка ru уже зарегистрирован")
      expect(projectState.refreshes).toEqual([])
    } finally {
      await rm(projectDir, { recursive: true, force: true })
    }
  })

  it("всегда актуализирует весь проект через переданное состояние и не закрывает его", async () => {
    const projectState = testProjectState([
      diagnostic("cf/Конфигурация.yaml", "invalid", "structure"),
    ])

    const result = await validateTestProject({
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
      context: { version: "2.20", languages: testLanguages },
      validationContextVersions: new Map([["languages", testLanguages.version]]),
    }])
    expect(projectState.closed).toBe(0)
  })

  it("требует явно представить объект и его пользовательский реквизит в расширении", async () => {
    const { store } = createBinaryProjectStateTestFixture()
    const facts = extensionVisibilityFacts()
    store.beginUpdate()
    appendStateFiles(store, [facts.configuration, facts.source, facts.baseTarget])
    const projectState = testProjectState(() => store.validateDependencies({ requests: [] }))

    expect(messages(await validateTestProject({ projectDir: "/project", concurrency: 1, projectState }))).toEqual([
      'Объект метаданных «Catalog.Номенклатура.Attribute.Артикул» '
        + 'отсутствует в расширении. Заимствуйте его из основной конфигурации',
      'Объект метаданных «Catalog.Номенклатура» отсутствует в расширении. '
        + 'Заимствуйте его из основной конфигурации',
    ])

    appendStateFiles(store, [facts.extensionObject])
    expect(messages(await validateTestProject({ projectDir: "/project", concurrency: 1, projectState })))
      .toEqual([
        'Объект метаданных «Catalog.Номенклатура.Attribute.Артикул» '
          + 'отсутствует в расширении. Заимствуйте его из основной конфигурации',
      ])

    appendStateFiles(store, [facts.extensionObjectWithAttribute])
    expect(messages(await validateTestProject({ projectDir: "/project", concurrency: 1, projectState }))).toEqual([])
    store.rollbackUpdate()
  })

  it("проверяет доступность виртуальной ОсновнойТаблицы через декларации объекта", async () => {
    const dependencyValidator = createProjectStateDependencyValidator({
      dataTableContributors: [collectAppliedObjectDataTables],
    })
    const { store } = createBinaryProjectStateTestFixture(dependencyValidator)
    const facts = dataTableValidationFacts("РегистрНакопления.Продажи.Остатки")
    store.beginUpdate()
    appendStateFiles(store, [facts.configuration, facts.register, facts.form])
    const projectState = testProjectState(() => store.validateDependencies({ requests: [] }))

    expect(messages(await validateTestProject({ projectDir: "/project", concurrency: 1, projectState }))).toEqual([
      'Не найдена ссылка "AccumulationRegister.Продажи.Balance"',
    ])

    appendStateFiles(store, [dataTableValidationFacts("РегистрНакопления.Продажи.Обороты").form])
    expect(messages(await validateTestProject({ projectDir: "/project", concurrency: 1, projectState }))).toEqual([])
    store.rollbackUpdate()
  })

  it("возвращает projectPath для отсутствующего владельца", async () => {
    const { store } = createBinaryProjectStateTestFixture()
    store.beginUpdate()
    appendStateFiles(store, [{
      ...emptyYamlUpdate("cf/ОбщаяФорма/Продажи/Форма.yaml", "form"),
      pendingChecks: [{
        kind: "dataPath",
        yamlPath: ["ПутьКДанным"],
        location: { line: 3, col: 15, path: "/ПутьКДанным" },
        owner: { kind: "Документ", name: "Продажа" },
        value: "Объект.Номер",
        policyInput: { yaml: "Объект.Номер" },
        policy: "formDataPath",
      }],
    }])
    const projectState = testProjectState(() => store.validateDependencies({ requests: [] }))

    const result = await validateTestProject({ projectDir: "/project", concurrency: 1, projectState })

    expect([...result.diagnostics]).toEqual([expect.objectContaining({
      filePath: "cf/Документ/Продажа/Свойства.yaml",
      source: "cross-file",
      message: "Не найден владелец Документ.Продажа",
    })])
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

function validateTestProject(params: Parameters<typeof validateProject>[0]) {
  return validateProject(params, { async loadLanguages() { return testLanguages } })
}

async function writeLanguageProject(projectDir: string, languages: Readonly<Record<string, string>>): Promise<void> {
  const configurationDir = resolve(projectDir, "cf")
  await mkdir(resolve(configurationDir, "Язык"), { recursive: true })
  await writeFile(resolve(configurationDir, "Конфигурация.yaml"), "ОсновнойЯзык: Язык.Русский\n")
  await Promise.all(Object.entries(languages).map(([name, code]) =>
    writeFile(resolve(configurationDir, "Язык", `${name}.yaml`), `КодЯзыка: ${code}\n`)))
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

function dataTableValidationFacts(value: string) {
  const object = parseMetadataTargetFromYAML({
    value: "РегистрНакопления.Продажи",
    constraint: { kind: "object" },
  })
  const table = parseMetadataTargetFromYAML({ value, constraint: { kind: "dataTable" } })
  if (!object.ok || object.target.kind !== "object" || !table.ok || table.target.kind !== "dataTable") {
    throw new Error("Некорректные тестовые ссылки")
  }
  const yaml = (
    projectPath: string,
    yamlRole: ProjectStateYamlFileUpdate["yamlRole"],
    extra: Partial<ProjectStateYamlFileUpdate> = {},
  ): ProjectStateYamlFileUpdate => ({ ...emptyYamlUpdate(projectPath, yamlRole), ...extra })
  return {
    configuration: yaml("cf/Конфигурация.yaml", "configuration"),
    register: yaml("cf/РегистрНакопления/Продажи/Свойства.yaml", "properties", {
      targets: [{ kind: "object", canonical: object.canonical }],
      owners: [{
        owner: { kind: "РегистрНакопления", name: "Продажи" },
        facts: { registerType: "Turnovers" },
      }],
    }),
    form: yaml("cf/ОбщаяФорма/Список/Форма.yaml", "form", {
      pendingReferences: [{
        yamlPath: ["Реквизиты", "Список", "ДинамическийСписок", "ОсновнаяТаблица"],
        canonical: table.canonical,
        target: table.target,
        constraint: { kind: "dataTable" },
      }],
    }),
  }
}
