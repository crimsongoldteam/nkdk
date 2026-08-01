import { randomUUID } from "node:crypto"
import type { DatabaseSync } from "node:sqlite"
import type { ProjectStateReadToken } from "../contracts"

const TOKEN_VERSION = 1

export interface SqliteProjectStateIdentity {
  readonly stateId: string
  readonly databaseName: string
  readonly lifecycleNonce: string
}

export function sqliteProjectStateLifecycleChannel(identity: SqliteProjectStateIdentity): string {
  return `nkdk-project-state:${identity.stateId}:${identity.lifecycleNonce}`
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
  const token = new Uint8Array(new SharedArrayBuffer(encoded.byteLength))
  token.set(encoded)
  return token as ProjectStateReadToken
}

export function decodeSqliteProjectStateReadToken(token: ProjectStateReadToken): SqliteProjectStateReadTokenPayload {
  if (
    !(token instanceof Uint8Array)
    || !(token.buffer instanceof SharedArrayBuffer)
    || token.byteOffset !== 0
    || token.byteLength !== token.buffer.byteLength
    || token.byteLength === 0
  ) {
    throw new Error("Некорректный token чтения SQLite")
  }
  let value: unknown
  try {
    value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(token))
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
  return payload as unknown as SqliteProjectStateReadTokenPayload
}

export function claimSqliteProjectStateReadToken(
  database: DatabaseSync,
  payload: SqliteProjectStateReadTokenPayload,
): void {
  try {
    database.prepare("INSERT INTO read_token_claims(token_nonce) VALUES (?)").run(payload.tokenNonce)
  } catch {
    throw new Error("Token чтения SQLite уже использован")
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0
}
