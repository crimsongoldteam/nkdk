import fs from "fs"
import { dirname, join, relative } from "path"
import { fileURLToPath } from "url"
import { describe, expect, it } from "vitest"
import { testConvertAppliedObjectFromXML, testSyncAppliedObjectToXML } from "../../../tests/appliedObject"
import { appliedObjectSyncCases } from "./yamlFixtures"

const normalizeText = (value: string) =>
  value
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .trimEnd()

const binaryExtensions = new Set([".bin", ".png", ".jpg", ".jpeg", ".gif", ".ico", ".bmp", ".webp", ".zip"])

const isBinaryPath = (path: string) => {
  const lowerPath = path.toLowerCase()
  return [...binaryExtensions].some((extension) => lowerPath.endsWith(extension))
}

const listFiles = (root: string, baseDir = root): string[] => {
  if (!fs.existsSync(root)) return []
  const entries = fs.readdirSync(root, { withFileTypes: true })
  return entries.flatMap((entry) => {
    const fullPath = join(root, entry.name)
    if (entry.isDirectory()) return listFiles(fullPath, baseDir)
    return [relative(baseDir, fullPath)]
  })
}

const listReferenceFiles = (importMetaUrl: string) => {
  const testDir = dirname(fileURLToPath(importMetaUrl))
  const xmlDir = join(testDir, "__fixtures__", "sync", "xml")
  const files = listFiles(xmlDir)

  return {
    textFiles: files.filter((path) => !isBinaryPath(path)),
    binaryFiles: files.filter(isBinaryPath),
  }
}

describe("applied object XML -> YAML sync", () => {
  it.each(appliedObjectSyncCases)("$label", async ({ scenario, sync }) => {
    const result = await testConvertAppliedObjectFromXML({
      rule: scenario.rule,
      name: sync.name,
      importMetaUrl: scenario.importMetaUrl,
      expectedYAML: sync.expectedYAML,
    })

    expect(result.yaml.result).toBe(result.yaml.expected)
  })
})

describe("applied object YAML -> XML sync", () => {
  it.each(appliedObjectSyncCases)("$label", async ({ scenario, sync }) => {
    const { textFiles, binaryFiles } = listReferenceFiles(scenario.importMetaUrl)
    const { comparisons, binaryComparisons } = await testSyncAppliedObjectToXML({
      rule: scenario.rule,
      name: sync.name,
      importMetaUrl: scenario.importMetaUrl,
      expectedFiles: textFiles,
      binaryExpectedFiles: binaryFiles,
      externalObjectDir: sync.externalObjectDir,
    })

    for (const { path, result, expected } of comparisons) {
      expect(normalizeText(result), path).toBe(normalizeText(expected))
    }
    for (const { path, result, expected } of binaryComparisons) {
      expect(result, path).toEqual(expected)
    }
  })
})
