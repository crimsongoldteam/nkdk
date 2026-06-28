import fs from "fs"
import { join, relative, resolve, sep } from "path"
import { xxh3 } from "@node-rs/xxhash"
import YAML from "yaml"

export const SYNC_STATE_FILE = ".nkdk-sync.yaml"

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
}

export async function readXmlSyncState(xmlDir: string): Promise<XmlSyncState | undefined> {
  const path = join(xmlDir, SYNC_STATE_FILE)
  if (!fs.existsSync(path)) return undefined

  const parsed = YAML.parse(await fs.promises.readFile(path, "utf-8")) as unknown
  if (!isXmlSyncState(parsed)) throw new Error(`Некорректный ${SYNC_STATE_FILE}`)

  return { version: 1, files: sortRecord(parsed.files) }
}

export async function writeXmlSyncState(xmlDir: string, state: XmlSyncState): Promise<void> {
  await fs.promises.mkdir(xmlDir, { recursive: true })
  const content = YAML.stringify({ version: 1, files: sortRecord(state.files) })
  await fs.promises.writeFile(join(xmlDir, SYNC_STATE_FILE), content, "utf-8")
}

export async function hashProjectFiles(projectDir: string): Promise<Record<string, string>> {
  const root = resolve(projectDir)
  const files: Record<string, string> = {}
  await collectProjectFileHashes(root, root, files)
  return sortRecord(files)
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
  const files = await hashProjectFiles(params.yamlDir)
  const state: XmlSyncState = { version: 1, files }
  await writeXmlSyncState(params.xmlDir, state)
  return state
}

async function collectProjectFileHashes(
  root: string,
  currentDir: string,
  result: Record<string, string>
): Promise<void> {
  if (!fs.existsSync(currentDir)) return

  for (const entry of await fs.promises.readdir(currentDir, { withFileTypes: true })) {
    const absPath = join(currentDir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === ".git") continue
      await collectProjectFileHashes(root, absPath, result)
      continue
    }
    if (!entry.isFile()) continue

    const relPath = relative(root, absPath).split(sep).join("/")
    if (entry.name === ".DS_Store") continue
    if (relPath === SYNC_STATE_FILE) continue

    const hash = xxh3.xxh64(await fs.promises.readFile(absPath))
    result[relPath] = `xxh3-64:${hash.toString(16).padStart(16, "0")}`
  }
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
