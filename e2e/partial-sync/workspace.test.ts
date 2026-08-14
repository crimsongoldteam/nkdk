import { mkdtemp, mkdir, readFile, realpath, symlink, writeFile } from "node:fs/promises"
import { homedir, tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { describe, expect, it } from "vitest"
import { openScenarioWorkspace, readState } from "./workspace"

const planHash = "a".repeat(64)

describe("partial sync workspace", () => {
  it("initializes an empty absolute directory with matrix state", async () => {
    const root = await temporaryRoot()

    const workspace = await openScenarioWorkspace(root, { planHash, reset: false })

    expect(workspace.root).toBe(await realpath(root))
    expect(await readState(root)).toEqual({
      version: 2,
      scenario: "partial-sync-matrix",
      completedOperation: null,
      checkpoint: null,
      planHash,
    })
  })

  it.each([
    ["a relative path", "relative/workspace"],
    ["the filesystem root", "/"],
    ["the home directory", homedir()],
    ["the repository root", resolve(import.meta.dirname, "../..")],
  ])("rejects %s", async (_name, root) => {
    await expect(openScenarioWorkspace(root, { planHash, reset: false }))
      .rejects.toThrow(/каталог сценария/iu)
  })

  it("rejects an unmarked non-empty directory without changing it", async () => {
    const root = await temporaryRoot("foreign-")
    await writeFile(join(root, "foreign.txt"), "keep")

    await expect(openScenarioWorkspace(root, { planHash, reset: true }))
      .rejects.toThrow(/не принадлежит сценарию/u)

    await expect(readFile(join(root, "foreign.txt"), "utf8")).resolves.toBe("keep")
  })

  it("rejects a symbolic-link root", async () => {
    const parent = await temporaryRoot("link-")
    const target = join(parent, "target")
    const link = join(parent, "link")
    await mkdir(target)
    await symlink(target, link)

    await expect(openScenarioWorkspace(link, { planHash, reset: false }))
      .rejects.toThrow(/символическ/u)
  })

  it("rejects a broken symbolic link in a managed path", async () => {
    const root = await temporaryRoot("managed-link-")
    await writeState(root, matrixState(planHash))
    await symlink(join(root, "missing"), join(root, "base"))

    await expect(openScenarioWorkspace(root, { planHash, reset: true }))
      .rejects.toThrow(/символическ/u)
  })

  it("rejects a different plan hash without changing data", async () => {
    const root = await temporaryRoot("hash-")
    await writeState(root, matrixState("b".repeat(64)))
    await mkdir(join(root, "base"))
    await writeFile(join(root, "base", "keep.txt"), "keep")

    await expect(openScenarioWorkspace(root, { planHash, reset: false }))
      .rejects.toThrow(/хэш|план/iu)

    await expect(readFile(join(root, "base", "keep.txt"), "utf8")).resolves.toBe("keep")
  })

  it("migrates recognized legacy state only with reset and preserves logs", async () => {
    const root = await temporaryRoot("legacy-")
    await writeState(root, {
      version: 1,
      scenario: "partial-sync-catalog-attribute",
      completedStage: "03-attribute",
      checkpoint: "checkpoints/03-attribute",
    })
    for (const name of ["base", "data", "project", "checkpoints", "verification", "logs"]) {
      await mkdir(join(root, name))
      await writeFile(join(root, name, "marker.txt"), name)
    }

    await expect(openScenarioWorkspace(root, { planHash, reset: false })).rejects.toThrow(/верс|состояни/iu)
    await openScenarioWorkspace(root, { planHash, reset: true })

    await expect(readFile(join(root, "logs", "marker.txt"), "utf8")).resolves.toBe("logs")
    for (const name of ["base", "data", "project", "checkpoints", "verification"]) {
      await expect(readFile(join(root, name, "marker.txt"), "utf8")).rejects.toMatchObject({ code: "ENOENT" })
    }
    expect(await readState(root)).toEqual(matrixState(planHash))
  })

  it("does not treat unknown JSON as permission to reset", async () => {
    const root = await temporaryRoot("unknown-state-")
    await writeState(root, { version: 99, scenario: "foreign" })
    await mkdir(join(root, "base"))
    await writeFile(join(root, "base", "keep.txt"), "keep")

    await expect(openScenarioWorkspace(root, { planHash, reset: true }))
      .rejects.toThrow(/повреждено|неизвестн/iu)
    await expect(readFile(join(root, "base", "keep.txt"), "utf8")).resolves.toBe("keep")
  })
})

function temporaryRoot(suffix = ""): Promise<string> {
  return mkdtemp(join(tmpdir(), `nkdk-partial-sync-${suffix}`))
}

function matrixState(hash: string) {
  return {
    version: 2,
    scenario: "partial-sync-matrix",
    completedOperation: null,
    checkpoint: null,
    planHash: hash,
  } as const
}

async function writeState(root: string, state: object): Promise<void> {
  await writeFile(join(root, "state.json"), JSON.stringify(state))
}
