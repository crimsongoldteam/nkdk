import type { ProjectStateFileIdentity } from "./fileUpdate"
import type { BinaryProjectStateReadToken } from "./binary/readToken"

export const PROJECT_STATE_HASH_BYTE_LENGTH = 8

export interface ProjectStateFileHashBatch {
  readonly files: readonly ProjectStateFileIdentity[]
  readonly hashBytes: Uint8Array
}

export interface ProjectStateFileBaseline {
  readonly knownHashBits: Uint8Array
  readonly hashBytes: Uint8Array
  readonly deleted: readonly ProjectStateFileIdentity[]
}

/** Непрозрачное разрешение на чтение снимка состояния проекта. */
export type ProjectStateReadToken = BinaryProjectStateReadToken

export function assertProjectStateFileHashBatch(value: unknown): asserts value is ProjectStateFileHashBatch {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("ProjectStateFileHashBatch должен быть объектом")
  }

  const batch = value as Record<string, unknown>
  assertExactKeys(batch, ["files", "hashBytes"], "ProjectStateFileHashBatch")
  if (!Array.isArray(batch["files"])) throw new Error("files должен быть массивом")
  if (!(batch["hashBytes"] instanceof Uint8Array)) throw new Error("hashBytes должен быть Uint8Array")

  const hashBytes = batch["hashBytes"]
  const expectedLength = batch["files"].length * PROJECT_STATE_HASH_BYTE_LENGTH
  if (hashBytes.byteOffset !== 0) throw new Error("hashBytes должен начинаться с нулевого смещения")
  if (hashBytes.byteLength !== expectedLength || hashBytes.buffer.byteLength !== expectedLength) {
    throw new Error(`hashBytes должен занимать ${expectedLength} байт`)
  }

  assertProjectStateFileIdentities(batch["files"])
}

export function assertProjectStateFileIdentities(
  value: unknown,
): asserts value is readonly ProjectStateFileIdentity[] {
  if (!Array.isArray(value)) throw new Error("files должен быть массивом")
  value.forEach((file, index) => assertFileIdentity(file, `files[${index}]`))
}

export function assertProjectStateFileBaseline(
  value: unknown,
  fileCount: number,
): asserts value is ProjectStateFileBaseline {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("ProjectStateFileBaseline должен быть объектом")
  }
  if (!Number.isSafeInteger(fileCount) || fileCount < 0) throw new Error("fileCount должен быть неотрицательным целым")
  const baseline = value as Record<string, unknown>
  assertExactKeys(baseline, ["knownHashBits", "hashBytes", "deleted"], "ProjectStateFileBaseline")
  assertOwnedBytes(baseline["knownHashBits"], Math.ceil(fileCount / 8), "knownHashBits")
  assertOwnedBytes(baseline["hashBytes"], fileCount * PROJECT_STATE_HASH_BYTE_LENGTH, "hashBytes")
  if (!Array.isArray(baseline["deleted"])) throw new Error("deleted должен быть массивом")
  baseline["deleted"].forEach((file, index) => assertFileIdentity(file, `deleted[${index}]`))

  const knownHashBits = baseline["knownHashBits"] as Uint8Array
  const remainder = fileCount % 8
  if (remainder !== 0 && (knownHashBits.at(-1)! & ~((1 << remainder) - 1)) !== 0) {
    throw new Error("knownHashBits содержит биты за пределами files")
  }
}

function assertFileIdentity(value: unknown, path: string): void {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error(`${path} должен быть объектом`)
  const file = value as Record<string, unknown>
  assertExactKeys(file, ["projectPath", "componentPath", "resourceKind", "yamlRole"], path)
  if (typeof file["projectPath"] !== "string") throw new Error(`${path}.projectPath должен быть строкой`)
  if (typeof file["componentPath"] !== "string") throw new Error(`${path}.componentPath должен быть строкой`)
  if (file["resourceKind"] !== "yaml" && file["resourceKind"] !== "resource") {
    throw new Error(`${path}.resourceKind имеет неизвестное значение`)
  }
  if (file["yamlRole"] !== undefined && !["configuration", "properties", "form"].includes(String(file["yamlRole"]))) {
    throw new Error(`${path}.yamlRole имеет неизвестное значение`)
  }
}

function assertExactKeys(value: Record<string, unknown>, allowedKeys: readonly string[], path: string): void {
  if (Object.keys(value).some((key) => !allowedKeys.includes(key))) throw new Error(`${path} содержит неизвестное поле`)
}

function assertOwnedBytes(value: unknown, expectedLength: number, path: string): asserts value is Uint8Array {
  if (!(value instanceof Uint8Array)) throw new Error(`${path} должен быть Uint8Array`)
  if (value.byteOffset !== 0) throw new Error(`${path} должен начинаться с нулевого смещения`)
  if (value.byteLength !== expectedLength || value.buffer.byteLength !== expectedLength) {
    throw new Error(`${path} должен занимать ${expectedLength} байт`)
  }
}
