import type { FirstPassPoolResult } from "./validationWorkerPoolTypes"
import type { Diagnostic } from "./types"
import { join } from "node:path"

export interface ProjectFirstPassReadiness {
  configurationReady: boolean
  blockedExtensionPaths: readonly string[]
  publishedDiagnostics: Diagnostic[]
}

export function evaluateProjectFirstPass(params: {
  hasConfiguration: boolean
  componentPaths: readonly string[]
  firstPass: FirstPassPoolResult
}): ProjectFirstPassReadiness {
  const cfFiles = params.firstPass.fileResults.filter(({ componentPath }) => componentPath === "cf")
  const configurationReady =
    params.hasConfiguration &&
    cfFiles.some(({ rootProjectPath }) => rootProjectPath === "cf/Конфигурация.yaml") &&
    cfFiles.length > 0 &&
    cfFiles.every(
      ({ contributedFacts, schemaDiagnostics }) =>
        contributedFacts && !schemaDiagnostics.some(({ severity }) => severity === "error")
    )
  const blockedExtensionPaths = configurationReady
    ? []
    : params.componentPaths.filter(
        (componentPath) => componentPath.startsWith("cfe/") && componentPath.length > "cfe/".length
      )
  const publishedDiagnostics = configurationReady
    ? [...params.firstPass.diagnostics]
    : params.firstPass.components.flatMap((component) =>
        component.componentPath === "cf" ? component.diagnostics : component.schemaDiagnostics
      )

  return {
    configurationReady,
    blockedExtensionPaths,
    publishedDiagnostics,
  }
}

export function createProjectDegradationDiagnostics(params: {
  projectDir: string
  hasConfiguration: boolean
  blockedComponentPaths: readonly string[]
}): Diagnostic[] {
  const diagnostics = params.blockedComponentPaths.map(
    (componentPath): Diagnostic => ({
      filePath: join(params.projectDir, componentPath, "Конфигурация.yaml"),
      line: 1,
      col: 1,
      severity: "error",
      source: "cross-file",
      message: "Семантическая валидация расширения невозможна из-за ошибок базовой конфигурации",
    }),
  )
  if (!params.hasConfiguration) {
    diagnostics.push({
      filePath: join(params.projectDir, "cf", "Конфигурация.yaml"),
      line: 1,
      col: 1,
      severity: "error",
      source: "structure",
      message: "Базовая конфигурация cf не найдена",
    })
  }
  return diagnostics
}
