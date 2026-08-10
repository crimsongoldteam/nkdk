import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, isAbsolute, join, relative, resolve } from "node:path"
import { performance } from "node:perf_hooks"
import {
  createProjectStateService,
  importConfigurationFromXml,
  syncConfigurationToXML,
  validateProject,
  type ConfigurationImportResult,
  type FullXmlSyncResult,
  type MetadataDiagnostic,
} from "@nkdk/core"
import { compareFileTrees, type FileTreeComparison } from "./file-tree"

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

export interface ComponentRoundTripResult {
  readonly component: E2EComponent
  readonly sync: FullXmlSyncResult
  readonly comparison: FileTreeComparison
  readonly durationMs: number
}

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
  const configurationPath = join(projectDir, "cf", "Конфигурация.yaml")
  const original = await readFile(configurationPath, "utf8")
  await writeFile(
    configurationPath,
    `${original.endsWith("\n") ? original : `${original}\n`}НеизвестноеПолеE2E: true\n`,
    "utf8",
  )

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
      const sync = await syncConfigurationToXML({
        context: SYNC_CONTEXT,
        projectDir: params.projectDir,
        componentPath: component.componentPath,
        xmlDir,
        concurrency: 2,
        projectState,
      })
      const comparison = await compareFileTrees({
        expectedDir: resolve(fixturesRoot, component.fixturePath),
        actualDir: xmlDir,
        reportDir: resolve(params.reportRoot, component.reportName),
      })
      results.push({
        component,
        sync,
        comparison,
        durationMs: performance.now() - startedAt,
      })
    }
    return results
  } finally {
    await projectState.close()
  }
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
