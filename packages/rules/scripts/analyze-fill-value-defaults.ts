import { lstat, mkdir, readdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  createObservationAggregator,
  type CatalogReport,
} from "./fill-value-catalog/aggregate"
import { renderCatalogMarkdown } from "./fill-value-catalog/markdown"
import { createStandardAttributeEnricher } from "./fill-value-catalog/rulesEnrichment"
import {
  scanFillValuesInXml,
  type ScanFillValuesResult,
  type StandardAttributeEnricher,
} from "./fill-value-catalog/xmlScanner"

const jsonFileName = "fill-value-defaults.json"
const markdownFileName = "fill-value-defaults.md"

export interface AnalyzeFillValueOptions {
  readonly catalogRoot: string
  readonly outputDir: string
  readonly concurrency: number
  readonly examples: number
  readonly configurations: readonly string[]
}

export type ParsedAnalyzeFillValueArgs =
  | AnalyzeFillValueOptions
  | { readonly kind: "help" }

export interface CatalogReportFile extends CatalogReport {
  readonly parameters: {
    readonly configurations: readonly string[]
    readonly examples: number
  }
}

export interface AnalyzeFillValueResult {
  readonly jsonPath: string
  readonly markdownPath: string
  readonly report: CatalogReportFile
}

export function parseAnalyzeFillValueArgs(argv: readonly string[]): ParsedAnalyzeFillValueArgs {
  if (argv.includes("--help") || argv.includes("-h")) return { kind: "help" }

  let catalogRoot: string | undefined
  let outputDir: string | undefined
  let concurrency = 4
  let examples = 3
  const configurations: string[] = []

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === undefined) continue
    if (!argument.startsWith("-")) {
      if (catalogRoot !== undefined) throw new Error(`лишний позиционный аргумент: ${argument}`)
      catalogRoot = argument
      continue
    }
    const value = argv[index + 1]
    switch (argument) {
      case "--output":
        outputDir = requiredOptionValue(argument, value)
        index += 1
        break
      case "--concurrency":
        concurrency = positiveInteger(argument, requiredOptionValue(argument, value))
        index += 1
        break
      case "--examples":
        examples = positiveInteger(argument, requiredOptionValue(argument, value))
        index += 1
        break
      case "--configuration":
        configurations.push(requiredOptionValue(argument, value))
        index += 1
        break
      default:
        throw new Error(`неизвестный параметр: ${argument}`)
    }
  }

  if (catalogRoot === undefined) throw new Error("не указан каталог конфигураций")
  if (outputDir === undefined) throw new Error("не указан каталог отчёта (--output)")
  return {
    catalogRoot: path.resolve(catalogRoot),
    outputDir: path.resolve(outputDir),
    concurrency,
    examples,
    configurations,
  }
}

export async function analyzeFillValueCatalog(
  options: AnalyzeFillValueOptions,
): Promise<AnalyzeFillValueResult> {
  validateOptions(options)
  await assertOrdinaryDirectory(options.catalogRoot, "каталог конфигураций")
  const availableConfigurations = await configurationDirectories(options.catalogRoot)
  const selectedConfigurations = selectConfigurations(
    availableConfigurations,
    options.configurations,
  )
  const enrichStandard = createStandardAttributeEnricher()
  const aggregator = createObservationAggregator({ examplesLimit: options.examples })
  for (const configuration of selectedConfigurations) {
    const configurationRoot = path.join(options.catalogRoot, configuration)
    let batch: CatalogFile[] = []
    for await (const absolutePath of iterateXmlFiles(configurationRoot)) {
      batch.push({
        configuration,
        absolutePath,
        relativePath: posixPath(path.relative(configurationRoot, absolutePath)),
      })
      if (batch.length === options.concurrency) {
        for (const result of await scanBatch(batch, enrichStandard)) aggregator.add(result)
        batch = []
      }
    }
    for (const result of await scanBatch(batch, enrichStandard)) aggregator.add(result)
  }
  const aggregated = aggregator.report()
  const report: CatalogReportFile = {
    formatVersion: aggregated.formatVersion,
    parameters: {
      configurations: selectedConfigurations,
      examples: options.examples,
    },
    examplesLimit: aggregated.examplesLimit,
    counts: {
      ...aggregated.counts,
      configurations: selectedConfigurations.length,
    },
    values: aggregated.values,
    summary: aggregated.summary,
    unresolved: aggregated.unresolved,
  }

  await mkdir(options.outputDir, { recursive: true })
  const jsonPath = path.join(options.outputDir, jsonFileName)
  const markdownPath = path.join(options.outputDir, markdownFileName)
  await Promise.all([
    writeFile(jsonPath, `${JSON.stringify(report, undefined, 2)}\n`),
    writeFile(markdownPath, renderCatalogMarkdown(report)),
  ])
  return { jsonPath, markdownPath, report }
}

interface CatalogFile {
  readonly configuration: string
  readonly absolutePath: string
  readonly relativePath: string
}

async function configurationDirectories(catalogRoot: string): Promise<readonly string[]> {
  const entries = await readdir(catalogRoot, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.isSymbolicLink()) {
      throw new Error(`символические ссылки не поддерживаются: ${path.join(catalogRoot, entry.name)}`)
    }
  }
  return entries.filter((entry) => entry.isDirectory()).map(({ name }) => name).sort()
}

function selectConfigurations(
  available: readonly string[],
  requested: readonly string[],
): readonly string[] {
  if (requested.length === 0) return available
  const unique = [...new Set(requested)].sort()
  const availableSet = new Set(available)
  const missing = unique.filter((configuration) => !availableSet.has(configuration))
  if (missing.length > 0) {
    throw new Error(`не найдены конфигурации: ${missing.join(", ")}`)
  }
  return unique
}

async function* iterateXmlFiles(directory: string): AsyncGenerator<string> {
  const entries = await readdir(directory, { withFileTypes: true })
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const target = path.join(directory, entry.name)
    if (entry.isSymbolicLink()) throw new Error(`символические ссылки не поддерживаются: ${target}`)
    if (entry.isDirectory()) {
      yield* iterateXmlFiles(target)
    } else if (
      entry.isFile() &&
      path.extname(entry.name).toLowerCase() === ".xml" &&
      entry.name.toLowerCase() !== "configdumpinfo.xml"
    ) {
      yield target
    }
  }
}

async function scanBatch(
  files: readonly CatalogFile[],
  enrichStandard: StandardAttributeEnricher,
): Promise<readonly ScanFillValuesResult[]> {
  return Promise.all(files.map((file) => scanCatalogFile(file, enrichStandard)))
}

async function scanCatalogFile(
  file: CatalogFile,
  enrichStandard: StandardAttributeEnricher,
): Promise<ScanFillValuesResult> {
  let xml: string
  try {
    xml = await readFile(file.absolutePath, "utf8")
  } catch (error) {
    throw fileError(file, "не удалось прочитать XML", error)
  }
  if (!containsCandidateElement(xml)) return { observations: [], unresolved: [] }
  try {
    return scanFillValuesInXml({
      configuration: file.configuration,
      file: file.relativePath,
      xml,
      enrichStandard,
    })
  } catch (error) {
    throw fileError(file, "не удалось разобрать XML", error)
  }
}

const candidateElements = [
  "<CommonAttribute",
  "<Attribute",
  "<Dimension",
  "<Resource",
  "<AddressingAttribute",
  "<Field",
  "<AccountingFlag",
  "<ExtDimensionAccountingFlag",
  "<xr:StandardAttribute",
] as const

function containsCandidateElement(xml: string): boolean {
  if (xml.includes("<FillValue") || xml.includes("<xr:FillValue")) return true
  return xml.includes("<MetaDataObject") &&
    candidateElements.some((element) => xml.includes(element))
}

function posixPath(value: string): string {
  return value.split(path.sep).join("/")
}

async function assertOrdinaryDirectory(target: string, label: string): Promise<void> {
  let stats
  try {
    stats = await lstat(target)
  } catch (error) {
    throw new Error(`${label} не найден: ${target}`, { cause: error })
  }
  if (stats.isSymbolicLink()) throw new Error(`${label} не должен быть символической ссылкой: ${target}`)
  if (!stats.isDirectory()) throw new Error(`${label} не является каталогом: ${target}`)
}

function validateOptions(options: AnalyzeFillValueOptions): void {
  if (!Number.isInteger(options.concurrency) || options.concurrency < 1) {
    throw new Error("--concurrency должен быть положительным целым числом")
  }
  if (!Number.isInteger(options.examples) || options.examples < 1) {
    throw new Error("--examples должен быть положительным целым числом")
  }
}

function requiredOptionValue(option: string, value: string | undefined): string {
  if (value === undefined || value.startsWith("-")) throw new Error(`для ${option} не указано значение`)
  return value
}

function positiveInteger(option: string, value: string): number {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${option} должен быть положительным целым числом`)
  }
  return parsed
}

function fileError(file: CatalogFile, message: string, error: unknown): Error {
  return new Error(`${message}: ${file.configuration}/${file.relativePath}: ${errorMessage(error)}`, {
    cause: error,
  })
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function usage(): string {
  return [
    "Использование:",
    "  analyze-fill-value-defaults <каталог-баз> --output <каталог-отчёта> [параметры]",
    "",
    "Параметры:",
    "  --configuration <имя>  анализировать только указанную базу (можно повторять)",
    "  --concurrency <число>   число одновременно читаемых XML, по умолчанию 4",
    "  --examples <число>      число примеров в каждой группе, по умолчанию 3",
    "  -h, --help              показать эту справку",
  ].join("\n")
}

async function main(): Promise<void> {
  try {
    const parsed = parseAnalyzeFillValueArgs(process.argv.slice(2))
    if ("kind" in parsed) {
      process.stdout.write(`${usage()}\n`)
      return
    }
    const result = await analyzeFillValueCatalog(parsed)
    process.stdout.write(`${result.jsonPath}\n${result.markdownPath}\n`)
  } catch (error) {
    process.stderr.write(`${errorMessage(error)}\n\n${usage()}\n`)
    process.exitCode = 1
  }
}

if (process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main()
}
