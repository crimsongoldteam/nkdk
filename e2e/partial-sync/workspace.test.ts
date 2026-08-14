import { homedir } from "node:os"
import { mkdtemp, mkdir, readFile, realpath, symlink, writeFile } from "node:fs/promises"
import { join, resolve } from "node:path"
import { tmpdir } from "node:os"
import { describe, expect, it } from "vitest"
import { openScenarioWorkspace, readState } from "./workspace"

describe("partial sync workspace", () => {
  it("initializes an empty absolute directory", async () => {
    const root = await mkdtemp(join(tmpdir(), "nkdk-partial-sync-"))

    const workspace = await openScenarioWorkspace(root)

    expect(workspace.root).toBe(await realpath(root))
    expect(await readState(root)).toEqual({
      version: 1,
      scenario: "partial-sync-catalog-attribute",
      completedStage: null,
      checkpoint: null,
    })
    await expect(readFile(workspace.statePath, "utf8")).resolves.toContain(
      "partial-sync-catalog-attribute"
    )
  })

  it.each([
    ["a relative path", "relative/workspace"],
    ["the filesystem root", "/"],
    ["the home directory", homedir()],
    ["the repository root", resolve(import.meta.dirname, "../..")],
  ])("rejects %s", async (_name, root) => {
    await expect(openScenarioWorkspace(root)).rejects.toThrow(/каталог сценария/iu)
  })

  it("rejects an unmarked non-empty directory without changing it", async () => {
    const root = await mkdtemp(join(tmpdir(), "nkdk-partial-sync-foreign-"))
    await writeFile(join(root, "foreign.txt"), "keep")

    await expect(openScenarioWorkspace(root)).rejects.toThrow(/не принадлежит сценарию/u)

    await expect(readFile(join(root, "foreign.txt"), "utf8")).resolves.toBe("keep")
  })

  it("rejects a symbolic-link root", async () => {
    const parent = await mkdtemp(join(tmpdir(), "nkdk-partial-sync-link-"))
    const target = join(parent, "target")
    const link = join(parent, "link")
    await mkdir(target)
    await symlink(target, link)

    await expect(openScenarioWorkspace(link)).rejects.toThrow(/символическ/u)
  })

  it("rejects a broken symbolic link in a managed path", async () => {
    const root = await mkdtemp(join(tmpdir(), "nkdk-partial-sync-managed-link-"))
    await writeFile(join(root, "state.json"), JSON.stringify({
      version: 1,
      scenario: "partial-sync-catalog-attribute",
      completedStage: null,
      checkpoint: null,
    }))
    await symlink(join(root, "missing"), join(root, "base"))

    await expect(openScenarioWorkspace(root)).rejects.toThrow(/символическ/u)
  })
})
