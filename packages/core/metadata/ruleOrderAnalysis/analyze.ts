import { mkdtemp, readdir, rm } from "node:fs/promises"
import { availableParallelism, tmpdir } from "node:os"
import { join, resolve } from "node:path"
import type { SharedValidationSnapshot } from "../validation/sharedValidationSnapshot"
import { registerCoreMetadata } from "../register"
import { compileRegisteredMetadataResourceTopology } from "../resourceTopology/registry"
import {
  discoverXmlImport,
  readXmlImportComponentRoot,
} from "../importFromXml/discovery"
import { resolveXmlImportComponent } from "../importFromXml/componentDescriptor"
import {
  createLayeredImportReferenceSnapshot,
} from "../importFromXml/componentReferenceIndex"
import { createImportSharedValidationSnapshot } from "../importFromXml/metadataSnapshot"
import {
  createXmlImportWorkerPoolHandle,
  type XmlImportWorkerPoolHandle,
} from "../importFromXml/workerPool"
import type { ImportAssignment } from "../importFromXml/types"
import { createRuleOrderAggregate, type RuleOrderRuleReport } from "./aggregate"
import {
  createCanonicalRuleOrderAggregate,
  type CanonicalRuleOrder,
} from "./canonicalOrder"
import { buildRuntimeRuleOrderCatalog } from "./catalog"
import type { RuleOrderObservation, RuleOrderSource } from "./types"

export interface AnalyzeRuleOrderParams {
  xmlRoot: string
  configuration?: string
  extensionRoot?: string
  extensionBase?: string
  metadataDir: string
  concurrency?: number
  witnessLimit?: number
  onObservation?(observation: RuleOrderObservation): void | Promise<void>
}

export interface RuleOrderConfigurationStat {
  sourceKind: "configuration" | "configurationExtension"
  configuration: string
  baseConfiguration?: string
  assignmentCount: number
  xmlFileCount: number
  observationCount: number
  skippedObservationCount: number
}

export interface AnalyzeRuleOrderResult {
  configurations: readonly string[]
  configurationStats: readonly RuleOrderConfigurationStat[]
  assignmentCount: number
  xmlFileCount: number
  observationCount: number
  skippedObservationCount: number
  skippedItemTypes: readonly { itemType: string; count: number }[]
  rules: readonly RuleOrderRuleReport[]
  canonicalOrders: readonly CanonicalRuleOrder[]
  unobservedSources: readonly RuleOrderSource[]
  ambiguities: readonly { candidate: string; reason: string }[]
}

interface RuleOrderInput {
  label: string
  xmlDir: string
  sourceKind: "configuration" | "configurationExtension"
  expectedComponentKind: "configuration" | "configurationExtension"
  baseConfiguration?: string
}

export interface RuleOrderAnalyzerDependencies {
  listDirectories(root: string): Promise<readonly string[]>
  readComponentRoot(xmlDir: string): Promise<Record<string, unknown>>
  resolveComponent(root: Record<string, unknown>): {
    kind: string
    metadataItemAugmenter?: string
  }
  discover(xmlDir: string): Promise<{ assignments: ImportAssignment[] }>
  createWorkerPoolHandle(concurrency: number): XmlImportWorkerPoolHandle
}

const defaultDependencies: RuleOrderAnalyzerDependencies = {
  async listDirectories(root) {
    return (await readdir(root, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort(bytewiseCompare)
  },
  readComponentRoot: readXmlImportComponentRoot,
  resolveComponent: resolveXmlImportComponent,
  discover(xmlDir) {
    return discoverXmlImport({
      xmlDir,
      topology: compileRegisteredMetadataResourceTopology(),
    })
  },
  createWorkerPoolHandle(concurrency) {
    return createXmlImportWorkerPoolHandle({ concurrency })
  },
}

export async function analyzeRuleOrder(
  params: AnalyzeRuleOrderParams,
  dependencies: RuleOrderAnalyzerDependencies = defaultDependencies
): Promise<AnalyzeRuleOrderResult> {
  registerCoreMetadata()
  validateExtensionParams(params)
  const catalog = await buildRuntimeRuleOrderCatalog({ metadataDir: params.metadataDir })
  const inputs = await createInputs(params, dependencies)
  const aggregate = createRuleOrderAggregate({ witnessLimit: params.witnessLimit })
  const canonicalOrderAggregate = createCanonicalRuleOrderAggregate()
  const skippedItemTypes = new Map<string, number>()
  const configurationStats: RuleOrderConfigurationStat[] = []
  const handle = dependencies.createWorkerPoolHandle(
    params.concurrency ?? Math.max(1, availableParallelism() - 1)
  )
  let extensionBaseSnapshot: SharedValidationSnapshot | undefined

  try {
    for (const input of inputs) {
      const root = await dependencies.readComponentRoot(input.xmlDir)
      const descriptor = dependencies.resolveComponent(root)
      if (descriptor.kind !== input.expectedComponentKind) {
        throw new Error(
          `${input.label}: ожидался XML-компонент ${input.expectedComponentKind}, обнаружен ${descriptor.kind}`
        )
      }
      if (input.sourceKind === "configurationExtension" && extensionBaseSnapshot === undefined) {
        throw new Error(`${input.label}: не подготовлен базовый снимок ${input.baseConfiguration}`)
      }

      const discovered = await dependencies.discover(input.xmlDir)
      const pool = handle.createOperationPool()
      const outputDir = await mkdtemp(join(tmpdir(), "nkdk-rule-order-analysis-"))
      let observationCount = 0
      let skippedObservationCount = 0
      try {
        await pool.initialize({
          operationId: `rule-order-${input.label.replace("/", "-")}`,
          context: {
            defaultLanguage: "ru",
            version: "2.20",
            exportToYAML: { toTyped: false },
            fromXML: { forReference: false },
          },
          outputDir,
          componentKind: descriptor.kind,
          ...(descriptor.metadataItemAugmenter === undefined
            ? {}
            : { metadataItemAugmenter: descriptor.metadataItemAugmenter }),
        })
        const first = await pool.runRuleOrderAnalysisFirstPass({
          configuration: input.label,
          metadataDir: params.metadataDir,
          assignments: discovered.assignments,
        })
        assertNoErrors(input.label, first.diagnostics)
        const localSnapshot = createImportSharedValidationSnapshot(first.validationContribution)
        const second = await pool.runSecondPass(
          createLayeredImportReferenceSnapshot({
            local: localSnapshot,
            ...(input.sourceKind === "configurationExtension"
              ? { base: extensionBaseSnapshot }
              : {}),
          })
        )
        assertNoErrors(input.label, second.diagnostics)
        if (
          input.sourceKind === "configuration" &&
          params.extensionBase !== undefined &&
          input.label === `cf/${params.extensionBase}`
        ) {
          extensionBaseSnapshot = localSnapshot
        }

        skippedObservationCount = first.unmatchedObservationCount
        for (const skipped of first.unmatchedItemTypes) {
          skippedItemTypes.set(skipped.itemType, (skippedItemTypes.get(skipped.itemType) ?? 0) + skipped.count)
        }
        for (const observation of first.observations) {
          observationCount += 1
          await params.onObservation?.(observation)
          aggregate.accept(observation)
          canonicalOrderAggregate.accept(observation)
        }
      } finally {
        await pool.close()
        await rm(outputDir, { recursive: true, force: true })
      }
      configurationStats.push({
        sourceKind: input.sourceKind,
        configuration: input.label,
        ...(input.baseConfiguration === undefined
          ? {}
          : { baseConfiguration: input.baseConfiguration }),
        assignmentCount: discovered.assignments.length,
        xmlFileCount: discovered.assignments.reduce(
          (sum, assignment) => sum + assignment.xmlFiles.length,
          0
        ),
        observationCount,
        skippedObservationCount,
      })
    }
  } finally {
    await handle.close()
  }

  const canonicalOrders = canonicalOrderAggregate.finish()
  const observedCandidates = new Set(canonicalOrders.map((order) => order.source.candidate))
  const unobservedSources = catalog.sources().filter((source) => !observedCandidates.has(source.candidate))

  return {
    configurations: inputs.map((input) => input.label),
    configurationStats,
    assignmentCount: configurationStats.reduce((sum, stat) => sum + stat.assignmentCount, 0),
    xmlFileCount: configurationStats.reduce((sum, stat) => sum + stat.xmlFileCount, 0),
    observationCount: configurationStats.reduce((sum, stat) => sum + stat.observationCount, 0),
    skippedObservationCount: configurationStats.reduce((sum, stat) => sum + stat.skippedObservationCount, 0),
    skippedItemTypes: [...skippedItemTypes]
      .sort(([left], [right]) => bytewiseCompare(left, right))
      .map(([itemType, count]) => ({ itemType, count })),
    rules: aggregate.finish(),
    canonicalOrders,
    unobservedSources,
    ambiguities: catalog.ambiguities(),
  }
}

async function createInputs(
  params: AnalyzeRuleOrderParams,
  dependencies: RuleOrderAnalyzerDependencies
): Promise<readonly RuleOrderInput[]> {
  const xmlRoot = resolve(params.xmlRoot)
  const discoveredConfigurationNames = await dependencies.listDirectories(xmlRoot)
  if (
    params.configuration !== undefined &&
    !discoveredConfigurationNames.includes(params.configuration)
  ) {
    throw new Error(`Не найдена конфигурация cf/${params.configuration}`)
  }
  const configurationNames =
    params.configuration === undefined ? discoveredConfigurationNames : [params.configuration]
  if (
    params.extensionBase !== undefined &&
    !configurationNames.includes(params.extensionBase)
  ) {
    throw new Error(`Не найдена базовая конфигурация cf/${params.extensionBase}`)
  }
  const configurations = configurationNames.map((name): RuleOrderInput => ({
    label: `cf/${name}`,
    xmlDir: join(xmlRoot, name),
    sourceKind: "configuration",
    expectedComponentKind: "configuration",
  }))
  if (params.extensionRoot === undefined || params.extensionBase === undefined) return configurations

  const extensionRoot = resolve(params.extensionRoot)
  const extensionNames = await dependencies.listDirectories(extensionRoot)
  return [
    ...configurations,
    ...extensionNames.map((name): RuleOrderInput => ({
      label: `cfe/${name}`,
      xmlDir: join(extensionRoot, name),
      sourceKind: "configurationExtension",
      expectedComponentKind: "configurationExtension",
      baseConfiguration: `cf/${params.extensionBase}`,
    })),
  ]
}

function validateExtensionParams(params: AnalyzeRuleOrderParams): void {
  if ((params.extensionRoot === undefined) !== (params.extensionBase === undefined)) {
    throw new Error("extensionRoot и extensionBase должны быть указаны вместе")
  }
}

function assertNoErrors(label: string, diagnostics: readonly {
  severity: string
  message: string
  sourcePath?: string
}[]): void {
  const failed = diagnostics.find((diagnostic) => diagnostic.severity === "error")
  if (failed === undefined) return
  throw new Error(
    `${label}: ${failed.message}${failed.sourcePath === undefined ? "" : ` (${failed.sourcePath})`}`
  )
}

function bytewiseCompare(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left), Buffer.from(right))
}
