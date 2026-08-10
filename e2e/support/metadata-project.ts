import { cp, mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { performance } from "node:perf_hooks"
import {
  createProjectStateService,
  importConfigurationFromXml,
  type ConfigurationImportResult,
} from "@nkdk/core"

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

export async function removeImportedProject(source: ImportedMetadataProject): Promise<void> {
  await rm(source.root, { recursive: true, force: true })
}
