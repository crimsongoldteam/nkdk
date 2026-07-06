import { readFileSync } from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"

describe("projectValidationWorker imports", () => {
  it("does not import model YAML conversion or core registration directly", () => {
    const source = readFileSync(join(__dirname, "projectValidationWorker.ts"), "utf8")

    expect(source).not.toContain("fromYAML")
    expect(source).not.toContain("registerCoreMetadata")
  })
})
