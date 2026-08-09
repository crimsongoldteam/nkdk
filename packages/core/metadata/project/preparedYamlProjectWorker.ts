import { relative, resolve } from "node:path"
import { readFile } from "node:fs/promises"
import { performance } from "node:perf_hooks"
import { move, transferableSymbol, valueSymbol } from "piscina"
import { hashFileBytes } from "../configurationIndex/hash"
import { parseMetadataYaml } from "../../yaml/parseMetadataYaml"
import {
  createProjectStateFileUpdateBatch,
  toProjectStateFileUpdate,
  type ProjectStateFileIdentity,
  type ProjectStateFileUpdateBatch,
  type ProjectStateFileUpdateBatchEntry,
} from "../projectState/fileUpdate"
import {
  encodeProjectStateFileUpdateBatch,
  type ProjectStateEncodedFileUpdateBatch,
} from "../projectState/binary/contribution"
import {
  createProjectStateFragmentWriter,
} from "../projectState/binary/fragment"
import type { ConfigurationContext } from "../context/types"
import { createValidationProfiler } from "../validation/profile"
import { resolveValidationProjectFile } from "../validation/projectFiles"
import {
  bindValidationProjectComponent,
  createValidationProjectComponent,
  type ValidationProjectComponent,
  validationProjectComponentFromAddress,
} from "../validation/projectComponents"
import { createProjectYamlCacheFromEntries } from "../validation/projectYamlCache"
import {
  extractProjectValidationFileFacts,
  validateProjectFileFirstPass,
  readProjectYamlDiagnostic,
  readProjectYamlEntryForValidation,
  type ProjectValidationFirstPassProfile,
  type ValidationSchemaCache,
  type ValidationSchemaCacheCompileProfile,
} from "../validation/projectValidationPasses"
import { createProjectValidationWorkerSchemaCache } from "../validation/projectValidationWorkerSchemaCache"
import { registerValidationMetadata } from "../validation/registerValidationMetadata"
import type { ValidationRulesSnapshot } from "../validation/rulesSnapshot"
import type { Diagnostic } from "../validation/types"
import type {
  ComponentFirstPassPoolResult,
  ValidationFirstPassFileResult,
  ValidationYamlLifetime,
} from "../validation/validationWorkerPoolTypes"
import type { ValidationGraphContribution, ValidationIndexContribution } from "../validation/projectValidationTypes"
import { prepareYamlFiles } from "./prepareYamlFiles"
import type {
  PreparedMetadataDeclaration,
  PreparedMetadataDependency,
  PreparedYamlFile,
  PreparedYamlProjectFileDescriptor,
} from "./preparedYamlContracts"
import { toPreparedYamlProjectFileDescriptor } from "./preparedYamlDescriptor"
import { classifyMetadataProjectPath } from "./resources"
import type { ProjectStateValidationFileTask } from "../projectState/projectFiles"
import {
  createMovableBinaryResult,
  type MetadataWorkerBinaryResult,
} from "../workerPool/binaryResult"
import { createProjectStateRefreshBinaryResult } from "./projectStateRefreshBinaryResult"

export const LOCAL_VALIDATION_BATCH_SIZE = 32

registerValidationMetadata()

export type PreparedYamlProjectWorkerTask =
  | {
      kind: "prepare"
      workerIndex: number
      projectDir: string
      itemTypeByYamlDir: Record<string, string>
      files: PreparedYamlProjectFileDescriptor[]
      includeYamlData: boolean
    }
  | {
      kind: "initValidation"
      workerIndex: number
      context: ConfigurationContext
      rulesSnapshot: ValidationRulesSnapshot
    }
  | {
      kind: "validateFirstPass"
      workerIndex: number
      projectDir: string
      context: ConfigurationContext
      files: PreparedYamlProjectFileDescriptor[]
    }
  | {
      kind: "refreshProjectState"
      workerIndex: number
      projectDir: string
      context: ConfigurationContext
      files: readonly ProjectStateValidationFileTask[]
      knownHashBits: Uint8Array
      expectedHashBytes: Uint8Array
    }
  | {
      kind: "collectValidationFacts"
      workerIndex: number
      projectDir: string
      files: PreparedYamlProjectFileDescriptor[]
      rulesSnapshot: ValidationRulesSnapshot
    }

export type PreparedYamlProjectWorkerTaskResult =
  | {
      kind: "prepareResult"
      yamlFiles: PreparedYamlFile[]
      declarations: PreparedMetadataDeclaration[]
      dependencies: PreparedMetadataDependency[]
      diagnostics: Diagnostic[]
    }
  | ({ kind: "initValidationResult" } & ValidationSchemaCacheCompileProfile)
  | {
      kind: "validateFirstPassResult"
      components: ComponentFirstPassPoolResult[]
      diagnostics: Diagnostic[]
      schemaDiagnostics: Diagnostic[]
      fileResults: ValidationFirstPassFileResult[]
      fileUpdateBatches: readonly ProjectStateEncodedFileUpdateBatch[]
      yamlLifetime: ValidationYamlLifetime
    }
  | MetadataWorkerBinaryResult
  | {
      kind: "collectValidationFactsResult"
      contribution: ValidationIndexContribution
    }

export async function runPreparedYamlProjectWorkerTask(
  message: PreparedYamlProjectWorkerTask,
  options: {
    createValidationSchemaCache?: typeof createProjectValidationWorkerSchemaCache
    readFile?: (absolutePath: string) => Promise<Uint8Array>
    hashBytes?: (bytes: Uint8Array) => bigint
    classifyProjectStateFile?: typeof classifyChangedProjectStateFile
    persistentValidationState?: {
      readonly schemaCache: ValidationSchemaCache
      readonly rulesSnapshot: ValidationRulesSnapshot
    }
  } = {},
): Promise<PreparedYamlProjectWorkerTaskResult> {
  if (message.kind === "initValidation") {
    const profiler = createValidationProfiler({ scope: "worker", workerIndex: message.workerIndex })
    validationSchemaCache = options.persistentValidationState?.schemaCache ?? await profiler.measureAsync(
      "Инициализация",
      "Инициализация validation worker",
      { items: 1 },
      () => (options.createValidationSchemaCache ?? createProjectValidationWorkerSchemaCache)({
        context: message.context,
      })
    )
    validationRulesSnapshot = options.persistentValidationState?.rulesSnapshot ?? message.rulesSnapshot
    projectStateComponentTemplates = {
      configuration: createValidationProjectComponent("/", { kind: "configuration" }),
      configurationExtension: createValidationProjectComponent("/", {
        kind: "configurationExtension",
        name: "Шаблон",
      }),
    }
    const compileProfile = { formMs: 0, propertiesMs: 0, totalMs: 0 }
    profiler.flush()
    return { kind: "initValidationResult", ...compileProfile }
  }
  if (message.kind === "validateFirstPass") {
    const result = runValidationFirstPass({
      workerIndex: message.workerIndex,
      projectDir: message.projectDir,
      context: message.context,
      files: message.files.map((descriptor) => ({ descriptor })),
    })
    return {
      kind: "validateFirstPassResult",
      ...result,
      fileUpdateBatches: result.fileUpdateBatches.map(encodeProjectStateFileUpdateBatch),
    }
  }
  if (message.kind === "refreshProjectState") return refreshProjectStateFiles(message, options)
  if (message.kind === "collectValidationFacts") {
    return {
      kind: "collectValidationFactsResult",
      contribution: await collectValidationFacts(message),
    }
  }
  const profiler = createValidationProfiler({ scope: "worker", workerIndex: message.workerIndex })
  const prepareStartedAt = performance.now()
  const { yamlFiles, declarations, dependencies, diagnostics, profile } = prepareYamlFiles({
    files: message.files,
    itemTypeByYamlDir: message.itemTypeByYamlDir,
  })

  const responseYamlFiles = message.includeYamlData ? yamlFiles : yamlFiles.map(withoutYamlData)
  const response = {
    kind: "prepareResult" as const,
    yamlFiles: responseYamlFiles,
    declarations,
    dependencies,
    diagnostics,
  }
  const prepareMs = performance.now() - prepareStartedAt
  profiler.record("Подготовка YAML-проекта", "Выполнение подготовки в worker", {
    items: message.files.length,
    timeMs: prepareMs,
  })
  profiler.record("Подготовка YAML-проекта", "Чтение YAML", { items: message.files.length, timeMs: profile.readMs })
  profiler.record("Подготовка YAML-проекта", "Разбор YAML", { items: message.files.length, timeMs: profile.parseMs })
  profiler.record("Подготовка YAML-проекта", "Извлечение локальных индексов", { items: message.files.length, timeMs: profile.indexMs })
  profiler.record("Подготовка YAML-проекта", "Сохранение worker данных YAML", { items: message.files.length, timeMs: profile.saveMs })
  profiler.record("Подготовка YAML-проекта", "Объём результата worker", {
    items: responseYamlFiles.length,
    timeMs: 0,
    bytes: estimateProfilePayloadBytes(response),
  })
  profiler.flush()
  return response
}

async function refreshProjectStateFiles(
  message: Extract<PreparedYamlProjectWorkerTask, { kind: "refreshProjectState" }>,
  dependencies: {
    readFile?: (absolutePath: string) => Promise<Uint8Array>
    hashBytes?: (bytes: Uint8Array) => bigint
    classifyProjectStateFile?: typeof classifyChangedProjectStateFile
  },
): Promise<MetadataWorkerBinaryResult> {
  const profileEnabled = process.env["NKDK_PROFILE"] === "1"
  const profiler = profileEnabled
    ? createValidationProfiler({ scope: "worker", workerIndex: message.workerIndex })
    : undefined
  let readMs = 0
  let hashMs = 0
  let compareMs = 0
  const expectedBitLength = Math.ceil(message.files.length / 8)
  if (message.knownHashBits.byteLength !== expectedBitLength) {
    throw new Error(`knownHashBits должен занимать ${expectedBitLength} байт`)
  }
  if (message.expectedHashBytes.byteLength !== message.files.length * 8) {
    throw new Error(`expectedHashBytes должен занимать ${message.files.length * 8} байт`)
  }
  const read = dependencies.readFile ?? (async (absolutePath) => new Uint8Array(await readFile(absolutePath)))
  const hash = dependencies.hashBytes ?? hashFileBytes
  const writer = createProjectStateFragmentWriter()
  let yamlValidation: ValidationFirstPassAccumulator | undefined
  let hashedFiles = 0
  let parsedYamlFiles = 0
  let changedFiles = 0
  const missingProjectPaths: string[] = []
  try {
    for (let index = 0; index < message.files.length; index += 1) {
      const file = message.files[index]!
      let bytes: Uint8Array | undefined
      try {
        let startedAt = profileEnabled ? performance.now() : 0
        bytes = await read(file.absolutePath)
        if (profileEnabled) readMs += performance.now() - startedAt
        hashedFiles += 1
        if (profileEnabled) startedAt = performance.now()
        const currentHash = hash(bytes)
        if (profileEnabled) {
          hashMs += performance.now() - startedAt
          startedAt = performance.now()
        }
        const unchanged = hasKnownHash(message.knownHashBits, index)
          && currentHash === readExpectedHash(message.expectedHashBytes, index)
        if (profileEnabled) compareMs += performance.now() - startedAt
        if (unchanged) continue
        const classified = file.identity === undefined
          ? (dependencies.classifyProjectStateFile ?? classifyChangedProjectStateFile)(file, message.projectDir)
          : { identity: file.identity, descriptor: file.descriptor }
        if (classified.identity.resourceKind === "yaml") {
          if (classified.descriptor === undefined) {
            throw new Error(`У YAML отсутствует descriptor: ${classified.identity.projectPath}`)
          }
          yamlValidation ??= createValidationFirstPassAccumulator(message.workerIndex)
          const parsed = processValidationFirstPassFile(yamlValidation, {
            projectDir: message.projectDir,
            context: message.context,
            descriptor: classified.descriptor,
            bytes,
            hash: currentHash,
          })
          if (parsed) parsedYamlFiles += 1
          changedFiles += 1
          continue
        }
        writer.appendFile({ ...classified.identity, kind: "resource" }, currentHash)
        changedFiles += 1
      } catch (caught) {
        if (!isMissingFile(caught)) throw caught
        missingProjectPaths.push(file.projectPath)
      } finally {
        bytes = undefined
      }
    }

    const yamlResult = yamlValidation === undefined ? undefined : finishValidationFirstPass(yamlValidation)
    const logicalBatches = [
      ...(yamlResult === undefined || yamlResult.fileUpdateBatches[0]?.updates.length === 0
        ? []
        : yamlResult.fileUpdateBatches),
    ]
    const encodeStartedAt = profileEnabled ? performance.now() : 0
    for (const batch of logicalBatches) {
      const hashes = new DataView(batch.hashBytes.buffer, batch.hashBytes.byteOffset, batch.hashBytes.byteLength)
      batch.updates.forEach((update, index) => writer.appendFile(update, hashes.getBigUint64(index * 8, false)))
    }
    const fragment = writer.finish()
    const result = createProjectStateRefreshBinaryResult({
      fragment,
      missingProjectPaths,
      hashedFiles,
      parsedYamlFiles,
      changedFiles,
    })
    const encodeMs = profileEnabled ? performance.now() - encodeStartedAt : 0
    profiler?.record("Обработка файлов Б1–Б4", "Чтение файлов", {
      items: message.files.length,
      timeMs: readMs,
    })
    profiler?.record("Обработка файлов Б1–Б4", "Вычисление хэшей", {
      items: hashedFiles,
      timeMs: hashMs,
    })
    profiler?.record("Обработка файлов Б1–Б4", "Сравнение хэшей", {
      items: hashedFiles,
      timeMs: compareMs,
    })
    profiler?.record("Обработка файлов Б1–Б4", "Двоичное кодирование результата", {
      items: changedFiles,
      bytes: result.buffers.reduce((sum, { buffer }) => sum + buffer.byteLength, 0),
      timeMs: encodeMs,
    })
    profiler?.flush()
    return result
  } catch (caught) {
    writer.discard()
    throw caught
  }
}

export function classifyChangedProjectStateFile(
  task: ProjectStateValidationFileTask,
  projectDir: string,
): { identity: ProjectStateFileIdentity; descriptor?: PreparedYamlProjectFileDescriptor } {
  const template = task.componentPath === "cf"
    ? requireProjectStateComponentTemplates().configuration
    : requireProjectStateComponentTemplates().configurationExtension
  const component = bindValidationProjectComponent(template, projectDir, task.componentPath)
  const componentProjectPath = relative(component.componentDir, task.absolutePath).replace(/\\/g, "/")
  const resource = classifyMetadataProjectPath(componentProjectPath, component)
  if (resource === undefined) throw new Error(`Сохранённый путь больше не принадлежит проекту: ${task.projectPath}`)
  const identity: ProjectStateFileIdentity = {
    projectPath: task.projectPath,
    componentPath: task.componentPath,
    resourceKind: resource.kind,
    ...(resource.kind === "yaml" ? { yamlRole: resource.role } : {}),
  }
  return {
    identity,
    ...(resource.kind === "yaml"
      ? { descriptor: toPreparedYamlProjectFileDescriptor({ ...resource, absolutePath: task.absolutePath }, component) }
      : {}),
  }
}

function hasKnownHash(bits: Uint8Array, index: number): boolean {
  return (bits[Math.floor(index / 8)]! & (1 << (index % 8))) !== 0
}

function readExpectedHash(hashBytes: Uint8Array, index: number): bigint {
  return new DataView(hashBytes.buffer, hashBytes.byteOffset, hashBytes.byteLength).getBigUint64(index * 8, false)
}

function isMissingFile(caught: unknown): boolean {
  return typeof caught === "object" && caught !== null && "code" in caught && caught.code === "ENOENT"
}

export default async function preparedYamlProjectWorkerEntryPoint(
  message: PreparedYamlProjectWorkerTask
): Promise<PreparedYamlProjectWorkerTaskResult> {
  const result = await runPreparedYamlProjectWorkerTask(message)
  if (result.kind === "binaryResult") return createMovableBinaryResult(result)
  return result.kind === "validateFirstPassResult" ? movableValidationResult(result) : result
}

type TransferableValidationWorkerResult = Extract<
  PreparedYamlProjectWorkerTaskResult,
  { kind: "validateFirstPassResult" }
>

export function createValidationFirstPassTransferable(result: TransferableValidationWorkerResult) {
  return {
    get [transferableSymbol]() {
      return result.fileUpdateBatches.map(({ bytes }) => bytes.buffer)
    },
    get [valueSymbol]() {
      return result
    },
  }
}

function movableValidationResult(result: TransferableValidationWorkerResult): TransferableValidationWorkerResult {
  return move(createValidationFirstPassTransferable(result)) as unknown as TransferableValidationWorkerResult
}

interface CollectValidationFactsDependencies {
  readEntry?: typeof readProjectYamlEntryForValidation
  extractFacts?: typeof extractProjectValidationFileFacts
}

export async function collectValidationFacts(
  message: Extract<PreparedYamlProjectWorkerTask, { kind: "collectValidationFacts" }>,
  dependencies: CollectValidationFactsDependencies = {}
): Promise<ValidationIndexContribution> {
  const readEntry = dependencies.readEntry ?? readProjectYamlEntryForValidation
  const extractFacts = dependencies.extractFacts ?? extractProjectValidationFileFacts
  const contribution = emptyValidationIndexContribution()

  for (const descriptor of message.files) {
    const file = resolveValidationProjectFile(message.projectDir, descriptor.filePath)
    if (file === undefined) {
      throw new Error(`Не удалось классифицировать YAML-файл компонента: ${descriptor.filePath}`)
    }

    const entry = readEntry(file.absolutePath)
    if ("error" in entry) {
      throw new Error(`Не удалось прочитать YAML-файл ${file.absolutePath}: ${entry.error.message}`, {
        cause: entry.error,
      })
    }
    if (entry.parsed.syntaxErrors.length > 0) {
      const first = entry.parsed.syntaxErrors[0]
      const location = first === undefined ? "" : `:${first.line}:${first.col}`
      const details = first?.message ?? "неизвестная синтаксическая ошибка"
      throw new Error(`Не удалось разобрать YAML-файл ${file.absolutePath}${location}: ${details}`)
    }

    const facts = extractFacts({
      projectDir: message.projectDir,
      file,
      entry,
      rulesSnapshot: message.rulesSnapshot,
      validationDiagnostics: false,
    })
    contribution.objectRecords.push(...facts.objectRecords)
    contribution.objectIndexEntries.push(...facts.objectIndexEntries)
    contribution.memberIndexEntries.push(...facts.memberIndexEntries)
    contribution.valueIndexEntries.push(...facts.valueIndexEntries)
    contribution.pendingReferences.push(...facts.pendingReferences)
    contribution.localDependencies.push(...facts.localDependencies)
    contribution.logicalAddresses.push(
      ...[
        ...facts.objectIndexEntries,
        ...facts.memberIndexEntries,
        ...facts.valueIndexEntries,
      ].map(({ canonical }) => ({
        logicalAddress: canonical,
        sourceProjectPath: descriptor.projectPath,
      }))
    )
  }

  return contribution
}

function emptyValidationIndexContribution(): ValidationIndexContribution {
  return {
    objectRecords: [],
    objectIndexEntries: [],
    memberIndexEntries: [],
    valueIndexEntries: [],
    pendingReferences: [],
    localDependencies: [],
    logicalAddresses: [],
  }
}

function withoutYamlData(file: PreparedYamlFile): PreparedYamlFile {
  const { data: _data, ...rest } = file
  return rest
}

function estimateProfilePayloadBytes(value: unknown): number | undefined {
  if (process.env["NKDK_PROFILE"] !== "1") return undefined
  return Buffer.byteLength(JSON.stringify(value, (_key, item) => (typeof item === "bigint" ? item.toString() : item)), "utf8")
}

let validationSchemaCache: ValidationSchemaCache | undefined
let validationRulesSnapshot: ValidationRulesSnapshot | undefined
let projectStateComponentTemplates: {
  readonly configuration: ValidationProjectComponent
  readonly configurationExtension: ValidationProjectComponent
} | undefined
const validationYamlLifetimeForTests = { current: 0, max: 0, parsed: 0, propertyEvents: 0 }

export function resetValidationYamlLifetimeForTests(): void {
  validationYamlLifetimeForTests.current = 0
  validationYamlLifetimeForTests.max = 0
  validationYamlLifetimeForTests.parsed = 0
  validationYamlLifetimeForTests.propertyEvents = 0
}

export function getValidationYamlLifetimeForTests(): Readonly<typeof validationYamlLifetimeForTests> {
  return { ...validationYamlLifetimeForTests }
}

function requireProjectStateComponentTemplates() {
  if (projectStateComponentTemplates === undefined) {
    throw new Error("Prepared YAML worker не инициализирован для классификации project state")
  }
  return projectStateComponentTemplates
}

interface ValidationFirstPassInput {
  readonly workerIndex: number
  readonly projectDir: string
  readonly context: ConfigurationContext
  readonly files: ReadonlyArray<{
    readonly descriptor: PreparedYamlProjectFileDescriptor
    readonly bytes?: Uint8Array
    readonly hash?: bigint
  }>
}

interface ValidationFirstPassResult {
  components: ComponentFirstPassPoolResult[]
  diagnostics: Diagnostic[]
  schemaDiagnostics: Diagnostic[]
  fileResults: ValidationFirstPassFileResult[]
  fileUpdateBatches: readonly ProjectStateFileUpdateBatch[]
  yamlLifetime: ValidationYamlLifetime
}

interface ValidationFirstPassAccumulator {
  readonly profiler: ReturnType<typeof createValidationProfiler>
  readonly components: Map<string, ComponentFirstPassPoolResult>
  readonly schemaCache: ValidationSchemaCache
  readonly firstPassProfile: Omit<ProjectValidationFirstPassProfile, "key">
  readonly fileUpdateEntries: ProjectStateFileUpdateBatchEntry[]
  readonly detailedProfile: {
    enabled: boolean
    parseMs: number
    validationMs: number
    collectMs: number
  }
  processedFiles: number
}

function runValidationFirstPass(message: ValidationFirstPassInput): ValidationFirstPassResult {
  const accumulator = createValidationFirstPassAccumulator(message.workerIndex)
  for (const file of message.files) {
    processValidationFirstPassFile(accumulator, {
      projectDir: message.projectDir,
      context: message.context,
      ...file,
    })
  }
  return finishValidationFirstPass(accumulator)
}

function createValidationFirstPassAccumulator(workerIndex: number): ValidationFirstPassAccumulator {
  resetValidationYamlLifetimeForTests()
  return {
    profiler: createValidationProfiler({ scope: "worker", workerIndex }),
    components: new Map(),
    schemaCache: requireValidationSchemaCache(),
    firstPassProfile: createEmptyFirstPassProfileSummary(),
    fileUpdateEntries: [],
    detailedProfile: {
      enabled: process.env["NKDK_PROFILE"] === "1",
      parseMs: 0,
      validationMs: 0,
      collectMs: 0,
    },
    processedFiles: 0,
  }
}

function processValidationFirstPassFile(
  accumulator: ValidationFirstPassAccumulator,
  input: {
    readonly projectDir: string
    readonly context: ConfigurationContext
    readonly descriptor: PreparedYamlProjectFileDescriptor
    readonly bytes?: Uint8Array
    readonly hash?: bigint
  },
): boolean {
  accumulator.processedFiles += 1
  const { descriptor } = input
  const component = componentFirstPassResult(accumulator.components, descriptor.componentPath)
  const projectComponent = validationProjectComponentFromAddress(input.projectDir, descriptor)
  const file = resolveValidationProjectFile(descriptor.componentDir, descriptor.filePath, projectComponent)
  if (file === undefined) {
    const filePath = resolve(descriptor.filePath)
    component.diagnostics.push({
      filePath,
      line: 1,
      col: 1,
      severity: "error",
      source: "structure",
      message: `Не удалось классифицировать YAML-файл компонента: ${descriptor.rootProjectPath}`,
    })
    component.fileResults.push({
      componentPath: descriptor.componentPath,
      filePath,
      rootProjectPath: descriptor.rootProjectPath,
      contributedFacts: false,
      schemaDiagnostics: [],
    })
    return false
  }
  let startedAt = accumulator.detailedProfile.enabled ? performance.now() : 0
  const entry = input.bytes === undefined
    ? readProjectYamlEntryForValidation(file.absolutePath)
    : projectYamlEntryFromBytes(file.absolutePath, input.bytes)
  if (accumulator.detailedProfile.enabled) {
    accumulator.detailedProfile.parseMs += performance.now() - startedAt
  }
  if ("error" in entry) {
    const diagnostic = readProjectYamlDiagnostic(entry)
    component.diagnostics.push(diagnostic)
    component.fileResults.push({
      componentPath: descriptor.componentPath,
      filePath: file.absolutePath,
      rootProjectPath: descriptor.rootProjectPath,
      contributedFacts: false,
      schemaDiagnostics: [],
    })
    return false
  }

  validationYamlLifetimeForTests.current += 1
  validationYamlLifetimeForTests.parsed += 1
  validationYamlLifetimeForTests.max = Math.max(
    validationYamlLifetimeForTests.max,
    validationYamlLifetimeForTests.current,
  )
  let first
  try {
    if (accumulator.detailedProfile.enabled) startedAt = performance.now()
    first = validateProjectFileFirstPass({
      projectDir: descriptor.componentDir,
      file,
      cache: createProjectYamlCacheFromEntries([entry]),
      context: input.context,
      schemaCache: accumulator.schemaCache,
      rulesSnapshot: requireValidationRulesSnapshot(),
    })
    if (accumulator.detailedProfile.enabled) {
      accumulator.detailedProfile.validationMs += performance.now() - startedAt
    }
  } finally {
    validationYamlLifetimeForTests.current -= 1
  }

  if (accumulator.detailedProfile.enabled) startedAt = performance.now()
  if (first.profile !== undefined) addFirstPassProfile(accumulator.firstPassProfile, first.profile)
  validationYamlLifetimeForTests.propertyEvents += first.profile?.propertyEvents ?? 0
  component.contribution.objectRecords.push(...first.objectRecords)
  component.contribution.objectIndexEntries?.push(...first.objectIndexEntries)
  component.contribution.memberIndexEntries?.push(...first.memberIndexEntries)
  component.contribution.valueIndexEntries?.push(...first.valueIndexEntries)
  component.contribution.pendingReferences?.push(...first.pendingReferences)
  component.diagnostics.push(...first.diagnostics)
  component.schemaDiagnostics.push(...first.schemaDiagnostics)
  component.fileResults.push({
    componentPath: descriptor.componentPath,
    filePath: file.absolutePath,
    rootProjectPath: descriptor.rootProjectPath,
    contributedFacts: first.contributedFacts,
    schemaDiagnostics: first.schemaDiagnostics,
  })
  accumulator.fileUpdateEntries.push({
    update: toProjectStateFileUpdate(first, {
      projectPath: descriptor.rootProjectPath,
      componentPath: descriptor.componentPath,
      resourceKind: "yaml",
      yamlRole: descriptor.role,
    }),
    hash: input.hash ?? hashFileBytes(Buffer.from(entry.text, "utf8")),
  })
  if (accumulator.detailedProfile.enabled) {
    accumulator.detailedProfile.collectMs += performance.now() - startedAt
  }
  return true
}

function finishValidationFirstPass(accumulator: ValidationFirstPassAccumulator): ValidationFirstPassResult {
  recordFirstPassProfile(
    accumulator.profiler,
    accumulator.processedFiles,
    accumulator.firstPassProfile,
  )
  if (accumulator.detailedProfile.enabled) {
    accumulator.profiler.record("Обработка файлов Б1–Б4", "Разбор YAML", {
      items: accumulator.processedFiles,
      timeMs: accumulator.detailedProfile.parseMs,
    })
    accumulator.profiler.record("Обработка файлов Б1–Б4", "Локальная проверка YAML", {
      items: accumulator.processedFiles,
      timeMs: accumulator.detailedProfile.validationMs,
    })
    accumulator.profiler.record("Обработка файлов Б1–Б4", "Сбор сведений файла", {
      items: accumulator.processedFiles,
      timeMs: accumulator.detailedProfile.collectMs,
    })
  }
  accumulator.profiler.flush()

  const componentResults = [...accumulator.components.values()].sort((left, right) =>
    left.componentPath.localeCompare(right.componentPath, "ru")
  )
  return {
    components: componentResults,
    diagnostics: componentResults.flatMap(({ diagnostics }) => diagnostics),
    schemaDiagnostics: componentResults.flatMap(({ schemaDiagnostics }) => schemaDiagnostics),
    fileResults: componentResults.flatMap(({ fileResults }) => fileResults),
    fileUpdateBatches: [createProjectStateFileUpdateBatch(accumulator.fileUpdateEntries)],
    yamlLifetime: getValidationYamlLifetimeForTests(),
  }
}

function projectYamlEntryFromBytes(filePath: string, bytes: Uint8Array) {
  const text = new TextDecoder().decode(bytes)
  return { filePath, text, parsed: parseMetadataYaml(text) }
}

function componentFirstPassResult(
  components: Map<string, ComponentFirstPassPoolResult>,
  componentPath: string
): ComponentFirstPassPoolResult {
  const existing = components.get(componentPath)
  if (existing !== undefined) return existing

  const created: ComponentFirstPassPoolResult = {
    componentPath,
    contribution: emptyValidationGraphContribution(),
    diagnostics: [],
    schemaDiagnostics: [],
    fileResults: [],
  }
  components.set(componentPath, created)
  return created
}

function emptyValidationGraphContribution(): ValidationGraphContribution {
  return {
    objectRecords: [],
    objectIndexEntries: [],
    memberIndexEntries: [],
    valueIndexEntries: [],
    pendingReferences: [],
  }
}

function createEmptyFirstPassProfileSummary(): Omit<ProjectValidationFirstPassProfile, "key"> {
  return {
    totalMs: 0,
    cacheMs: 0,
    schemaMs: 0,
    validatorsMs: 0,
    equalNameMs: 0,
    localValueValidationProfile: {},
    yamlFactsMs: 0,
    fieldIndexMs: 0,
    objectIndexMs: 0,
    memberIndexMs: 0,
    valueIndexMs: 0,
    diagnostics: 0,
    propertyEvents: 0,
  }
}

function addFirstPassProfile(
  summary: Omit<ProjectValidationFirstPassProfile, "key">,
  profile: ProjectValidationFirstPassProfile
): void {
  summary.totalMs += profile.totalMs
  summary.cacheMs += profile.cacheMs
  summary.schemaMs += profile.schemaMs
  summary.validatorsMs += profile.validatorsMs
  summary.equalNameMs += profile.equalNameMs
  mergeLocalValueValidationProfile(summary.localValueValidationProfile, profile.localValueValidationProfile)
  summary.yamlFactsMs += profile.yamlFactsMs
  summary.fieldIndexMs += profile.fieldIndexMs
  summary.objectIndexMs += profile.objectIndexMs
  summary.memberIndexMs += profile.memberIndexMs
  summary.valueIndexMs += profile.valueIndexMs
  summary.diagnostics += profile.diagnostics
  summary.propertyEvents += profile.propertyEvents
}

function recordFirstPassProfile(
  profiler: ReturnType<typeof createValidationProfiler>,
  items: number,
  profile: Omit<ProjectValidationFirstPassProfile, "key">
): void {
  profiler.record("Первичная проверка YAML", "Проверка JSON Schema", { items, timeMs: profile.schemaMs })
  profiler.record("Первичная проверка YAML", "Дополнительные валидаторы", { items, timeMs: profile.validatorsMs })
  profiler.record("Первичная проверка YAML", "Проверка equal-name", { items, timeMs: profile.equalNameMs })
  for (const [substep, value] of Object.entries(profile.localValueValidationProfile)) {
    profiler.record("Первичная проверка YAML", substep, value)
  }
  profiler.record("Первичная проверка YAML", "Извлечение YAML-фактов", { items, timeMs: profile.yamlFactsMs })
  profiler.record("Первичная проверка YAML", "Построение field index", { items, timeMs: profile.fieldIndexMs })
  profiler.record("Первичная проверка YAML", "Построение object index", { items, timeMs: profile.objectIndexMs })
  profiler.record("Первичная проверка YAML", "Построение member index", { items, timeMs: profile.memberIndexMs })
  profiler.record("Первичная проверка YAML", "Построение value index", { items, timeMs: profile.valueIndexMs })
}

function mergeLocalValueValidationProfile(
  target: Record<string, { items: number; timeMs: number }>,
  source: Readonly<Record<string, { items: number; timeMs: number }>>
): void {
  for (const [substep, value] of Object.entries(source)) {
    const current = target[substep]
    target[substep] = {
      items: (current?.items ?? 0) + value.items,
      timeMs: (current?.timeMs ?? 0) + value.timeMs,
    }
  }
}

function requireValidationSchemaCache(): ValidationSchemaCache {
  if (validationSchemaCache === undefined) throw new Error("Prepared YAML worker не инициализирован для validation")
  return validationSchemaCache
}

function requireValidationRulesSnapshot(): ValidationRulesSnapshot {
  if (validationRulesSnapshot === undefined) throw new Error("Prepared YAML worker rulesSnapshot не инициализирован")
  return validationRulesSnapshot
}
