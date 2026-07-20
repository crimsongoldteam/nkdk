import fs from "fs"
import { join, resolve } from "path"
import pLimit from "p-limit"
import { collectSyncStateFilePaths } from "../project/syncStateFiles"
import { hashFileBytes } from "./hash"
import type { ConfigurationProjectFile } from "./types"

const DEFAULT_HASH_CONCURRENCY = 16

export interface HashConfigurationProjectFilesOptions {
  concurrency?: number
}

export async function hashConfigurationProjectFiles(
  projectDir: string,
  options: HashConfigurationProjectFilesOptions = {}
): Promise<ConfigurationProjectFile[]> {
  const root = resolve(projectDir)
  const concurrency = normalizePositiveInteger(options.concurrency ?? DEFAULT_HASH_CONCURRENCY)
  const limit = pLimit(concurrency)
  const paths = await collectSyncStateFilePaths(root)
  const entries = await Promise.all(
    paths.map((projectPath) =>
      limit(async () => ({
        projectPath,
        contentHash: hashFileBytes(await fs.promises.readFile(join(root, ...projectPath.split("/")))),
      }))
    )
  )

  return entries.sort((left, right) =>
    Buffer.compare(Buffer.from(left.projectPath, "utf-8"), Buffer.from(right.projectPath, "utf-8"))
  )
}

function normalizePositiveInteger(value: number): number {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error("hash concurrency must be a positive integer")
  }
  return value
}
