import { describe, expect, it } from "vitest"
import type { RuleSourceEdit } from "./sourceModel"
import { applyRuleSourceEdits } from "./rewrite"

const edits = (files: ReadonlyMap<string, string>): RuleSourceEdit[] =>
  [...files].map(([filePath, originalText]) => ({
    filePath,
    originalText,
    updatedText: `updated:${originalText}`,
    candidates: [`${filePath}#Rules`],
  }))

describe("applyRuleSourceEdits", () => {
  it("restores only its own files when verification fails", async () => {
    const files = new Map([
      ["/rules/a.ts", "original-a"],
      ["/rules/b.ts", "original-b"],
    ])

    await expect(
      applyRuleSourceEdits({
        edits: edits(files),
        readFile: async (path) => files.get(path)!,
        writeFile: async (path, text) => void files.set(path, text),
        verify: async () => {
          throw new Error("verification failed")
        },
      })
    ).rejects.toThrow("verification failed")

    expect(files).toEqual(
      new Map([
        ["/rules/a.ts", "original-a"],
        ["/rules/b.ts", "original-b"],
      ])
    )
  })

  it("writes files bytewise by path and verifies them", async () => {
    const files = new Map([
      ["/rules/z.ts", "z"],
      ["/rules/a.ts", "a"],
    ])
    const writes: string[] = []
    let verified = false

    await applyRuleSourceEdits({
      edits: edits(files),
      readFile: async (path) => files.get(path)!,
      writeFile: async (path, text) => {
        writes.push(path)
        files.set(path, text)
      },
      verify: async () => {
        verified = true
      },
    })

    expect(writes).toEqual(["/rules/a.ts", "/rules/z.ts"])
    expect(verified).toBe(true)
    expect(files.get("/rules/a.ts")).toBe("updated:a")
  })

  it("refuses to overwrite a file changed after planning", async () => {
    const planned = new Map([["/rules/a.ts", "original"]])
    const files = new Map([["/rules/a.ts", "changed"]])

    await expect(
      applyRuleSourceEdits({
        edits: edits(planned),
        readFile: async (path) => files.get(path)!,
        writeFile: async (path, text) => void files.set(path, text),
        verify: async () => undefined,
      })
    ).rejects.toThrow(/измен/)

    expect(files.get("/rules/a.ts")).toBe("changed")
  })
})
