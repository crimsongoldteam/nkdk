import fs from "fs"
import { resolve } from "path"
import { parseMetadataYaml, type ParsedYaml } from "~/yaml/parseMetadataYaml"

export interface ProjectYamlEntry {
  filePath: string
  text: string
  parsed: ParsedYaml
}

export interface ProjectYamlCache {
  get(filePath: string): ProjectYamlEntry | { filePath: string; error: Error }
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
