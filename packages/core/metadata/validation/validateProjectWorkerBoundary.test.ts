import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

describe("validation worker boundary", () => {
  it("does not bypass the worker pool for concurrency one", () => {
    const source = readFileSync(new URL("../project/preparedYamlProjectWorkerPool.ts", import.meta.url), "utf8")

    expect(source).not.toContain("params.concurrency === 1")
  })

  it("does not run partial validation in the main process", () => {
    const source = readFileSync(new URL("./validateProject.ts", import.meta.url), "utf8")

    expect(source).not.toContain("validateProjectInProcess")
  })
})
