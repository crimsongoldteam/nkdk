import fs from "node:fs"
import { join, relative } from "node:path"
import { findForbiddenUnitTestDependencies } from "./unit-test-dependency-boundaries.mjs"

const skippedDirectories = new Set([".git", ".worktrees", "coverage", "dist", "node_modules"])
const sourceFilePattern = /\.[cm]?[jt]sx?$/u

export function checkUnitTestDependencies(projectRoot) {
  const packagesDir = join(projectRoot, "packages")
  const files = readSourceFiles(projectRoot, packagesDir)
  return findForbiddenUnitTestDependencies(files)
}

function readSourceFiles(projectRoot, directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (skippedDirectories.has(entry.name) || entry.isSymbolicLink()) return []
    const absolutePath = join(directory, entry.name)
    if (entry.isDirectory()) return readSourceFiles(projectRoot, absolutePath)
    if (!entry.isFile() || !sourceFilePattern.test(entry.name)) return []
    return [{
      file: relative(projectRoot, absolutePath).replaceAll("\\", "/"),
      source: fs.readFileSync(absolutePath, "utf8"),
    }]
  })
}

const violations = checkUnitTestDependencies(process.cwd())
for (const violation of violations) {
  process.stderr.write(`${violation.file}: ${violation.category}: ${violation.specifier}\n`)
}
if (violations.length > 0) {
  process.stderr.write(`Найдено запрещённых зависимостей unit-тестов: ${violations.length}\n`)
  process.exitCode = 1
}
