import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, isAbsolute, join, relative, resolve } from "node:path"
import { performance } from "node:perf_hooks"
import {
  createConfigurationLanguages,
  createMetadataRuntime,
  exportToYAML,
  parseMetadataYaml,
  type ConfigurationImportResult,
  type FullXmlSyncResult,
  type MetadataDiagnostic,
} from "@nkdk/runtime"
import { metadataRules } from "../../packages/rules/metadata/composition/metadataRules"
import { compareFileTrees, type FileTreeComparison } from "./file-tree"

function createE2EMetadataRuntime() {
  return createMetadataRuntime({
    rules: metadataRules,
    workers: {
      preparedYamlProject: new URL(
        "../../packages/rules/metadata/composition/workers/preparedYamlProject.ts",
        import.meta.url,
      ),
      importFromXml: new URL(
        "../../packages/rules/metadata/composition/workers/importFromXml.ts",
        import.meta.url,
      ),
      fullSyncToXml: new URL(
        "../../packages/rules/metadata/composition/workers/fullSyncToXml.ts",
        import.meta.url,
      ),
      generic: new URL(
        "../../packages/rules/metadata/composition/workers/generic.ts",
        import.meta.url,
      ),
    },
  })
}

type E2EMetadataRuntime = ReturnType<typeof createE2EMetadataRuntime>
type E2EProjectState = ReturnType<E2EMetadataRuntime["projects"]["createState"]>

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
  readonly clean: readonly ComparableDiagnostic[]
  readonly warm: readonly ComparableDiagnostic[]
  readonly cold: readonly ComparableDiagnostic[]
  readonly durationsMs: {
    readonly clean: number
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
export const NKDK_FIXTURES_ROOT = resolve(import.meta.dirname, "../fixtures/nkdk")

const e2eLanguages = createConfigurationLanguages({
  default: "ru",
  registered: ["ru"],
})

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
  languages: e2eLanguages,
  version: "2.20",
  exportToYAML: { toTyped: false },
  fromXML: { forReference: false },
} as const

export const SYNC_CONTEXT = {
  defaultLanguage: "ru",
  languages: e2eLanguages,
  version: "2.20",
  exportToYAML: { toTyped: false },
} as const

export async function importMetadataProject(): Promise<ImportedMetadataProject> {
  const root = await mkdtemp(join(tmpdir(), "nkdk-e2e-"))
  const projectDir = join(root, "project")
  const runtime = createE2EMetadataRuntime()
  const projectState = runtime.projects.createState()
  const results: ConfigurationImportResult[] = []
  const durationsMs: Record<string, number> = {}
  let completed = false
  try {
    for (const component of E2E_COMPONENTS) {
      const startedAt = performance.now()
      const result = await runtime.import.configurationFromXml({
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
    await runtime.close()
    if (!completed) await rm(root, { recursive: true, force: true })
  }
}

export async function cloneImportedProject(source: ImportedMetadataProject, name: string): Promise<string> {
  const target = join(source.root, name)
  await cp(source.projectDir, target, { recursive: true })
  return target
}

export async function cloneNkdkFixtureProject(
  owner: Pick<ImportedMetadataProject, "root">,
  name: string,
  fixtureRoot = NKDK_FIXTURES_ROOT,
): Promise<string> {
  const target = join(owner.root, name)
  await cp(fixtureRoot, target, { recursive: true })
  return target
}

export async function validateProjectCacheParity(projectDir: string): Promise<ValidationParityResult> {
  const runtime = createE2EMetadataRuntime()
  const projectState = runtime.projects.createState()
  try {
    const cleanStartedAt = performance.now()
    const clean = await runValidation(runtime, projectState, projectDir)
    const cleanDurationMs = performance.now() - cleanStartedAt

    await removeRequiredOwnExtensionField(projectDir)
    const warmStartedAt = performance.now()
    const warm = await runValidation(runtime, projectState, projectDir)
    const warmDurationMs = performance.now() - warmStartedAt

    await projectState.reset(projectDir)
    const coldStartedAt = performance.now()
    const cold = await runValidation(runtime, projectState, projectDir)
    const coldDurationMs = performance.now() - coldStartedAt

    return {
      clean,
      warm,
      cold,
      durationsMs: { clean: cleanDurationMs, warm: warmDurationMs, cold: coldDurationMs },
    }
  } finally {
    await runtime.close()
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
  const runtime = createE2EMetadataRuntime()
  const projectState = runtime.projects.createState()
  const results: ComponentRoundTripResult[] = []
  try {
    for (const component of E2E_COMPONENTS) {
      const xmlDir = join(dirname(params.projectDir), `xml-${component.reportName}`)
      await rm(xmlDir, { recursive: true, force: true })
      await mkdir(xmlDir, { recursive: true })
      const startedAt = performance.now()
      const sync = await runtime.sync.configurationToXml({
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
        compareOptions: {
          xmlComparison: "bytes",
          textComparison: "normalize",
          ignoredPaths: ["ConfigDumpInfo.xml"],
        },
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
    await runtime.close()
  }
}

export async function compareSuccessfulSync(params: {
  readonly sync: FullXmlSyncResult
  readonly expectedDir: string
  readonly actualDir: string
  readonly reportDir: string
  readonly compare?: typeof compareFileTrees
  readonly compareOptions?: Pick<
    Parameters<typeof compareFileTrees>[0],
    "xmlComparison" | "textComparison" | "ignoredPaths"
  >
}): Promise<
  | { readonly kind: "syncFailed" }
  | { readonly kind: "compared"; readonly comparison: FileTreeComparison }
> {
  if (params.sync.failed.length > 0) return { kind: "syncFailed" }
  const comparison = await (params.compare ?? compareFileTrees)({
    expectedDir: params.expectedDir,
    actualDir: params.actualDir,
    reportDir: params.reportDir,
    ...params.compareOptions,
  })
  return { kind: "compared", comparison }
}

export async function removeImportedProject(source: ImportedMetadataProject): Promise<void> {
  await rm(source.root, { recursive: true, force: true })
}

async function runValidation(
  runtime: E2EMetadataRuntime,
  projectState: E2EProjectState,
  projectDir: string,
): Promise<readonly ComparableDiagnostic[]> {
  const { diagnostics } = await runtime.validation.validateProject({
    projectDir,
    projectState,
  })
  try {
    return [...diagnostics].map((diagnostic) => comparableDiagnostic(projectDir, diagnostic))
  } finally {
    diagnostics.release()
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
