import type { ProjectStateDependencyValidator, ProjectStateXmlAnomalyBoundary } from "../contracts/dependencyValidation"
import { expect, it, vi } from "vitest"
import { buildTypedProjectStateSnapshot } from "./typedBuilder"
import { validateSnapshotDependencyDiagnostics } from "./diagnosticBatches"
import { createProjectStateFragmentWriter, openProjectStateFragment } from "./fragment"
import { ProjectStateSnapshotView } from "./snapshot"
import { richYamlUpdate } from "./testData"

const yamlPath = ["Значение"] as const

it("не проверяет зависимость после ошибки ссылки той же XML-границы", () => {
  const validateDependencies = vi.fn(() => emptyResult())
  const validator = testValidator({
    validateReferences: ({ checks }) => ({
      diagnostics: [],
      acceptedXmlAnomalies: [referenceBoundary(checks[0]!)],
    }),
    validateDependencies,
  })

  expect(validateSnapshotDependencyDiagnostics(snapshot("pending"), "/project", validator)).toEqual([])
  expect(validateDependencies).not.toHaveBeenCalled()
})

it("подтверждает XML-границу ошибкой зависимости после правильной ссылки", () => {
  const validateDependencies = vi.fn(acceptFirstDependency)
  const validator = testValidator({ validateDependencies })

  expect(validateSnapshotDependencyDiagnostics(snapshot("pending"), "/project", validator)).toEqual([])
  expect(validateDependencies).toHaveBeenCalledOnce()
})

it("сообщает о лишнем теге один раз после всех правильных проверок границы", () => {
  const diagnostics = validateSnapshotDependencyDiagnostics(snapshot("pending"), "/project", testValidator())

  expect(diagnostics).toEqual([expect.objectContaining({
    filePath: "cf/Объект.yaml",
    path: "/Значение",
    source: "structure",
    message: "Тег XML-аномалии лишний: значение не содержит ошибки",
  })])
})

it("не запускает вторую техническую проверку подтверждённой XML-границы", () => {
  const validateDependencies = vi.fn(acceptFirstDependency)
  const validator = testValidator({ validateDependencies })

  expect(validateSnapshotDependencyDiagnostics(snapshot("pending", 2), "/project", validator)).toEqual([])
  expect(validateDependencies).toHaveBeenCalledOnce()
  expect(validateDependencies.mock.calls[0]![0].checks).toHaveLength(1)
})

it("не запускает смысловые обработчики для accepted-границы", () => {
  const validateReferences = vi.fn(() => emptyResult())
  const validateDependencies = vi.fn(() => emptyResult())
  const validator = testValidator({ validateReferences, validateDependencies })

  expect(validateSnapshotDependencyDiagnostics(snapshot("accepted"), "/project", validator)).toEqual([])
  expect(validateReferences).not.toHaveBeenCalled()
  expect(validateDependencies).not.toHaveBeenCalled()
})

it.each([
  { state: "pending", boundarySource: "reference" },
  { state: "accepted", boundarySource: "dependency" },
  { state: "none", boundarySource: "both" },
] as const)(
  "применяет $state XML-границу ($boundarySource) к межфайловой проверке, сохраняя остальные ошибки и факты",
  ({ state, boundarySource }) => {
    const semantic = {
      filePath: "cf/Объект.yaml", line: 1, col: 1, path: "/Значение",
      severity: "error" as const, source: "cross-file" as const, message: "Смысловая ошибка",
    }
    const otherProperty = { ...semantic, path: "/Другое" }
    const otherFile = { ...semantic, filePath: "cfe/Расширение/Объект.yaml" }
    const nestedProperty = { ...semantic, path: "/Значение/Вложенное" }
    const structural = { ...semantic, source: "structure" as const, message: "Ошибка структуры" }
    const warning = { ...semantic, severity: "warning" as const }
    const validateStructuredDocuments = vi.fn<ProjectStateDependencyValidator["validateStructuredDocuments"]>(() => [
      semantic, otherProperty, otherFile, nestedProperty, structural, warning,
    ])
    const diagnostics = validateSnapshotDependencyDiagnostics(snapshot(state, 1, boundarySource), "/project", testValidator({
      validateStructuredDocuments,
    }))

    expect(diagnostics).toEqual([
      ...(state === "none" ? [semantic] : []),
      otherProperty, otherFile, nestedProperty, structural, warning,
    ])
    expect(validateStructuredDocuments.mock.calls[0]![0].facts).toEqual([{
      componentPath: "cf", projectPath: "cf/Объект.yaml",
      entry: {
        documentKind: "test", representation: "working", logicalAddress: "Товары",
        workingProjectPath: "Объект.yaml", componentKind: "dataPath", name: "Объект.Код", yamlPath,
      },
    }])
  },
)

it("оставляет специализированную диагностику вместо общей на той же YAML-границе", () => {
  const common = {
    filePath: "cf/Объект.yaml",
    line: 1,
    col: 1,
    path: "/Значение",
    severity: "error" as const,
    source: "structure" as const,
    message: "Общая ошибка DataPath",
  }
  const specialized = {
    ...common,
    source: "cross-file" as const,
    message: "Специализированная ошибка формы",
  }
  const validator = testValidator({
    validateDependencies: () => ({ diagnostics: [common], acceptedXmlAnomalies: [] }),
    validateStructuredDocuments: () => [specialized],
  })

  const diagnostics = validateSnapshotDependencyDiagnostics(snapshot("none"), "/project", validator)
  expect(diagnostics).toContainEqual(specialized)
  expect(diagnostics).not.toContainEqual(common)
})

it("отклоняет абсолютный путь от валидатора зависимостей", () => {
  const validator = testValidator({
    validateStructuredDocuments: () => [{
      filePath: "C:\\project\\cf\\Объект.yaml",
      line: 1,
      col: 1,
      severity: "error",
      source: "structure",
      message: "Ошибка",
    }],
  })

  expect(() => validateSnapshotDependencyDiagnostics(snapshot("none"), "/project", validator))
    .toThrow("ProjectState dependency validation вернул недопустимый путь диагностики")
})

function snapshot(
  xmlAnomaly: "pending" | "accepted" | "none",
  dependencyCopies = 1,
  boundarySource: "reference" | "dependency" | "both" = "both",
): ProjectStateSnapshotView {
  const writer = createProjectStateFragmentWriter()
  const update = richYamlUpdate("cf/Объект.yaml", "cf", "Товары")
  const reference = update.pendingReferences[0]!
  const originalDependency = update.pendingChecks[0]!
  if (originalDependency.kind !== "dataPath") throw new Error("Ожидалась проверка DataPath")
  const { xmlAnomaly: _xmlAnomaly, ...dependency } = originalDependency
  writer.appendFile({
    ...update,
    localValidation: { contributedFacts: true, diagnostics: [], schemaDiagnostics: [] },
    structuredDocuments: [{
      documentKind: "test", representation: "working", logicalAddress: "Товары",
      workingProjectPath: "Объект.yaml", componentKind: "dataPath", name: "Объект.Код", yamlPath,
    }],
    pendingReferences: boundarySource === "dependency" ? [] : [{
      ...reference,
      yamlPath: [...yamlPath],
      ...(xmlAnomaly === "none" ? {} : { xmlAnomaly }),
    }],
    pendingChecks: Array.from({ length: boundarySource === "reference" ? 0 : dependencyCopies }, () => ({
      ...dependency,
      yamlPath: [...yamlPath],
      location: { ...dependency.location, path: "/Значение" },
      ...(xmlAnomaly === "none" ? {} : { xmlAnomaly }),
    })),
  }, 1n)
  return new ProjectStateSnapshotView(buildTypedProjectStateSnapshot({
    fragments: [openProjectStateFragment(writer.finish())],
    deletions: [],
  }))
}

function testValidator(overrides: Partial<ProjectStateDependencyValidator> = {}): ProjectStateDependencyValidator {
  return {
    readReadiness: () => ({ blockedComponentPaths: new Set(), diagnostics: [] }),
    resolveDataPaths: () => [],
    validateReferences: () => emptyResult(),
    validateOwners: () => [],
    validateDependencies: () => emptyResult(),
    validateAddressableRequired: () => [],
    validateReferenceCoverage: () => [],
    validateStructuredDocuments: () => [],
    ...overrides,
  }
}

function emptyResult() {
  return { diagnostics: [], acceptedXmlAnomalies: [] }
}

function referenceBoundary(
  check: Parameters<ProjectStateDependencyValidator["validateReferences"]>[0]["checks"][number],
): ProjectStateXmlAnomalyBoundary {
  return {
    componentPath: check.componentPath,
    projectPath: check.reference.filePath,
    yamlPath: check.reference.yamlPath,
  }
}

function dependencyBoundary(
  check: Parameters<ProjectStateDependencyValidator["validateDependencies"]>[0]["checks"][number],
): ProjectStateXmlAnomalyBoundary {
  return {
    componentPath: check.componentPath,
    projectPath: check.projectPath,
    yamlPath: check.check.yamlPath,
  }
}

function acceptFirstDependency(
  params: Parameters<ProjectStateDependencyValidator["validateDependencies"]>[0],
) {
  return {
    diagnostics: [],
    acceptedXmlAnomalies: [dependencyBoundary(params.checks[0]!)],
  }
}
