import type { FirstPassPoolResult } from "./validationWorkerPoolTypes"
import type { Diagnostic } from "./types"

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
