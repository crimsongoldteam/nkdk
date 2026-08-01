import { randomUUID } from "node:crypto"
import type { ProjectStateReadToken } from "../contracts"

const TOKEN_VERSION = 1
const TOKEN_STATUS_OFFSET = 0
const TOKEN_PAYLOAD_OFFSET = 1
const TOKEN_AVAILABLE = 0
const TOKEN_ACTIVE = 1
const TOKEN_CONSUMED = 2

export interface SqliteProjectStateIdentity {
  readonly stateId: string
  readonly databaseName: string
  readonly lifecycleNonce: string
}

export interface SqliteProjectStateReadTokenPayload extends SqliteProjectStateIdentity {
  readonly version: 1
  readonly tokenNonce: string
}

export function createSqliteProjectStateReadToken(identity: SqliteProjectStateIdentity): ProjectStateReadToken {
  const payload: SqliteProjectStateReadTokenPayload = {
    version: TOKEN_VERSION,
    ...identity,
    tokenNonce: randomUUID(),
  }
  const encoded = new TextEncoder().encode(JSON.stringify(payload))
  const token = new Uint8Array(new SharedArrayBuffer(encoded.byteLength + TOKEN_PAYLOAD_OFFSET))
  token.set(encoded, TOKEN_PAYLOAD_OFFSET)
  return token as ProjectStateReadToken
}

export function decodeSqliteProjectStateReadToken(token: ProjectStateReadToken): SqliteProjectStateReadTokenPayload {
  if (
    !(token instanceof Uint8Array)
    || !(token.buffer instanceof SharedArrayBuffer)
    || token.byteOffset !== 0
    || token.byteLength !== token.buffer.byteLength
    || token.byteLength <= TOKEN_PAYLOAD_OFFSET
  ) {
    throw new Error("Некорректный token чтения SQLite")
  }
  let value: unknown
  try {
    value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(token.subarray(TOKEN_PAYLOAD_OFFSET)))
  } catch {
    throw new Error("Некорректный token чтения SQLite")
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Некорректный token чтения SQLite")
  }
  const payload = value as Record<string, unknown>
  const keys = Object.keys(payload).sort()
  if (keys.join(",") !== "databaseName,lifecycleNonce,stateId,tokenNonce,version") {
    throw new Error("Некорректный token чтения SQLite")
  }
  if (
    payload["version"] !== TOKEN_VERSION
    || !isNonEmptyString(payload["stateId"])
    || !isNonEmptyString(payload["databaseName"])
    || !isNonEmptyString(payload["lifecycleNonce"])
    || !isNonEmptyString(payload["tokenNonce"])
  ) {
    throw new Error("Некорректный token чтения SQLite")
  }
  const result = payload as unknown as SqliteProjectStateReadTokenPayload
  tokensByPayload.set(result, token)
  return result
}

export function claimSqliteProjectStateReadToken(payload: SqliteProjectStateReadTokenPayload): void {
  const token = payloadToken(payload)
  if (Atomics.compareExchange(token, TOKEN_STATUS_OFFSET, TOKEN_AVAILABLE, TOKEN_ACTIVE) !== TOKEN_AVAILABLE) {
    throw new Error("Token чтения SQLite уже использован")
  }
}

export function consumeSqliteProjectStateReadToken(payload: SqliteProjectStateReadTokenPayload): void {
  Atomics.compareExchange(payloadToken(payload), TOKEN_STATUS_OFFSET, TOKEN_ACTIVE, TOKEN_CONSUMED)
}

export function abandonSqliteProjectStateReadToken(payload: SqliteProjectStateReadTokenPayload): void {
  Atomics.compareExchange(payloadToken(payload), TOKEN_STATUS_OFFSET, TOKEN_ACTIVE, TOKEN_AVAILABLE)
}

const tokensByPayload = new WeakMap<SqliteProjectStateReadTokenPayload, Uint8Array>()

function payloadToken(payload: SqliteProjectStateReadTokenPayload): Uint8Array {
  const token = tokensByPayload.get(payload)
  if (token === undefined) throw new Error("Некорректный token чтения SQLite")
  return token
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0
}
