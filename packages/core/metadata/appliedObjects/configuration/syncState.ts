import fs from "fs"
import { join, resolve } from "path"
import { xxh3 } from "@node-rs/xxhash"
import pLimit from "p-limit"
import YAML from "yaml"
import {
  BINARY_SYNC_STATE_FILE,
  readBinaryXmlSyncState,
  writeBinaryXmlSyncState,
} from "./syncStateBinary"

export const SYNC_STATE_FILE = ".nkdk-sync.yaml"
export { BINARY_SYNC_STATE_FILE }
const DEFAULT_HASH_CONCURRENCY = 16

export interface XmlSyncState {
  version: 1
  files: Record<string, string>
}

export interface XmlSyncStateDiff {
  added: string[]
  changed: string[]
  deleted: string[]
}

export interface InitializeXmlSyncStateParams {
  yamlDir: string
  xmlDir: string
  hashConcurrency?: number
}

export interface HashProjectFilesOptions {
  concurrency?: number
}

type ProjectHashEntry = readonly [string, string]

export async function readXmlSyncState(xmlDir: string): Promise<XmlSyncState | undefined> {
  const binaryPath = join(xmlDir, BINARY_SYNC_STATE_FILE)
  if (fs.existsSync(binaryPath)) return readBinaryXmlSyncState(xmlDir)

  const path = join(xmlDir, SYNC_STATE_FILE)
  if (!fs.existsSync(path)) return undefined

  const parsed = YAML.parse(await fs.promises.readFile(path, "utf-8")) as unknown
  if (!isXmlSyncState(parsed)) throw new Error(`Некорректный ${SYNC_STATE_FILE}`)

  return { version: 1, files: sortRecord(parsed.files) }
}

export async function writeXmlSyncState(xmlDir: string, state: XmlSyncState): Promise<void> {
  await writeBinaryXmlSyncState(xmlDir, { version: 1, files: sortRecord(state.files) })
}

export async function hashProjectFiles(
  projectDir: string,
  options: HashProjectFilesOptions = {},
): Promise<Record<string, string>> {
  const root = resolve(projectDir)
  const concurrency = normalizeHashConcurrency(options.concurrency)
  const limit = pLimit(concurrency)
  const { collectSyncStateFilePaths } = await import("~/metadata/project/syncStateFiles")
  const paths = await collectSyncStateFilePaths(root)

  const entries = await Promise.all(
    paths.map((projectPath) =>
      limit(async () => {
        const absPath = join(root, ...projectPath.split("/"))
        if (!fs.existsSync(absPath)) return undefined
        const hash = xxh3.xxh64(await fs.promises.readFile(absPath))
        const hashValue: string = `xxh3-64:${hash.toString(16).padStart(16, "0")}`
        return [projectPath, hashValue] as const
      }),
    ),
  )

  return sortRecord(Object.fromEntries(entries.filter((entry): entry is ProjectHashEntry => entry !== undefined)))
}

export function diffSyncState(previous: Record<string, string>, current: Record<string, string>): XmlSyncStateDiff {
  const added: string[] = []
  const changed: string[] = []
  const deleted: string[] = []

  for (const path of Object.keys(current).sort()) {
    if (!(path in previous)) added.push(path)
    else if (previous[path] !== current[path]) changed.push(path)
  }

  for (const path of Object.keys(previous).sort()) {
    if (!(path in current)) deleted.push(path)
  }

  return { added, changed, deleted }
}

export async function initializeXmlSyncState(params: InitializeXmlSyncStateParams): Promise<XmlSyncState> {
  const files = await hashProjectFiles(params.yamlDir, { concurrency: params.hashConcurrency })
  const state: XmlSyncState = { version: 1, files }
  await writeXmlSyncState(params.xmlDir, state)
  return state
}

function normalizeHashConcurrency(value: number | undefined): number {
  if (value === undefined) return DEFAULT_HASH_CONCURRENCY
  if (!Number.isInteger(value) || value < 1) throw new Error("hash concurrency must be a positive integer")
  return value
}

function isXmlSyncState(value: unknown): value is XmlSyncState {
  if (!value || typeof value !== "object") return false

  const record = value as Record<string, unknown>
  if (record.version !== 1) return false
  if (!record.files || typeof record.files !== "object" || Array.isArray(record.files)) return false

  return Object.values(record.files).every((hash) => typeof hash === "string" && /^xxh3-64:[0-9a-f]{16}$/.test(hash))
}

function sortRecord(input: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(input).sort(([left], [right]) => left.localeCompare(right, "ru")))
}
