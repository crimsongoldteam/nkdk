import type { ElementType } from "../orchestration/formElement/types"
import type { MetadataProjectResourceKind, MetadataProjectYamlRole } from "../project/resources"
import type { ObjectFieldKind } from "../validation/dataPath/objectFields"
import type {
  DataPathTableInfo,
  DataPathTypeInfo,
  FormDataPathColumnSource,
  FormDataPathSource,
  OwnerTypeRef,
} from "../validation/dataPath/types"
import type { DataPathPolicyInput } from "../validation/dataPath/policies"
import type { ParsedMetadataTarget, MetadataTargetConstraint } from "../commonObjects/metadataTargets/types"
import type { Diagnostic } from "../validation/types"
import type { YamlDiagnosticLocation, YamlPath } from "../validation/yamlLocations"
import type { ProjectValidationFirstPassResult } from "../validation/projectValidationPasses"
import type { ValidationObjectRecord } from "../validation/projectValidationTypes"
import type { ValidationPendingCheck } from "../validation/projectValidationPendingChecks"

export interface ProjectStateFileIdentity {
  readonly projectPath: string
  readonly componentPath: string
  readonly resourceKind: MetadataProjectResourceKind
  readonly yamlRole?: MetadataProjectYamlRole
}

export interface ProjectStateResourceUpdate extends ProjectStateFileIdentity {
  readonly kind: "resource"
}

export type ProjectStateDiagnostic = Omit<Diagnostic, "filePath">

export interface ProjectStateLocalValidationResult {
  readonly contributedFacts: boolean
  readonly diagnostics: readonly ProjectStateDiagnostic[]
  readonly schemaDiagnostics: readonly ProjectStateDiagnostic[]
}

export interface ProjectStateReferenceEntry {
  readonly kind: "object" | "member" | "value"
  readonly canonical: string
}

export interface ProjectStatePendingReference {
  readonly yamlPath: YamlPath
  readonly canonical: string
  readonly target: ParsedMetadataTarget
  readonly constraint: MetadataTargetConstraint
}

export interface ProjectStateOwnerFact {
  readonly owner: OwnerTypeRef
  readonly facts: Readonly<Record<string, unknown>>
}

export interface ProjectStateFieldEntry {
  readonly owner: OwnerTypeRef
  readonly name: string
  readonly kind: ObjectFieldKind
  readonly typeInfo: DataPathTypeInfo
  readonly targetName?: string
  readonly sourceCollection?: string
  readonly parentName?: string
  readonly table?: DataPathTableInfo
  readonly tableHasColumns?: boolean
}

export type ProjectStateFormEntry =
  | {
      readonly kind: "root"
      readonly owner: OwnerTypeRef
      readonly name: string
      readonly source: ProjectStateFormSource
    }
  | {
      readonly kind: "additionalColumn"
      readonly owner: OwnerTypeRef
      readonly tablePath: string
      readonly name: string
      readonly source: FormDataPathColumnSource
    }

export interface ProjectStateFormSource {
  readonly kind: FormDataPathSource["kind"]
  readonly name: string
  readonly typeInfo: DataPathTypeInfo
  readonly table?: DataPathTableInfo
  readonly tableHasColumns?: boolean
}

export interface ProjectStatePendingDependencyCheck {
  readonly kind: "dataPath"
  readonly location: Omit<YamlDiagnosticLocation, "filePath">
  readonly owner: OwnerTypeRef
  readonly value: string
  readonly policyInput: DataPathPolicyInput
  readonly elementType?: ElementType
  readonly hasValuesPicture?: boolean
  readonly tableContext?: { readonly dataPath: string }
  readonly policy: "formDataPath"
}

export interface ProjectStateYamlFileUpdate extends ProjectStateFileIdentity {
  readonly kind: "yaml"
  readonly localValidation: ProjectStateLocalValidationResult
  readonly references: readonly ProjectStateReferenceEntry[]
  readonly pendingReferences: readonly ProjectStatePendingReference[]
  readonly owners: readonly ProjectStateOwnerFact[]
  readonly fields: readonly ProjectStateFieldEntry[]
  readonly forms: readonly ProjectStateFormEntry[]
  readonly pendingChecks: readonly ProjectStatePendingDependencyCheck[]
  readonly dependencies: readonly string[]
}

export type ProjectStateFileUpdate = ProjectStateResourceUpdate | ProjectStateYamlFileUpdate

export interface ProjectStateFileUpdateBatch {
  readonly updates: readonly ProjectStateFileUpdate[]
  readonly hashBytes: Uint8Array
}

export type ProjectStateFileUpdateBatchEntry =
  | { readonly update: ProjectStateFileUpdate; readonly hash: bigint; readonly hashBytes?: never }
  | { readonly update: ProjectStateFileUpdate; readonly hash?: never; readonly hashBytes: Uint8Array }

const HASH_BYTE_LENGTH = 8
const MAX_HASH = (1n << 64n) - 1n

export function createProjectStateFileUpdateBatch(
  entries: readonly ProjectStateFileUpdateBatchEntry[]
): ProjectStateFileUpdateBatch {
  const hashBytes = new Uint8Array(entries.length * HASH_BYTE_LENGTH)
  const view = new DataView(hashBytes.buffer)

  entries.forEach((entry, index) => {
    const offset = index * HASH_BYTE_LENGTH
    if (entry.hashBytes !== undefined) {
      if (entry.hashBytes.byteLength !== HASH_BYTE_LENGTH) {
        throw new Error("xxHash64 должен занимать ровно 8 байт")
      }
      hashBytes.set(entry.hashBytes, offset)
      return
    }
    if (entry.hash < 0n || entry.hash > MAX_HASH) throw new Error("xxHash64 вне диапазона uint64")
    view.setBigUint64(offset, entry.hash, false)
  })

  const batch = { updates: entries.map(({ update }) => update), hashBytes }
  assertProjectStateFileUpdateBatch(batch)
  return batch
}

export function toProjectStateFileUpdate(
  firstPassResult: ProjectValidationFirstPassResult,
  identity: ProjectStateFileIdentity
): ProjectStateYamlFileUpdate {
  if (identity.resourceKind !== "yaml" || identity.yamlRole === undefined) {
    throw new Error("Результат первого прохода можно связать только с YAML-файлом")
  }

  return {
    ...identity,
    kind: "yaml",
    localValidation: {
      contributedFacts: firstPassResult.contributedFacts,
      diagnostics: firstPassResult.diagnostics.map(withoutDiagnosticFilePath),
      schemaDiagnostics: firstPassResult.schemaDiagnostics.map(withoutDiagnosticFilePath),
    },
    references: [
      ...firstPassResult.objectIndexEntries.map(({ canonical }) => ({ kind: "object" as const, canonical })),
      ...firstPassResult.memberIndexEntries.map(({ canonical }) => ({ kind: "member" as const, canonical })),
      ...firstPassResult.valueIndexEntries.map(({ canonical }) => ({ kind: "value" as const, canonical })),
    ],
    pendingReferences: firstPassResult.pendingReferences.map(({ filePath: _filePath, ...reference }) => reference),
    owners: firstPassResult.objectRecords.flatMap(projectStateOwnerFacts),
    fields: firstPassResult.objectRecords.flatMap(projectStateFieldEntries),
    forms: projectStateFormEntries(firstPassResult.form),
    pendingChecks:
      firstPassResult.state.kind === "form"
        ? firstPassResult.state.pendingChecks.map(projectStatePendingCheck)
        : [],
    dependencies: [...new Set(firstPassResult.dependencies ?? [])],
  }
}

function withoutDiagnosticFilePath({ filePath: _filePath, ...diagnostic }: Diagnostic): ProjectStateDiagnostic {
  return diagnostic
}

function projectStateOwnerFacts(record: ValidationObjectRecord): ProjectStateOwnerFact[] {
  if (record.ownerFacts === undefined) return []
  const { ref, filePath: _filePath, fieldIndex: _fieldIndex, ...facts } = record.ownerFacts
  return [{ owner: ref, facts }]
}

function projectStateFieldEntries(record: ValidationObjectRecord): ProjectStateFieldEntry[] {
  const owner = record.ownerRef ?? record.ownerFacts?.ref
  const index = record.fieldIndex ?? record.ownerFacts?.fieldIndex
  if (owner === undefined || index === undefined) return []

  const entries: ProjectStateFieldEntry[] = []
  const seen = new Set<string>()
  for (const field of index.fields.values()) {
    addUniqueField(entries, seen, {
      owner,
      name: field.name,
      kind: field.kind,
      typeInfo: field.typeInfo,
      ...(field.targetName === undefined ? {} : { targetName: field.targetName }),
      ...(field.sourceCollection === undefined ? {} : { sourceCollection: field.sourceCollection }),
      ...(field.tableSource === undefined
        ? {}
        : { table: field.tableSource.table, tableHasColumns: field.tableSource.hasColumns }),
    })
    for (const column of field.tableSource?.columns.values() ?? []) {
      addUniqueField(entries, seen, {
        owner,
        parentName: field.name,
        name: column.name,
        kind: column.kind,
        typeInfo: column.typeInfo,
        ...(column.targetName === undefined ? {} : { targetName: column.targetName }),
        ...(column.sourceCollection === undefined ? {} : { sourceCollection: column.sourceCollection }),
      })
    }
  }
  return entries
}

function addUniqueField(
  entries: ProjectStateFieldEntry[],
  seen: Set<string>,
  entry: ProjectStateFieldEntry
): void {
  const key = `${entry.parentName ?? ""}\0${entry.kind}\0${entry.name}`
  if (seen.has(key)) return
  seen.add(key)
  entries.push(entry)
}

function projectStateFormEntries(form: ProjectValidationFirstPassResult["form"]): ProjectStateFormEntry[] {
  if (form === undefined) return []
  const { owner, index } = form
  const entries: ProjectStateFormEntry[] = []

  for (const source of index.roots.values()) {
    entries.push({
      kind: "root",
      owner,
      name: source.name,
      source: {
        kind: source.kind,
        name: source.name,
        typeInfo: source.typeInfo,
        ...(source.tableSource === undefined
          ? {}
          : { table: source.tableSource.table, tableHasColumns: source.tableSource.hasColumns }),
      },
    })
    for (const column of source.tableSource?.columns.values() ?? []) {
      entries.push({
        kind: "additionalColumn",
        owner,
        tablePath: source.name,
        name: column.name,
        source: column,
      })
    }
  }
  for (const [tablePath, columns] of index.additionalColumnsByTablePath) {
    for (const column of columns.values()) {
      entries.push({ kind: "additionalColumn", owner, tablePath, name: column.name, source: column })
    }
  }
  return entries
}

function projectStatePendingCheck(check: ValidationPendingCheck): ProjectStatePendingDependencyCheck {
  const { filePath: _filePath, ...location } = check.location
  return {
    kind: "dataPath",
    location,
    owner: check.owner,
    value: check.value,
    policyInput: check.policyInput,
    ...(check.elementType === undefined ? {} : { elementType: check.elementType }),
    ...(check.hasValuesPicture === undefined ? {} : { hasValuesPicture: check.hasValuesPicture }),
    ...(check.tableContext === undefined ? {} : { tableContext: check.tableContext }),
    policy: check.policy,
  }
}

export function assertProjectStateFileUpdateBatch(value: unknown): asserts value is ProjectStateFileUpdateBatch {
  const batch = requiredRecord(value, "ProjectStateFileUpdateBatch")
  assertExactKeys(batch, ["updates", "hashBytes"], "ProjectStateFileUpdateBatch")
  if (!Array.isArray(batch["updates"])) throw new Error("updates должен быть массивом")
  if (!(batch["hashBytes"] instanceof Uint8Array)) throw new Error("hashBytes должен быть Uint8Array")

  const hashBytes = batch["hashBytes"]
  const expectedLength = batch["updates"].length * HASH_BYTE_LENGTH
  if (hashBytes.byteOffset !== 0) throw new Error("hashBytes должен владеть ArrayBuffer с нулевого смещения")
  if (hashBytes.byteLength !== expectedLength || hashBytes.buffer.byteLength !== expectedLength) {
    throw new Error(`hashBytes должен занимать ${expectedLength} байт`)
  }

  batch["updates"].forEach((update, index) => assertProjectStateFileUpdate(update, `updates[${index}]`))
}

function assertProjectStateFileUpdate(value: unknown, path: string): void {
  const update = requiredRecord(value, path)
  assertString(update["kind"], `${path}.kind`)
  if (update["kind"] === "resource") {
    assertExactKeys(update, ["kind", "projectPath", "componentPath", "resourceKind", "yamlRole"], path)
    assertIdentity(update, path, "resource")
    return
  }
  if (update["kind"] !== "yaml") throw new Error(`${path}.kind имеет неизвестное значение`)

  assertExactKeys(
    update,
    [
      "kind",
      "projectPath",
      "componentPath",
      "resourceKind",
      "yamlRole",
      "localValidation",
      "references",
      "pendingReferences",
      "owners",
      "fields",
      "forms",
      "pendingChecks",
      "dependencies",
    ],
    path
  )
  assertIdentity(update, path, "yaml")
  assertLocalValidation(update["localValidation"], `${path}.localValidation`)
  assertRows(update["references"], `${path}.references`, ["kind", "canonical"], (row, rowPath) => {
    if (!["object", "member", "value"].includes(String(row["kind"]))) throw new Error(`${rowPath}.kind неизвестен`)
    assertString(row["canonical"], `${rowPath}.canonical`)
  })
  assertRows(
    update["pendingReferences"],
    `${path}.pendingReferences`,
    ["yamlPath", "canonical", "target", "constraint"],
    (row, rowPath) => {
      assertYamlPath(row["yamlPath"], `${rowPath}.yamlPath`)
      assertString(row["canonical"], `${rowPath}.canonical`)
      requiredRecord(row["target"], `${rowPath}.target`)
      requiredRecord(row["constraint"], `${rowPath}.constraint`)
    }
  )
  assertRows(update["owners"], `${path}.owners`, ["owner", "facts"], (row, rowPath) => {
    assertOwnerRef(row["owner"], `${rowPath}.owner`)
    requiredRecord(row["facts"], `${rowPath}.facts`)
  })
  assertRows(update["fields"], `${path}.fields`, [
    "owner",
    "name",
    "kind",
    "typeInfo",
    "targetName",
    "sourceCollection",
    "parentName",
    "table",
    "tableHasColumns",
  ], (row, rowPath) => {
    assertOwnerRef(row["owner"], `${rowPath}.owner`)
    assertString(row["name"], `${rowPath}.name`)
    if (!["attribute", "standardAttribute", "tabularSection", "dimension", "resource", "addressingAttribute"].includes(String(row["kind"]))) {
      throw new Error(`${rowPath}.kind неизвестен`)
    }
    assertTypeInfo(row["typeInfo"], `${rowPath}.typeInfo`)
    assertOptionalString(row["targetName"], `${rowPath}.targetName`)
    assertOptionalString(row["sourceCollection"], `${rowPath}.sourceCollection`)
    assertOptionalString(row["parentName"], `${rowPath}.parentName`)
    if (row["table"] !== undefined) requiredRecord(row["table"], `${rowPath}.table`)
    if (row["tableHasColumns"] !== undefined && typeof row["tableHasColumns"] !== "boolean") {
      throw new Error(`${rowPath}.tableHasColumns должен быть boolean`)
    }
  })
  assertFormRows(update["forms"], `${path}.forms`)
  assertRows(update["pendingChecks"], `${path}.pendingChecks`, [
    "kind",
    "location",
    "owner",
    "value",
    "policyInput",
    "elementType",
    "hasValuesPicture",
    "tableContext",
    "policy",
  ], assertPendingCheck)
  if (!Array.isArray(update["dependencies"]) || !update["dependencies"].every((item) => typeof item === "string")) {
    throw new Error(`${path}.dependencies должен быть массивом строк`)
  }
  assertPortableData(update, path)
}

function assertIdentity(
  update: Record<string, unknown>,
  path: string,
  expectedResourceKind: MetadataProjectResourceKind
): void {
  assertString(update["projectPath"], `${path}.projectPath`)
  assertString(update["componentPath"], `${path}.componentPath`)
  if (update["resourceKind"] !== expectedResourceKind) {
    throw new Error(`${path}.resourceKind не соответствует kind`)
  }
  if (update["yamlRole"] !== undefined && !["configuration", "properties", "form"].includes(String(update["yamlRole"]))) {
    throw new Error(`${path}.yamlRole имеет неизвестное значение`)
  }
  if (expectedResourceKind === "yaml" && update["yamlRole"] === undefined) {
    throw new Error(`${path}.yamlRole обязателен для YAML`)
  }
}

function assertLocalValidation(value: unknown, path: string): void {
  const result = requiredRecord(value, path)
  assertExactKeys(result, ["contributedFacts", "diagnostics", "schemaDiagnostics"], path)
  if (typeof result["contributedFacts"] !== "boolean") throw new Error(`${path}.contributedFacts должен быть boolean`)
  assertRows(result["diagnostics"], `${path}.diagnostics`, [
    "line",
    "col",
    "severity",
    "source",
    "message",
    "path",
  ], assertDiagnostic)
  assertRows(result["schemaDiagnostics"], `${path}.schemaDiagnostics`, [
    "line",
    "col",
    "severity",
    "source",
    "message",
    "path",
  ], assertDiagnostic)
}

function assertFormRows(value: unknown, path: string): void {
  if (!Array.isArray(value)) throw new Error(`${path} должен быть массивом`)
  value.forEach((item, index) => {
    const row = requiredRecord(item, `${path}[${index}]`)
    if (row["kind"] === "root") {
      assertExactKeys(row, ["kind", "owner", "name", "source"], `${path}[${index}]`)
      assertOwnerRef(row["owner"], `${path}[${index}].owner`)
      assertString(row["name"], `${path}[${index}].name`)
      const source = requiredRecord(row["source"], `${path}[${index}].source`)
      assertExactKeys(source, ["kind", "name", "typeInfo", "table", "tableHasColumns"], `${path}[${index}].source`)
      if (source["kind"] !== "formAttribute") throw new Error(`${path}[${index}].source.kind неизвестен`)
      assertString(source["name"], `${path}[${index}].source.name`)
      assertTypeInfo(source["typeInfo"], `${path}[${index}].source.typeInfo`)
    } else if (row["kind"] === "additionalColumn") {
      assertExactKeys(row, ["kind", "owner", "tablePath", "name", "source"], `${path}[${index}]`)
      assertOwnerRef(row["owner"], `${path}[${index}].owner`)
      assertString(row["tablePath"], `${path}[${index}].tablePath`)
      assertString(row["name"], `${path}[${index}].name`)
      const source = requiredRecord(row["source"], `${path}[${index}].source`)
      assertString(source["name"], `${path}[${index}].source.name`)
      assertTypeInfo(source["typeInfo"], `${path}[${index}].source.typeInfo`)
    } else {
      throw new Error(`${path}[${index}].kind имеет неизвестное значение`)
    }
    assertPortableData(row, `${path}[${index}]`)
  })
}

function assertRows(
  value: unknown,
  path: string,
  allowedKeys: readonly string[],
  validate?: (row: Record<string, unknown>, path: string) => void
): void {
  if (!Array.isArray(value)) throw new Error(`${path} должен быть массивом`)
  value.forEach((item, index) => {
    const row = requiredRecord(item, `${path}[${index}]`)
    assertExactKeys(row, allowedKeys, `${path}[${index}]`)
    validate?.(row, `${path}[${index}]`)
    assertPortableData(row, `${path}[${index}]`)
  })
}

function assertPendingCheck(row: Record<string, unknown>, path: string): void {
  if (row["kind"] !== "dataPath" || row["policy"] !== "formDataPath") throw new Error(`${path} имеет неизвестный вид`)
  const location = requiredRecord(row["location"], `${path}.location`)
  assertExactKeys(location, ["line", "col", "path"], `${path}.location`)
  assertNumber(location["line"], `${path}.location.line`)
  assertNumber(location["col"], `${path}.location.col`)
  assertOptionalString(location["path"], `${path}.location.path`)
  assertOwnerRef(row["owner"], `${path}.owner`)
  assertString(row["value"], `${path}.value`)
  const policyInput = requiredRecord(row["policyInput"], `${path}.policyInput`)
  assertExactKeys(policyInput, ["yaml", "allowedKinds", "allowComposite"], `${path}.policyInput`)
  assertString(policyInput["yaml"], `${path}.policyInput.yaml`)
  if (
    policyInput["allowedKinds"] !== undefined &&
    (!Array.isArray(policyInput["allowedKinds"]) || !policyInput["allowedKinds"].every((kind) => typeof kind === "string"))
  ) {
    throw new Error(`${path}.policyInput.allowedKinds должен быть массивом строк`)
  }
  if (policyInput["allowComposite"] !== undefined && typeof policyInput["allowComposite"] !== "boolean") {
    throw new Error(`${path}.policyInput.allowComposite должен быть boolean`)
  }
}

function assertDiagnostic(row: Record<string, unknown>, path: string): void {
  assertNumber(row["line"], `${path}.line`)
  assertNumber(row["col"], `${path}.col`)
  assertString(row["severity"], `${path}.severity`)
  assertString(row["source"], `${path}.source`)
  assertString(row["message"], `${path}.message`)
  assertOptionalString(row["path"], `${path}.path`)
}

function assertOwnerRef(value: unknown, path: string): void {
  const owner = requiredRecord(value, path)
  assertExactKeys(owner, ["kind", "name"], path)
  assertString(owner["kind"], `${path}.kind`)
  assertOptionalString(owner["name"], `${path}.name`)
}

function assertTypeInfo(value: unknown, path: string): void {
  const typeInfo = requiredRecord(value, path)
  if (!Array.isArray(typeInfo["kinds"]) || !typeInfo["kinds"].every((kind) => typeof kind === "string")) {
    throw new Error(`${path}.kinds должен быть массивом строк`)
  }
  if (!Array.isArray(typeInfo["nextTypes"])) throw new Error(`${path}.nextTypes должен быть массивом`)
  typeInfo["nextTypes"].forEach((owner, index) => assertOwnerRef(owner, `${path}.nextTypes[${index}]`))
}

function assertYamlPath(value: unknown, path: string): void {
  if (!Array.isArray(value) || !value.every((segment) => typeof segment === "string" || typeof segment === "number")) {
    throw new Error(`${path} должен быть YAML-путём`)
  }
}

function assertNumber(value: unknown, path: string): void {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${path} должен быть числом`)
}

function assertOptionalString(value: unknown, path: string): void {
  if (value !== undefined) assertString(value, path)
}

const FORBIDDEN_PORTABLE_KEYS = new Set(["rule", "parsed", "graph", "hash", "hashOffset", "fromYAML", "toYAML"])

function assertPortableData(value: unknown, path: string, seen = new Set<object>()): void {
  if (typeof value === "function") throw new Error(`${path} содержит функцию`)
  if (value === null || value === undefined || ["string", "number", "boolean"].includes(typeof value)) return
  if (typeof value !== "object") throw new Error(`${path} содержит непереносимое значение`)
  if (seen.has(value)) return
  seen.add(value)
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertPortableData(item, `${path}[${index}]`, seen))
    seen.delete(value)
    return
  }
  if (value instanceof Uint8Array || value instanceof ArrayBuffer) {
    seen.delete(value)
    return
  }
  const record = requiredRecord(value, path)
  for (const [key, item] of Object.entries(record)) {
    if (FORBIDDEN_PORTABLE_KEYS.has(key)) throw new Error(`${path}.${key} запрещён в переносимом DTO`)
    assertPortableData(item, `${path}.${key}`, seen)
  }
  seen.delete(value)
}

function assertExactKeys(record: Record<string, unknown>, allowed: readonly string[], path: string): void {
  const allowedSet = new Set(allowed)
  for (const key of Object.keys(record)) {
    if (!allowedSet.has(key)) throw new Error(`${path}.${key} не является разрешённым полем`)
  }
}

function requiredRecord(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error(`${path} должен быть объектом`)
  const prototype = Object.getPrototypeOf(value)
  if (prototype !== Object.prototype && prototype !== null) throw new Error(`${path} должен быть обычным объектом`)
  return value as Record<string, unknown>
}

function assertString(value: unknown, path: string): asserts value is string {
  if (typeof value !== "string") throw new Error(`${path} должен быть строкой`)
}
