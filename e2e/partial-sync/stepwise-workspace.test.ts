import { join, resolve } from "node:path"
import { describe, expect, it } from "vitest"
import { openStepwiseRunWorkspace } from "./stepwise-workspace"

describe("stepwise run workspace", () => {
  it("выделяет режимам непересекающиеся каталоги", async () => {
    const workspace = await openStepwiseRunWorkspace(join(runsRoot, "stepwise"), dependencies())

    expect(workspace.scenario("designer-agent").root)
      .not.toBe(workspace.scenario("standalone-server").root)
    expect(workspace.baselineDir).not.toContain("scenarios")
    expect(workspace.scenario("designer-agent").baseDir).toContain("designer-agent")
  })

  it.each([repositoryRoot, homeDir])("отвергает защищённый корень %s", async (root) => {
    await expect(openStepwiseRunWorkspace(root, dependencies())).rejects.toThrow("нельзя")
  })

  it("отвергает символическую ссылку и постороннее содержимое", async () => {
    await expect(openStepwiseRunWorkspace(join(runsRoot, "link"), dependencies({ kind: "symlink" })))
      .rejects.toThrow("символической")
    await expect(openStepwiseRunWorkspace(join(runsRoot, "foreign"), dependencies({ entries: ["notes.txt"] })))
      .rejects.toThrow("неизвестный")
  })
})

function dependencies(overrides: {
  readonly kind?: "missing" | "directory" | "symlink" | "file"
  readonly entries?: readonly string[]
} = {}) {
  return {
    repositoryRoot,
    homeDir,
    async pathKind() { return overrides.kind ?? "directory" as const },
    async canonicalize(path: string) { return path.toLowerCase() },
    async listEntries() { return overrides.entries ?? [] },
    async mkdir() {},
  }
}

const repositoryRoot = resolve("/repo")
const homeDir = resolve("/users/tester")
const runsRoot = resolve("/runs")
