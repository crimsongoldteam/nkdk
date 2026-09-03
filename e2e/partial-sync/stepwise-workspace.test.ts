import { describe, expect, it } from "vitest"
import { openStepwiseRunWorkspace } from "./stepwise-workspace"

describe("stepwise run workspace", () => {
  it("выделяет режимам непересекающиеся каталоги", async () => {
    const workspace = await openStepwiseRunWorkspace("C:\\runs\\stepwise", dependencies())

    expect(workspace.scenario("designer-agent").root)
      .not.toBe(workspace.scenario("standalone-server").root)
    expect(workspace.baselineDir).not.toContain("scenarios")
    expect(workspace.scenario("designer-agent").baseDir).toContain("designer-agent")
  })

  it.each(["C:\\repo", "C:\\users\\tester"])("отвергает защищённый корень %s", async (root) => {
    await expect(openStepwiseRunWorkspace(root, dependencies())).rejects.toThrow("нельзя")
  })

  it("отвергает символическую ссылку и постороннее содержимое", async () => {
    await expect(openStepwiseRunWorkspace("C:\\runs\\link", dependencies({ kind: "symlink" })))
      .rejects.toThrow("символической")
    await expect(openStepwiseRunWorkspace("C:\\runs\\foreign", dependencies({ entries: ["notes.txt"] })))
      .rejects.toThrow("неизвестный")
  })
})

function dependencies(overrides: {
  readonly kind?: "missing" | "directory" | "symlink" | "file"
  readonly entries?: readonly string[]
} = {}) {
  return {
    repositoryRoot: "C:\\repo",
    homeDir: "C:\\users\\tester",
    async pathKind() { return overrides.kind ?? "directory" as const },
    async canonicalize(path: string) { return path.toLowerCase() },
    async listEntries() { return overrides.entries ?? [] },
    async mkdir() {},
  }
}
