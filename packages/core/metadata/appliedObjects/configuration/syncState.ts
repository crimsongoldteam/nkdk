import { createHash } from "crypto"
import fs from "fs"
import { join, relative, resolve, sep } from "path"
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

async function collectProjectFileHashes(
  root: string,
  currentDir: string,
  result: Record<string, string>
): Promise<void> {
  if (!fs.existsSync(currentDir)) return

  for (const entry of await fs.promises.readdir(currentDir, { withFileTypes: true })) {
    const absPath = join(currentDir, entry.name)
    if (entry.isDirectory()) {
      await collectProjectFileHashes(root, absPath, result)
      continue
    }
    if (!entry.isFile()) continue

    const relPath = relative(root, absPath).split(sep).join("/")
    if (relPath === SYNC_STATE_FILE) continue

    result[relPath] = `sha256:${createHash("sha256").update(await fs.promises.readFile(absPath)).digest("hex")}`
  }
}

function isXmlSyncState(value: unknown): value is XmlSyncState {
  if (!value || typeof value !== "object") return false

  const record = value as Record<string, unknown>
  if (record.version !== 1) return false
  if (!record.files || typeof record.files !== "object" || Array.isArray(record.files)) return false

  return Object.values(record.files).every((hash) => typeof hash === "string" && /^sha256:[0-9a-f]+$/.test(hash))
}

function sortRecord(input: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(input).sort(([left], [right]) => left.localeCompare(right, "ru")))
}
