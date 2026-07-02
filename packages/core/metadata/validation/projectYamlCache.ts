import fs from "fs"
import { resolve } from "path"
import { parseMetadataYaml, type ParsedYaml } from "../../yaml/parseMetadataYaml"

export interface ProjectYamlEntry {
  filePath: string
  text: string
  parsed: ParsedYaml
}

export interface ProjectYamlCache {
  get(filePath: string): ProjectYamlEntry | { filePath: string; error: Error }
  release(filePath: string): void
}

type ProjectYamlCacheValue = ProjectYamlEntry | { filePath: string; error: Error }

export function createProjectYamlCache(): ProjectYamlCache {
  const entries = new Map<string, ProjectYamlCacheValue>()

  return {
    get(filePath) {
      const absolutePath = resolve(filePath)
      const cached = entries.get(absolutePath)
      if (cached) return cached

      const entry = readProjectYamlEntry(absolutePath)
      entries.set(absolutePath, entry)

      return entry
    },
    release(filePath) {
      const absolutePath = resolve(filePath)
      const cached = entries.get(absolutePath)
      if (cached === undefined || "error" in cached) return

      entries.delete(absolutePath)
    },
  }
}

export function createProjectYamlCacheFromEntries(entries: readonly ProjectYamlEntry[]): ProjectYamlCache {
  const byPath = new Map(entries.map((entry) => [resolve(entry.filePath), entry]))

  return {
    get(filePath) {
      const absolutePath = resolve(filePath)
      const entry = byPath.get(absolutePath)
      if (entry) return entry
      return {
        filePath: absolutePath,
        error: new Error(`YAML-файл отсутствует в validation snapshot: ${absolutePath}`),
      }
    },
    release() {
      // Snapshot entries live for the whole validation pass.
    },
  }
}

function readProjectYamlEntry(filePath: string): ProjectYamlCacheValue {
  try {
    const text = fs.readFileSync(filePath, "utf8")
    return { filePath, text, parsed: parseMetadataYaml(text) }
  } catch (caught) {
    return { filePath, error: toError(caught) }
  }
}

function toError(caught: unknown): Error {
  return caught instanceof Error ? caught : new Error(String(caught))
}
