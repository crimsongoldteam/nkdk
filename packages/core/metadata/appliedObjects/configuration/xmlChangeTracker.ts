import fs from "fs"
import { join, relative, sep } from "path"
import type { XmlWriteManifest } from "../../orchestration/xmlWriteManifest"
import type { MetadataOperationChangedXmlFile } from "../../operations/types"

export interface XmlChangeTracker {
  readonly manifest: XmlWriteManifest
  markWrite(absPath: string): Promise<void>
  markDelete(absPath: string): Promise<void>
  changedFiles(): MetadataOperationChangedXmlFile[]
}

export function createXmlChangeTracker(rootDir: string): XmlChangeTracker {
  const changes = new Map<string, MetadataOperationChangedXmlFile["change"]>()

  function record(absPath: string, change: MetadataOperationChangedXmlFile["change"]): void {
    changes.set(toRelativePath(rootDir, absPath), change)
  }

  return {
    manifest: {
      addFile(): void {},
    },
    async markWrite(absPath: string): Promise<void> {
      record(absPath, fs.existsSync(absPath) ? "changed" : "added")
    },
    async markDelete(absPath: string): Promise<void> {
      if (!fs.existsSync(absPath)) return

      const stat = await fs.promises.stat(absPath)
      if (stat.isFile()) {
        record(absPath, "deleted")
        return
      }
      if (!stat.isDirectory()) return

      for (const file of await listFiles(absPath)) record(file, "deleted")
    },
    changedFiles(): MetadataOperationChangedXmlFile[] {
      return [...changes.entries()]
        .sort(([left], [right]) => left.localeCompare(right, "ru"))
        .map(([path, change]) => ({ path, change }))
    },
  }
}

async function listFiles(dir: string): Promise<string[]> {
  const files: string[] = []
  for (const entry of await fs.promises.readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) files.push(...(await listFiles(path)))
    else if (entry.isFile()) files.push(path)
  }
  return files
}

function toRelativePath(rootDir: string, absPath: string): string {
  return relative(rootDir, absPath).split(sep).join("/")
}
