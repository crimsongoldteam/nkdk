import { createHash } from "node:crypto"
import fs from "node:fs"
import { dirname, extname, relative, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"

const sourceExtensions = [".ts", ".mts", ".js", ".mjs", ".json"]
const excludedDirectoryNames = new Set(["tests", "fixtures", "__fixtures__"])

export function fingerprintRulesSourceTree(root, entrypoints) {
  const absoluteRoot = resolve(root instanceof URL ? fileURLToPath(root) : root)
  return fingerprintRulesSources(collectSources(absoluteRoot, entrypoints))
}

export function fingerprintRulesSources(entries) {
  const hash = createHash("sha256")
  for (const { path, content } of [...entries].sort((left, right) => compareCodePoints(left.path, right.path))) {
    hash.update(path)
    hash.update("\0")
    hash.update(String(Buffer.byteLength(content)))
    hash.update("\0")
    hash.update(content)
    hash.update("\0")
  }
  return hash.digest("hex")
}

function collectSources(root, entrypoints) {
  const entries = []
  const visited = new Set()
  for (const entrypoint of [...entrypoints].sort(compareCodePoints)) visit(resolve(root, entrypoint))
  return entries

  function visit(candidate) {
    const absolutePath = resolveSourceFile(candidate)
    if (absolutePath === undefined || visited.has(absolutePath) || isExcluded(root, absolutePath)) return
    visited.add(absolutePath)
    const projectPath = relative(root, absolutePath).split(sep).join("/")
    if (projectPath === ".." || projectPath.startsWith("../")) return
    const content = fs.readFileSync(absolutePath, "utf8")
    entries.push({
      path: projectPath,
      content,
    })
    for (const specifier of relativeRuntimeImports(content)) {
      visit(resolve(dirname(absolutePath), specifier))
    }
  }
}

function resolveSourceFile(candidate) {
  const candidates = extname(candidate) === ""
    ? [...sourceExtensions.map((extension) => `${candidate}${extension}`), ...sourceExtensions.map((extension) => resolve(candidate, `index${extension}`))]
    : [candidate, ...(extname(candidate) === ".js" ? [`${candidate.slice(0, -3)}.ts`] : [])]
  return candidates.find((path) => {
    try {
      return fs.statSync(path).isFile()
    } catch {
      return false
    }
  })
}

function isExcluded(root, absolutePath) {
  const projectPath = relative(root, absolutePath).split(sep).join("/")
  const segments = projectPath.split("/")
  return segments.some((segment) => excludedDirectoryNames.has(segment))
    || /\.(?:test|spec)\.[cm]?[jt]s$/u.test(projectPath)
    || projectPath.endsWith(".testWorker.ts")
}

function relativeRuntimeImports(content) {
  const withoutComments = content.replace(/\/\*[\s\S]*?\*\//gu, "").replace(/\/\/[^\n\r]*/gu, "")
  const imports = []
  const pattern = /\b(?:import|export)\s+(?!type\b)(?:[^"'`;]*?\sfrom\s*)?["']([^"']+)["']/gu
  for (const match of withoutComments.matchAll(pattern)) {
    const specifier = match[1]
    if (specifier?.startsWith(".") === true) imports.push(specifier)
  }
  return imports.sort(compareCodePoints)
}

function compareCodePoints(left, right) {
  return left < right ? -1 : left > right ? 1 : 0
}
