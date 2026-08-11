import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, isAbsolute, join, relative, resolve } from "node:path"
import { performance } from "node:perf_hooks"
import {
  exportToYAML,
  parseMetadataYaml,
  type ConfigurationImportResult,
  type FullXmlSyncResult,
  type MetadataDiagnostic,
} from "@nkdk/runtime"
import { createDefaultProjectStateService } from "../../packages/rules/metadata/composition/projectState"
import { registerCoreMetadata } from "../../packages/rules/metadata/composition/coreMetadata"
import { importConfigurationFromXml } from "../../packages/rules/metadata/importFromXml/importConfiguration"
import { syncConfigurationToXml } from "../../packages/rules/metadata/fullSyncToXml/syncConfiguration"
import { validateProject } from "../../packages/rules/metadata/project/validateProject"
import { createMetadataWorkerPoolHandle } from "../../packages/rules/metadata/workerPool/handle"
import { compareFileTrees, type FileTreeComparison } from "./file-tree"

registerCoreMetadata()

const genericWorkerUrl = new URL(
  "../../packages/rules/metadata/composition/workers/generic.ts",
  import.meta.url,
)

function createProjectStateService() {
  return createDefaultProjectStateService({
    workerPool: createMetadataWorkerPoolHandle({ workerUrl: genericWorkerUrl }),
  })
}

export interface E2EComponent {
  readonly fixturePath: string
  readonly componentPath: "cf" | `cfe/${string}`
  readonly reportName: string
}

export interface ImportedMetadataProject {
  readonly root: string
  readonly projectDir: string
  readonly results: readonly ConfigurationImportResult[]
  readonly durationsMs: Readonly<Record<string, number>>
}

export interface ComparableDiagnostic {
  readonly filePath: string
  readonly severity: MetadataDiagnostic["severity"]
  readonly source: MetadataDiagnostic["source"]
  readonly message: string
  readonly path?: string
}

export interface ValidationParityResult {
  readonly warm: readonly ComparableDiagnostic[]
  readonly cold: readonly ComparableDiagnostic[]
  readonly durationsMs: {
    readonly warm: number
    readonly cold: number
  }
}

export type ComponentRoundTripResult = {
  readonly component: E2EComponent
  readonly sync: FullXmlSyncResult
  readonly durationMs: number
} & (
  | { readonly kind: "syncFailed" }
  | { readonly kind: "compared"; readonly comparison: FileTreeComparison }
)

const fixturesRoot = resolve(import.meta.dirname, "../fixtures/xml")

export const E2E_COMPONENTS = [
  { fixturePath: "cf", componentPath: "cf", reportName: "cf" },
  {
    fixturePath: "cfe/all-extension",
    componentPath: "cfe/Расширение_All",
    reportName: "cfe-all-extension",
  },
  {
    fixturePath: "cfe/control",
    componentPath: "cfe/РасширениеКонтроль",
    reportName: "cfe-control",
  },
  {
    fixturePath: "cfe/default",
    componentPath: "cfe/РасширениеПоУмолчанию",
    reportName: "cfe-default",
  },
] as const satisfies readonly E2EComponent[]

export const IMPORT_CONTEXT = {
  defaultLanguage: "ru",
  version: "2.20",
  exportToYAML: { toTyped: false },
  fromXML: { forReference: false },
} as const

export const SYNC_CONTEXT = {
  defaultLanguage: "ru",
  version: "2.20",
  exportToYAML: { toTyped: false },
} as const

export async function importMetadataProject(): Promise<ImportedMetadataProject> {
  const root = await mkdtemp(join(tmpdir(), "nkdk-e2e-"))
  const projectDir = join(root, "project")
  const projectState = createProjectStateService()
  const results: ConfigurationImportResult[] = []
  const durationsMs: Record<string, number> = {}
  let completed = false
  try {
    for (const component of E2E_COMPONENTS) {
      const startedAt = performance.now()
      const result = await importConfigurationFromXml({
        context: IMPORT_CONTEXT,
        inputDir: resolve(fixturesRoot, component.fixturePath),
        projectDir,
        requestedComponentPath: component.componentPath,
        concurrency: 2,
        operationId: `e2e-import-${component.reportName}`,
        projectState,
      })
      durationsMs[`import:${component.reportName}`] = performance.now() - startedAt
      results.push(result)
    }
    completed = true
    return { root, projectDir, results, durationsMs }
  } finally {
    await projectState.close()
    if (!completed) await rm(root, { recursive: true, force: true })
  }
}

export async function cloneImportedProject(source: ImportedMetadataProject, name: string): Promise<string> {
  const target = join(source.root, name)
  await cp(source.projectDir, target, { recursive: true })
  return target
}

export async function validateCleanProject(projectDir: string): Promise<readonly ComparableDiagnostic[]> {
  return runValidation(projectDir)
}

export async function validateChangedProject(projectDir: string): Promise<ValidationParityResult> {
  await removeRequiredOwnExtensionField(projectDir)

  const warmStartedAt = performance.now()
  const warm = await runValidation(projectDir)
  const warmDurationMs = performance.now() - warmStartedAt

  await rm(join(projectDir, ".nkdk"), { recursive: true, force: true })
  const coldStartedAt = performance.now()
  const cold = await runValidation(projectDir)
  const coldDurationMs = performance.now() - coldStartedAt

  return {
    warm,
    cold,
    durationsMs: { warm: warmDurationMs, cold: coldDurationMs },
  }
}

async function removeRequiredOwnExtensionField(projectDir: string): Promise<void> {
  const projectPath = [
    "cfe",
    "Расширение_All",
    "ВнешнийИсточникДанных",
    "ВнешнийИсточникДанныхВсеСвойстваExt",
    "Кубы",
    "КубВсеСвойства",
    "Свойства.yaml",
  ]
  const filePath = join(projectDir, ...projectPath)
  const parsed = parseMetadataYaml(await readFile(filePath, "utf8"))
  if (parsed.syntaxErrors.length > 0) {
    throw new Error(`Некорректный исходный YAML ${projectPath.join("/")}`)
  }
  const yaml = yamlRecord(parsed.data, projectPath.join("/"))
  const requiredField = yaml["ИмяВИсточникеДанных"]
  if (typeof requiredField !== "string") {
    throw new Error(`В ${projectPath.join("/")} отсутствует строковое поле ИмяВИсточникеДанных`)
  }
  delete yaml["ИмяВИсточникеДанных"]
  await writeFile(filePath, `${exportToYAML(yaml)}\n`, "utf8")
}

function yamlRecord(value: unknown, projectPath: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`В ${projectPath} ожидался YAML-объект`)
  }
  return value as Record<string, unknown>
}

export async function roundTripMetadataProject(params: {
  readonly projectDir: string
  readonly reportRoot: string
}): Promise<readonly ComponentRoundTripResult[]> {
  await rm(params.reportRoot, { recursive: true, force: true })
  const projectState = createProjectStateService()
  const results: ComponentRoundTripResult[] = []
  try {
    for (const component of E2E_COMPONENTS) {
      const xmlDir = join(dirname(params.projectDir), `xml-${component.reportName}`)
      await rm(xmlDir, { recursive: true, force: true })
      await mkdir(xmlDir, { recursive: true })
      const startedAt = performance.now()
      const sync = await syncConfigurationToXml({
        context: SYNC_CONTEXT,
        projectDir: params.projectDir,
        componentPath: component.componentPath,
        xmlDir,
        concurrency: 2,
        projectState,
      })
      const compared = await compareSuccessfulSync({
        sync,
        expectedDir: resolve(fixturesRoot, component.fixturePath),
        actualDir: xmlDir,
        reportDir: resolve(params.reportRoot, component.reportName),
      })
      results.push({
        component,
        sync,
        ...compared,
        durationMs: performance.now() - startedAt,
      })
    }
    return results
  } finally {
    await projectState.close()
  }
}

export async function compareSuccessfulSync(params: {
  readonly sync: FullXmlSyncResult
  readonly expectedDir: string
  readonly actualDir: string
  readonly reportDir: string
  readonly compare?: typeof compareFileTrees
}): Promise<
  | { readonly kind: "syncFailed" }
  | { readonly kind: "compared"; readonly comparison: FileTreeComparison }
> {
  if (params.sync.failed.length > 0) return { kind: "syncFailed" }
  const comparison = await (params.compare ?? compareFileTrees)({
    expectedDir: params.expectedDir,
    actualDir: params.actualDir,
    reportDir: params.reportDir,
  })
  return { kind: "compared", comparison }
}

export async function removeImportedProject(source: ImportedMetadataProject): Promise<void> {
  await rm(source.root, { recursive: true, force: true })
}

async function runValidation(projectDir: string): Promise<readonly ComparableDiagnostic[]> {
  const projectState = createProjectStateService()
  try {
    const { diagnostics } = await validateProject({
      projectDir,
      context: SYNC_CONTEXT,
      concurrency: 2,
      projectState,
    })
    try {
      return [...diagnostics].map((diagnostic) => comparableDiagnostic(projectDir, diagnostic))
    } finally {
      diagnostics.release()
    }
  } finally {
    await projectState.close()
  }
}

function comparableDiagnostic(projectDir: string, diagnostic: MetadataDiagnostic): ComparableDiagnostic {
  const filePath = isAbsolute(diagnostic.filePath)
    ? relative(projectDir, diagnostic.filePath).replaceAll("\\", "/")
    : diagnostic.filePath
  return {
    filePath,
    severity: diagnostic.severity,
    source: diagnostic.source,
    message: diagnostic.message,
    ...(diagnostic.path === undefined ? {} : { path: diagnostic.path }),
  }
}
