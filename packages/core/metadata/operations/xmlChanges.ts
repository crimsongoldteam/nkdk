import fs from "fs"
import { join, relative, sep } from "path"
import type { MetadataOperationChangedXmlFile } from "./types"

export async function snapshotXmlTree(root: string): Promise<Map<string, string>> {
  const files = new Map<string, string>()
  await visit(root, async (path) => {
    files.set(path, await fs.promises.readFile(path, "utf-8"))
  })
  return files
}

export async function diffXmlTree(
  root: string,
  before: Map<string, string>
): Promise<MetadataOperationChangedXmlFile[]> {
  const after = await snapshotXmlTree(root)
  const paths = new Set([...before.keys(), ...after.keys()])
  const changes: MetadataOperationChangedXmlFile[] = []

  for (const path of [...paths].sort((left, right) => left.localeCompare(right, "ru"))) {
    const previous = before.get(path)
    const current = after.get(path)
    if (previous === undefined && current !== undefined) changes.push({ path: rel(root, path), change: "added" })
    else if (previous !== undefined && current === undefined) changes.push({ path: rel(root, path), change: "deleted" })
    else if (previous !== current) changes.push({ path: rel(root, path), change: "changed" })
  }

  return changes
}

async function visit(path: string, onFile: (path: string) => Promise<void>): Promise<void> {
  if (!fs.existsSync(path)) return

  const stat = await fs.promises.stat(path)
  if (stat.isFile()) {
    await onFile(path)
    return
  }
  if (!stat.isDirectory()) return

  for (const entry of await fs.promises.readdir(path, { withFileTypes: true })) {
    await visit(join(path, entry.name), onFile)
  }
}

function rel(root: string, path: string): string {
  return relative(root, path).split(sep).join("/")
}
