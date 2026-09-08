import { spawnSync } from "node:child_process"
import { lstat, readdir, readFile, realpath, writeFile } from "node:fs/promises"
import { extname, join, relative, resolve, sep } from "node:path"
import { pathToFileURL } from "node:url"

const textExtensions = new Set([".xml", ".bsl", ".os", ".html", ".htm", ".txt", ".json", ".yaml", ".yml", ".xsd", ".xsl", ".xslt", ".css", ".js", ".mjs"])

export function normalizeTextBytes(bytes) {
  let text
  try {
    text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes)
  } catch {
    return { bytes, changed: false, reason: "неизвестная кодировка (ожидается UTF-8)" }
  }
  if (/[\u0000-\u0008\u000b\u000e-\u001f]/u.test(text)) {
    return { bytes, changed: false, reason: "двоичные управляющие байты" }
  }
  if (!text.includes("\r\n")) return { bytes, changed: false }
  // Строгий UTF-8 выше гарантирует обратимость; BOM остаётся частью строки.
  return { bytes: Buffer.from(text.replaceAll("\r\n", "\n")), changed: true }
}

function binaryAttributes(dir, files) {
  const probe = spawnSync("git", ["-C", dir, "rev-parse", "--show-toplevel"], { encoding: "utf8" })
  if (probe.error) throw probe.error
  if (probe.status !== 0) {
    if (/not a git repository/u.test(probe.stderr)) return new Set()
    throw new Error(probe.stderr || "Не удалось прочитать Git-атрибуты")
  }
  const root = probe.stdout.trim()
  const blocked = new Set()
  for (let offset = 0; offset < files.length; offset += 1000) {
    const names = files.slice(offset, offset + 1000).map((path) => relative(root, path).split(sep).join("/"))
    const result = spawnSync("git", ["-C", root, "check-attr", "-z", "--stdin", "text", "diff", "binary", "working-tree-encoding"], {
      input: names.join("\0") + "\0", encoding: "utf8", maxBuffer: 16 * 1024 * 1024,
    })
    if (result.error) throw result.error
    if (result.status !== 0) throw new Error(result.stderr || "Не удалось прочитать Git-атрибуты")
    const fields = result.stdout.split("\0")
    for (let index = 0; index + 2 < fields.length; index += 3) {
      const [name, attribute, value] = fields.slice(index, index + 3)
      if ((["text", "diff"].includes(attribute) && value === "unset") ||
          (attribute === "binary" && value === "set") ||
          (attribute === "working-tree-encoding" && !["unspecified", "unset", "utf-8", "UTF-8"].includes(value))) {
        blocked.add(resolve(root, name))
      }
    }
  }
  return blocked
}

export async function normalizeXmlLineEndings(directory) {
  const selected = resolve(directory)
  const root = await lstat(selected)
  if (!root.isDirectory() || root.isSymbolicLink()) throw new Error(`Нужен обычный каталог: ${selected}`)
  const dir = await realpath(selected)
  const files = []
  const skipped = []
  const skip = (path, reason) => skipped.push({ path: relative(dir, path).split(sep).join("/"), reason })
  async function walk(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const path = join(current, entry.name)
      if (entry.name === ".git") { skip(path, "служебный каталог Git"); continue }
      if (entry.isSymbolicLink()) { skip(path, "символическая ссылка"); continue }
      if (entry.isDirectory()) await walk(path)
      else if (entry.isFile()) {
        if (textExtensions.has(extname(entry.name).toLowerCase())) files.push(path)
        else skip(path, "формат не входит в список текстовых")
      }
    }
  }
  await walk(dir)
  const binary = binaryAttributes(dir, files)
  let changed = 0
  let unchanged = 0
  for (const path of files) {
    if (binary.has(path)) { skip(path, "Git-атрибуты запрещают преобразование текста"); continue }
    const result = normalizeTextBytes(await readFile(path))
    if (result.reason) skip(path, result.reason)
    else if (result.changed) { await writeFile(path, result.bytes); changed += 1 }
    else unchanged += 1
  }
  return { changed, unchanged, skipped }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    if (process.argv.length !== 4 || process.argv[2] !== "--dir") throw new Error("Использование: node scripts/normalize-xml-line-endings.mjs --dir <каталог>")
    const result = await normalizeXmlLineEndings(process.argv[3])
    console.log(`Нормализация CRLF: изменено ${result.changed}; без изменений ${result.unchanged}; пропущено ${result.skipped.length}`)
    for (const item of result.skipped) console.log(`Пропущено: ${item.path} — ${item.reason}`)
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
