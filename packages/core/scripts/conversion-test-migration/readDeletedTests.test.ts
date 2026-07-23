import { execFileSync } from "node:child_process"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"

import { readDeletedTests } from "./readDeletedTests"

const temporaryRepositories: string[] = []

afterEach(() => {
  for (const directory of temporaryRepositories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

describe("readDeletedTests", () => {
  it("читает удалённый тест из родителя удаляющего коммита", () => {
    const repository = createRepository()
    const sourceText = 'import { it } from "vitest"\nit("сценарий", () => {})\n'
    const base = commitFile(repository, "metadata/fromXML.test.ts", sourceText, "add test")
    removeFile(repository, "metadata/fromXML.test.ts", "delete test")

    const [deleted] = readDeletedTests(`${base}..HEAD`, repository)

    expect(deleted).toMatchObject({
      parentCommit: base,
      path: "metadata/fromXML.test.ts",
      sourceText,
    })
    expect(deleted?.deletingCommit).toMatch(/^[0-9a-f]{40}$/)
  })

  it("не объединяет два удаления одного пути", () => {
    const repository = createRepository()
    const path = "metadata/toXML.test.ts"
    const base = commitFile(repository, path, 'it("первая версия", () => {})\n', "add first")
    removeFile(repository, path, "delete first")
    commitFile(repository, path, 'it("вторая версия", () => {})\n', "restore second")
    removeFile(repository, path, "delete second")

    const deleted = readDeletedTests(`${base}..HEAD`, repository)

    expect(deleted).toHaveLength(2)
    expect(deleted.map((entry) => entry.sourceText)).toEqual([
      'it("первая версия", () => {})\n',
      'it("вторая версия", () => {})\n',
    ])
    expect(new Set(deleted.map((entry) => entry.deletingCommit))).toHaveLength(2)
  })
})

function createRepository(): string {
  const repository = mkdtempSync(join(tmpdir(), "nkdk-test-migration-"))
  temporaryRepositories.push(repository)
  git(repository, "init", "--initial-branch=develop")
  git(repository, "config", "user.email", "tests@example.com")
  git(repository, "config", "user.name", "Tests")
  return repository
}

function commitFile(repository: string, path: string, content: string, message: string): string {
  const fullPath = join(repository, path)
  mkdirSync(join(fullPath, ".."), { recursive: true })
  writeFileSync(fullPath, content)
  git(repository, "add", path)
  git(repository, "commit", "-m", message)
  return git(repository, "rev-parse", "HEAD").trim()
}

function removeFile(repository: string, path: string, message: string): void {
  git(repository, "rm", path)
  git(repository, "commit", "-m", message)
}

function git(repository: string, ...args: string[]): string {
  return execFileSync("git", ["-C", repository, ...args], { encoding: "utf8" })
}
