import { execFileSync } from "node:child_process"

import type { DeletedTestSource } from "./types"

export function readDeletedTests(range: string, repositoryRoot = process.cwd()): DeletedTestSource[] {
  return lines(git(repositoryRoot, "rev-list", "--reverse", range)).flatMap((deletingCommit) => {
    const parentCommit = git(repositoryRoot, "rev-parse", `${deletingCommit}^`).trim()
    const deletedPaths = lines(
      git(
        repositoryRoot,
        "diff-tree",
        "--no-commit-id",
        "--name-only",
        "--diff-filter=D",
        "-r",
        deletingCommit,
        "--",
        "*.test.ts"
      )
    )

    return deletedPaths.map((path) => ({
      deletingCommit,
      parentCommit,
      path,
      sourceText: git(repositoryRoot, "show", `${parentCommit}:${path}`),
    }))
  })
}

function git(repositoryRoot: string, ...args: string[]): string {
  return execFileSync("git", ["-C", repositoryRoot, ...args], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  })
}

function lines(value: string): string[] {
  return value.split("\n").filter((line) => line.length > 0)
}
