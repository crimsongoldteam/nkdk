import { createHash } from "node:crypto"
import fs from "node:fs"
import { relative, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"

export function fingerprintRulesSourceTree(root) {
  const absoluteRoot = resolve(root instanceof URL ? fileURLToPath(root) : root)
  return fingerprintRulesSources(collectSources(absoluteRoot, absoluteRoot))
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

function collectSources(root, directory) {
  const entries = []
  for (const item of fs.readdirSync(directory, { withFileTypes: true }).sort((left, right) => compareCodePoints(left.name, right.name))) {
    const absolutePath = resolve(directory, item.name)
    if (item.isDirectory()) {
      if (item.name !== "tests" && item.name !== "fixtures") entries.push(...collectSources(root, absolutePath))
      continue
    }
    if (!item.isFile() || !item.name.endsWith(".ts") || item.name.endsWith(".test.ts") || item.name.endsWith(".testWorker.ts")) {
      continue
    }
    entries.push({
      path: relative(root, absolutePath).split(sep).join("/"),
      content: fs.readFileSync(absolutePath, "utf8"),
    })
  }
  return entries
}

function compareCodePoints(left, right) {
  return left < right ? -1 : left > right ? 1 : 0
}
