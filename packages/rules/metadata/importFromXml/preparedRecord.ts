import {
  hashFileBytes,
  parseMetadataYaml,
  restoreXmlAnomalyAnnotations,
  serializeYAMLDocument,
  snapshotXmlAnomalyAnnotations,
  type ConfigurationIndexBlockFragment,
  type XmlAnomalyAnnotations,
  type XmlAnomalyAnnotationsSnapshot,
} from "@nkdk/runtime"
import type {
  DeferredObjectValue,
  DeferredValuePath,
  ImportedDependentPropertyCandidate,
  MetadataItemRule,
} from "@nkdk/runtime/rule-kit"
import { bindDeferredObjectValues, deferredValuePaths } from "@nkdk/runtime/rule-kit"
import type { MetadataItemOwnerContextEntry } from "../ruleRuntime/appliedObject/metadataItemOwnerContext"
import { findRegisteredProjectRule } from "../projectDefinition/projectSpecRegistry"
import type { XmlAnomalyProofAudit } from "./anomalyProof"
import type { ImportAssignment } from "./types"
import type { PreparedImportYaml } from "./prepareYaml"
import { createImportedFormDataPathIndex } from "../forms/clientApplicationForm/formDataPathMetadata"

const MAGIC = Uint8Array.of(0x4e, 0x4b, 0x50, 0x52)
const HEADER_LENGTH = 18
const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder("utf-8", { fatal: true })

export interface PreparedBaseFormRecordV1 {
  readonly baseProjectPath: string
  readonly targetProjectPath: string
  readonly owner: { readonly dir: string; readonly name: string }
  readonly yamlText: string
  readonly ruleItemType: string
  readonly deferred: readonly DeferredValuePath[]
  readonly configurationFragment: ConfigurationIndexBlockFragment
}

export interface PreparedImportRecordSourceV1 {
  readonly version: 1
  readonly assignment: ImportAssignment
  readonly yamlText: string
  readonly annotations: XmlAnomalyAnnotationsSnapshot
  readonly proofAudit: XmlAnomalyProofAudit
  readonly deferred: readonly DeferredValuePath[]
  readonly dependentDeferred: readonly ImportedDependentPropertyCandidate[]
  readonly ownerContext: readonly MetadataItemOwnerContextEntry[]
  readonly dependentOwner: { readonly dir: string; readonly name: string }
  readonly baseFormCandidate?: PreparedBaseFormRecordV1
  readonly ruleItemType: string
  readonly targetProjectPath: string
  readonly logicalAddress: string
  readonly configurationFragment?: ConfigurationIndexBlockFragment
}

export interface PreparedImportRecordV1 extends PreparedImportRecordSourceV1 {
  readonly checksum: bigint
}

export interface RestoredPreparedImportRecord {
  readonly record: PreparedImportRecordV1
  readonly yaml: unknown
  readonly annotations: XmlAnomalyAnnotations
  readonly rule: MetadataItemRule
  readonly deferred: readonly DeferredObjectValue[]
  readonly formDataPathIndex: ReturnType<typeof createImportedFormDataPathIndex>
  readonly baseFormCandidate?: {
    readonly baseProjectPath: string
    readonly targetProjectPath: string
    readonly owner: { readonly dir: string; readonly name: string }
    readonly yaml: unknown
    readonly rule: MetadataItemRule
    readonly deferred: readonly DeferredObjectValue[]
    readonly formDataPathIndex: ReturnType<typeof createImportedFormDataPathIndex>
    readonly configurationFragment: ConfigurationIndexBlockFragment
  }
}

export class PreparedImportRecordError extends Error {
  constructor(readonly code: "xml_import_prepared_version" | "xml_import_prepared_checksum" | "xml_import_prepared_rule", message: string) {
    super(message)
    this.name = "PreparedImportRecordError"
  }
}

export function encodePreparedImportRecord(record: PreparedImportRecordSourceV1): Uint8Array {
  const payload = textEncoder.encode(JSON.stringify(record, encodeJsonValue))
  const checksum = hashFileBytes(payload)
  const bytes = new Uint8Array(HEADER_LENGTH + payload.byteLength)
  bytes.set(MAGIC)
  const header = new DataView(bytes.buffer)
  header.setUint16(4, record.version, false)
  header.setUint32(6, payload.byteLength, false)
  header.setBigUint64(10, checksum, false)
  bytes.set(payload, HEADER_LENGTH)
  return bytes
}

export function decodePreparedImportRecord(bytes: Uint8Array): PreparedImportRecordV1 {
  if (bytes.byteLength < HEADER_LENGTH || !MAGIC.every((value, index) => bytes[index] === value)) {
    throw checksumError("Заголовок подготовленного XML-import повреждён")
  }
  const header = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const version = header.getUint16(4, false)
  if (version !== 1) {
    throw new PreparedImportRecordError("xml_import_prepared_version", `Неизвестная версия подготовленного XML-import: ${version}`)
  }
  const payloadLength = header.getUint32(6, false)
  if (payloadLength !== bytes.byteLength - HEADER_LENGTH) {
    throw checksumError("Длина подготовленного XML-import не совпадает с заголовком")
  }
  const expectedChecksum = header.getBigUint64(10, false)
  const payload = bytes.subarray(HEADER_LENGTH)
  if (hashFileBytes(payload) !== expectedChecksum) {
    throw checksumError("Контрольная сумма подготовленного XML-import не совпадает")
  }
  const parsed = JSON.parse(textDecoder.decode(payload), decodeJsonValue)
  const record = requirePreparedRecordV1(parsed)
  requirePreparedRule(record.ruleItemType)
  if (record.baseFormCandidate !== undefined) requirePreparedRule(record.baseFormCandidate.ruleItemType)
  return { ...record, checksum: expectedChecksum }
}

export function resolvePreparedImportRule(itemType: string): MetadataItemRule {
  return requirePreparedRule(itemType)
}

export function createPreparedImportRecordSource(
  prepared: PreparedImportYaml,
  configurationFragment?: ConfigurationIndexBlockFragment,
): PreparedImportRecordSourceV1 {
  const annotationSnapshot = snapshotXmlAnomalyAnnotations(prepared.yaml, prepared.annotations)
  const yamlText = serializeYAMLDocument(prepared.yaml, prepared.annotations).text
  return {
    version: 1,
    assignment: prepared.assignment,
    yamlText,
    annotations: annotationSnapshot,
    proofAudit: prepared.proofAudit,
    deferred: deferredValuePaths(prepared.deferred),
    dependentDeferred: prepared.dependentDeferred,
    ownerContext: prepared.ownerContext,
    dependentOwner: prepared.dependentOwner,
    ...(prepared.baseFormCandidate === undefined
      ? {}
      : {
          baseFormCandidate: {
            baseProjectPath: prepared.baseFormCandidate.baseProjectPath,
            targetProjectPath: prepared.baseFormCandidate.targetProjectPath,
            owner: prepared.baseFormCandidate.owner,
            yamlText: serializeYAMLDocument(prepared.baseFormCandidate.yaml).text,
            ruleItemType: prepared.baseFormCandidate.rule.itemType,
            deferred: deferredValuePaths(prepared.baseFormCandidate.deferred),
            configurationFragment: prepared.baseFormCandidate.configurationFragment,
          },
        }),
    ruleItemType: prepared.rule.itemType,
    targetProjectPath: prepared.targetProjectPath,
    logicalAddress: prepared.assignment.logicalAddress,
    ...(configurationFragment === undefined ? {} : { configurationFragment }),
  }
}

export function restorePreparedImportRecord(bytes: Uint8Array): RestoredPreparedImportRecord {
  const record = decodePreparedImportRecord(bytes)
  const parsed = parsePreparedYaml(record.yamlText)
  const base = record.baseFormCandidate
  const restoredBase = base === undefined
    ? undefined
    : (() => {
        const baseParsed = parsePreparedYaml(base.yamlText)
        const rule = resolvePreparedImportRule(base.ruleItemType)
        return {
          baseProjectPath: base.baseProjectPath,
          targetProjectPath: base.targetProjectPath,
          owner: base.owner,
          yaml: baseParsed.data,
          rule,
          deferred: bindDeferredObjectValues(baseParsed.data, base.deferred),
          formDataPathIndex: createImportedFormDataPathIndex({ yaml: baseParsed.data, rule }),
          configurationFragment: base.configurationFragment,
        }
      })()
  const rule = resolvePreparedImportRule(record.ruleItemType)
  return {
    record,
    yaml: parsed.data,
    annotations: restoreXmlAnomalyAnnotations(
      parsed.data,
      mergeAnnotationSnapshots(
        snapshotXmlAnomalyAnnotations(parsed.data, parsed.annotations),
        record.annotations,
      ),
    ),
    rule,
    deferred: bindDeferredObjectValues(parsed.data, record.deferred),
    formDataPathIndex: createImportedFormDataPathIndex({ yaml: parsed.data, rule }),
    ...(restoredBase === undefined ? {} : { baseFormCandidate: restoredBase }),
  }
}

function mergeAnnotationSnapshots(
  parsed: XmlAnomalyAnnotationsSnapshot,
  recorded: XmlAnomalyAnnotationsSnapshot,
): XmlAnomalyAnnotationsSnapshot {
  const entries = new Map<string, XmlAnomalyAnnotationsSnapshot["entries"][number]>()
  for (const entry of [...parsed.entries, ...recorded.entries]) {
    entries.set(JSON.stringify([entry.parentPath, entry.key, entry.annotation.target]), entry)
  }
  const root = recorded.root ?? parsed.root
  return {
    version: 1,
    ...(root === undefined ? {} : { root }),
    entries: [...entries.values()],
  }
}

function requirePreparedRule(itemType: string): MetadataItemRule {
  const rule = findRegisteredProjectRule(itemType)
  if (rule === undefined) {
    throw new PreparedImportRecordError(
      "xml_import_prepared_rule",
      `Не найдено правило подготовленного XML-import: ${itemType}`,
    )
  }
  return rule
}

function parsePreparedYaml(text: string): ReturnType<typeof parseMetadataYaml> {
  const parsed = parseMetadataYaml(text)
  if (parsed.syntaxErrors.length > 0) {
    throw checksumError(`YAML подготовленного XML-import не разобран: ${parsed.syntaxErrors[0]!.message}`)
  }
  return parsed
}

function requirePreparedRecordV1(value: unknown): PreparedImportRecordSourceV1 {
  if (!isRecord(value) || value.version !== 1 || typeof value.yamlText !== "string"
    || typeof value.ruleItemType !== "string" || !isRecord(value.assignment)) {
    throw checksumError("Полезная нагрузка подготовленного XML-import имеет неверный формат")
  }
  const record = value as unknown as PreparedImportRecordSourceV1
  return {
    ...record,
    assignment: {
      ...record.assignment,
      owner: record.assignment.owner,
    },
  }
}

function encodeJsonValue(_key: string, value: unknown): unknown {
  return typeof value === "bigint" ? { $nkdkPrepared: "bigint", value: value.toString() } : value
}

function decodeJsonValue(_key: string, value: unknown): unknown {
  if (isRecord(value) && value.$nkdkPrepared === "bigint" && typeof value.value === "string") {
    return BigInt(value.value)
  }
  return value
}

function checksumError(message: string): PreparedImportRecordError {
  return new PreparedImportRecordError("xml_import_prepared_checksum", message)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}
