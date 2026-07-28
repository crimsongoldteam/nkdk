import { readdir } from "node:fs/promises"
import { availableParallelism, tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { registerCoreMetadata } from "../register"
import { compileRegisteredMetadataResourceTopology } from "../resourceTopology/registry"
import { discoverXmlImport } from "../importFromXml/discovery"
import { createXmlImportWorkerPoolHandle } from "../importFromXml/workerPool"
import { createRuleOrderAggregate, type RuleOrderRuleReport } from "./aggregate"
import type { RuleOrderObservation } from "./types"

export interface AnalyzeRuleOrderParams {
  xmlRoot: string
  metadataDir: string
  concurrency?: number
  witnessLimit?: number
  onObservation?(observation: RuleOrderObservation): void | Promise<void>
}

export interface RuleOrderConfigurationStat {
  configuration: string
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
  ambiguities: readonly { candidate: string; reason: string }[]
}

export async function analyzeRuleOrder(params: AnalyzeRuleOrderParams): Promise<AnalyzeRuleOrderResult> {
  registerCoreMetadata()
  const xmlRoot = resolve(params.xmlRoot)
  const configurations = (await readdir(xmlRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort(bytewiseCompare)
  const aggregate = createRuleOrderAggregate({ witnessLimit: params.witnessLimit })
  const skippedItemTypes = new Map<string, number>()
  const configurationStats: RuleOrderConfigurationStat[] = []
  const handle = createXmlImportWorkerPoolHandle({
    concurrency: params.concurrency ?? Math.max(1, availableParallelism() - 1),
  })

  try {
    for (const configuration of configurations) {
      const discovered = await discoverXmlImport({
        xmlDir: join(xmlRoot, configuration),
        topology: compileRegisteredMetadataResourceTopology(),
      })
      const pool = handle.createOperationPool()
      let observationCount = 0
      let skippedObservationCount = 0
      try {
        await pool.initialize({
          operationId: `rule-order-${configuration}`,
          context: {
            defaultLanguage: "ru",
            version: "2.20",
            exportToYAML: { toTyped: false },
            fromXML: { forReference: false },
          },
          outputDir: join(tmpdir(), "nkdk-rule-order-analysis-unused"),
          componentKind: "configuration",
        })
        const analyzed = await pool.analyzeRuleOrder({
          configuration,
          metadataDir: params.metadataDir,
          assignments: discovered.assignments,
        })
        const failed = analyzed.diagnostics.find((diagnostic) => diagnostic.severity === "error")
        if (failed !== undefined) {
          throw new Error(
            `${configuration}: ${failed.message}${failed.sourcePath === undefined ? "" : ` (${failed.sourcePath})`}`
          )
        }
        skippedObservationCount += analyzed.unmatchedObservationCount
        for (const observation of analyzed.observations) {
          observationCount += 1
          await params.onObservation?.(observation)
          aggregate.accept(observation)
        }
      } finally {
        await pool.close()
      }
      configurationStats.push({
        configuration,
        assignmentCount: discovered.assignments.length,
        xmlFileCount: discovered.assignments.reduce((sum, assignment) => sum + assignment.xmlFiles.length, 0),
        observationCount,
        skippedObservationCount,
      })
    }
  } finally {
    await handle.close()
  }

  return {
    configurations,
    configurationStats,
    assignmentCount: configurationStats.reduce((sum, stat) => sum + stat.assignmentCount, 0),
    xmlFileCount: configurationStats.reduce((sum, stat) => sum + stat.xmlFileCount, 0),
    observationCount: configurationStats.reduce((sum, stat) => sum + stat.observationCount, 0),
    skippedObservationCount: configurationStats.reduce((sum, stat) => sum + stat.skippedObservationCount, 0),
    skippedItemTypes: [...skippedItemTypes]
      .sort(([left], [right]) => bytewiseCompare(left, right))
      .map(([itemType, count]) => ({ itemType, count })),
    rules: aggregate.finish(),
    ambiguities: [],
  }
}

function bytewiseCompare(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left), Buffer.from(right))
}
