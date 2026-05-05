import fs from "fs"
import { mkdtempSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { readAppliedMigrationsState, writeAppliedMigrationsState } from "./stateFile"

describe("applied migrations state", () => {
  it("returns empty state when file does not exist", () => {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-xml-"))
    expect(readAppliedMigrationsState(dir)).toEqual({ applied: [] })
  })

  it("writes and reads applied names in application order", () => {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-xml-"))
    writeAppliedMigrationsState(dir, {
      applied: ["2026-05-05-143000.yaml", "2026-05-05-143001.yaml"],
    })

    expect(fs.readFileSync(join(dir, ".nakidka-migrations.yaml"), "utf-8")).toBe(
      "applied:\n  - 2026-05-05-143000.yaml\n  - 2026-05-05-143001.yaml\n",
    )
    expect(readAppliedMigrationsState(dir)).toEqual({
      applied: ["2026-05-05-143000.yaml", "2026-05-05-143001.yaml"],
    })
  })

  it("rejects malformed state", () => {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-xml-"))
    fs.writeFileSync(join(dir, ".nakidka-migrations.yaml"), "applied:\n  - bad-name.yaml\n")

    expect(() => readAppliedMigrationsState(dir)).toThrow('Некорректное имя применённой миграции "bad-name.yaml"')
  })

  it("rejects duplicate applied names", () => {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-xml-"))
    fs.writeFileSync(
      join(dir, ".nakidka-migrations.yaml"),
      "applied:\n  - 2026-05-05-143000.yaml\n  - 2026-05-05-143000.yaml\n",
    )

    expect(() => readAppliedMigrationsState(dir)).toThrow('Дубликат применённой миграции "2026-05-05-143000.yaml"')
  })
})
