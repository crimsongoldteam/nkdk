import { createReadStream } from "node:fs"
import { readdir, readFile } from "node:fs/promises"
import { createRequire } from "node:module"
import { join } from "node:path"
import { createInterface } from "node:readline"
import { fileURLToPath } from "node:url"
import { tsImport } from "tsx/esm/api"

// Тот же парсер и реестр тегов, что использует production YAML; своих правил нет.
const { parseEvents } = createRequire(new URL("../packages/runtime/package.json", import.meta.url))("js-yaml")
const { XML_ANNOTATION_TAGS, XML_REPRESENTATION_YAML_TAGS, prepareYAMLScalarTagsForParser } =
  await tsImport("../packages/runtime/yaml/scalarTags.ts", import.meta.url)

export const XML_STATISTIC_KINDS = [
  ...XML_ANNOTATION_TAGS,
  ...XML_REPRESENTATION_YAML_TAGS.map((tag) => tag.slice("xml/".length)),
]

export function countXmlTags(text) {
  const counts = Object.fromEntries(XML_STATISTIC_KINDS.map((kind) => [kind, 0]))
  const source = prepareYAMLScalarTagsForParser(text)
  for (const event of parseEvents(source, {})) {
    if (!(event.tagStart >= 0)) continue
    const tag = source.slice(event.tagStart, event.tagEnd)
    const match = /^!xml\/([^/]+)(?:\/[1-9]\d*)?$/u.exec(tag)
    if (match && Object.hasOwn(counts, match[1])) counts[match[1]] += 1
  }
  return counts
}

async function* yamlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  for (const entry of entries.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) {
    const path = join(directory, entry.name)
    if (entry.isSymbolicLink()) throw new Error(`Статистика не следует по символической ссылке: ${path}`)
    if (entry.isDirectory()) yield* yamlFiles(path)
    else if (entry.isFile() && /\.ya?ml$/u.test(entry.name)) yield path
  }
}

export async function* readDiagnostics(payload) {
  if (payload.truncated && !payload.report) throw new Error("Не найден полный диагностический отчёт импорта")
  if (payload.report) {
    if (payload.report.format !== "application/x-ndjson") throw new Error("Неизвестный формат отчёта импорта")
    const input = createReadStream(fileURLToPath(payload.report.uri), { encoding: "utf8" })
    const lines = createInterface({ input, crlfDelay: Infinity })
    try {
      for await (const line of lines) if (line.trim()) yield JSON.parse(line)
    } finally {
      lines.close()
      input.destroy()
    }
  } else {
    if (!Array.isArray(payload.diagnostics)) throw new Error("Нет диагностики импорта для статистики")
    yield* payload.diagnostics
  }
}

async function broadRawFiles(importOutputPath) {
  const payload = JSON.parse(await readFile(importOutputPath, "utf8"))
  const files = new Map()
  let total = 0
  for await (const diagnostic of readDiagnostics(payload)) {
    total += 1
    if (diagnostic.code !== "xml_raw_scope_too_broad") continue
    if (!diagnostic.targetProjectPath) throw new Error("Не указан YAML-путь широкого raw в диагностике импорта")
    files.set(diagnostic.targetProjectPath, (files.get(diagnostic.targetProjectPath) ?? 0) + 1)
  }
  if (total !== payload.summary?.errors + payload.summary?.warnings) {
    throw new Error("Диагностический отчёт импорта неполон: число записей не совпадает со сводкой")
  }
  return [...files].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
    .map(([file, count]) => ({ file, count }))
}

export async function collectRoundTripStatistics({ yamlDir, importOutputPath }) {
  const broadRaw = await broadRawFiles(importOutputPath)
  const tags = countXmlTags("")
  let count = 0
  for await (const file of yamlFiles(yamlDir)) {
    try {
      const counts = countXmlTags(await readFile(file, "utf8"))
      for (const kind of XML_STATISTIC_KINDS) tags[kind] += counts[kind]
      count += 1
    } catch (error) {
      throw new Error(`Не удалось собрать статистику ${file}: ${error.message}`, { cause: error })
    }
  }
  return { tags, yamlFiles: count, broadRaw }
}
