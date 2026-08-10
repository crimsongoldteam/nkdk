import { describe, expect, it } from "vitest"
import type { Diagnostic } from "./types"
import type {
  ComponentFirstPassPoolResult,
  FirstPassPoolResult,
  ValidationFirstPassFileResult,
} from "./validationWorkerPoolTypes"
import { evaluateProjectFirstPass } from "./projectFirstPassReadiness"

describe("evaluateProjectFirstPass", () => {
  it.each([
    { hasCf: true, cfSchemaErrors: 0, cfContributed: true, ready: true },
    { hasCf: true, cfSchemaErrors: 1, cfContributed: true, ready: false },
    { hasCf: true, cfSchemaErrors: 0, cfContributed: false, ready: false },
    { hasCf: false, cfSchemaErrors: 0, cfContributed: false, ready: false },
  ])(
    "returns configurationReady=$ready for hasCf=$hasCf, schemaErrors=$cfSchemaErrors, contributed=$cfContributed",
    ({ hasCf, cfSchemaErrors, cfContributed, ready }) => {
      const cfDiagnostic = diagnostic("/project/cf/Конфигурация.yaml", "semantic cf")
      const extensionSchemaDiagnostic = diagnostic(
        "/project/cfe/Продажи/Конфигурация.yaml",
        "schema cfe",
        "structure"
      )
      const extensionFactDiagnostic = diagnostic(
        "/project/cfe/Продажи/Конфигурация.yaml",
        "semantic cfe"
      )
      const firstPass = firstPassResult({
        cfContributed,
        cfSchemaDiagnostics:
          cfSchemaErrors === 0
            ? []
            : [diagnostic("/project/cf/Конфигурация.yaml", "schema cf", "structure")],
        cfDiagnostics: [cfDiagnostic],
        extensionDiagnostics: [extensionSchemaDiagnostic, extensionFactDiagnostic],
        extensionSchemaDiagnostics: [extensionSchemaDiagnostic],
      })

      const result = evaluateProjectFirstPass({
        hasConfiguration: hasCf,
        componentPaths: ["cf", "cfe/Продажи", "cfe/Склад"],
        firstPass,
      })

      expect(result.configurationReady).toBe(ready)
      expect(result.blockedExtensionPaths).toEqual(ready ? [] : ["cfe/Продажи", "cfe/Склад"])
      expect(result.publishedDiagnostics).toContain(cfDiagnostic)
      expect(result.publishedDiagnostics).toContain(extensionSchemaDiagnostic)
      if (ready) expect(result.publishedDiagnostics).toContain(extensionFactDiagnostic)
      else expect(result.publishedDiagnostics).not.toContain(extensionFactDiagnostic)
    }
  )

  it("requires a contributed cf/Конфигурация.yaml file", () => {
    const firstPass = firstPassResult({
      cfContributed: true,
      cfFilePath: "/project/cf/Справочник/Товары/Свойства.yaml",
      cfRootProjectPath: "cf/Справочник/Товары/Свойства.yaml",
    })

    expect(
      evaluateProjectFirstPass({
        hasConfiguration: true,
        componentPaths: ["cf", "cfe/Продажи"],
        firstPass,
      })
    ).toMatchObject({
      configurationReady: false,
      blockedExtensionPaths: ["cfe/Продажи"],
    })
  })
})

function firstPassResult(params: {
  cfContributed: boolean
  cfSchemaDiagnostics?: Diagnostic[]
  cfDiagnostics?: Diagnostic[]
  extensionSchemaDiagnostics?: Diagnostic[]
  extensionDiagnostics?: Diagnostic[]
  cfFilePath?: string
  cfRootProjectPath?: string
}): FirstPassPoolResult {
  const cfFileResult: ValidationFirstPassFileResult = {
    componentPath: "cf",
    filePath: params.cfFilePath ?? "/project/cf/Конфигурация.yaml",
    rootProjectPath: params.cfRootProjectPath ?? "cf/Конфигурация.yaml",
    contributedFacts: params.cfContributed,
    schemaDiagnostics: params.cfSchemaDiagnostics ?? [],
  }
  const extensionFileResult: ValidationFirstPassFileResult = {
    componentPath: "cfe/Продажи",
    filePath: "/project/cfe/Продажи/Конфигурация.yaml",
    rootProjectPath: "cfe/Продажи/Конфигурация.yaml",
    contributedFacts: true,
    schemaDiagnostics: params.extensionSchemaDiagnostics ?? [],
  }
  const components: ComponentFirstPassPoolResult[] = [
    componentResult(
      "cf",
      [cfFileResult],
      [...(params.cfSchemaDiagnostics ?? []), ...(params.cfDiagnostics ?? [])],
      params.cfSchemaDiagnostics ?? []
    ),
    componentResult(
      "cfe/Продажи",
      [extensionFileResult],
      params.extensionDiagnostics ?? [],
      params.extensionSchemaDiagnostics ?? []
    ),
  ]

  return {
    components,
    fileUpdateBatches: [],
    diagnostics: components.flatMap(({ diagnostics }) => diagnostics),
    schemaDiagnostics: components.flatMap(({ schemaDiagnostics }) => schemaDiagnostics),
    fileResults: components.flatMap(({ fileResults }) => fileResults),
    yamlLifetime: { current: 0, max: 1, parsed: 2, propertyEvents: 0 },
  }
}

function componentResult(
  componentPath: string,
  fileResults: ValidationFirstPassFileResult[],
  diagnostics: Diagnostic[],
  schemaDiagnostics: Diagnostic[]
): ComponentFirstPassPoolResult {
  return {
    componentPath,
    contribution: {
      objectRecords: [],
      objectIndexEntries: [],
      memberIndexEntries: [],
      valueIndexEntries: [],
      pendingReferences: [],
    },
    diagnostics,
    schemaDiagnostics,
    fileResults,
  }
}

function diagnostic(
  filePath: string,
  message: string,
  source: Diagnostic["source"] = "cross-file"
): Diagnostic {
  return { filePath, line: 1, col: 1, message, severity: "error", source }
}
