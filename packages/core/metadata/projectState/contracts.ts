import type { ProjectStateFileIdentity } from "./fileUpdate"

export const PROJECT_STATE_HASH_BYTE_LENGTH = 8

export interface ProjectStateFileHashBatch {
  readonly files: readonly ProjectStateFileIdentity[]
  readonly hashBytes: Uint8Array
}

declare const projectStateReadTokenBrand: unique symbol

/** Непрозрачное разрешение на чтение снимка состояния проекта. */
export type ProjectStateReadToken = Uint8Array & {
  readonly [projectStateReadTokenBrand]: "ProjectStateReadToken"
}

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

  batch["files"].forEach((file, index) => assertFileIdentity(file, `files[${index}]`))
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
