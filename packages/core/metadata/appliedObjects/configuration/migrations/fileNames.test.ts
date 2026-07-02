import fs from "fs"
import { mkdtempSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { listMigrationFileNames, migrationFileNameToDate, nextMigrationFileName } from "./fileNames"

describe("migration file names", () => {
  it("lists only exact UTC timestamp yaml names in sorted order", () => {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-migrations-"))
    fs.mkdirSync(join(dir, "Миграции"))
    fs.writeFileSync(join(dir, "Миграции", "2026-05-05-143000.yaml"), "")
    fs.writeFileSync(join(dir, "Миграции", "2026-05-05-142959.yaml"), "")
    fs.writeFileSync(join(dir, "Миграции", "2026-05-05-143000-note.yaml"), "")
    fs.writeFileSync(join(dir, "Миграции", "2026-05-05-143001.YAML"), "")

    expect(listMigrationFileNames(dir)).toEqual(["2026-05-05-142959.yaml", "2026-05-05-143000.yaml"])
  })

  it("rejects impossible UTC timestamp names", () => {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-migrations-"))
    fs.mkdirSync(join(dir, "Миграции"))
    fs.writeFileSync(join(dir, "Миграции", "2026-05-05-143000.yaml"), "")
    fs.writeFileSync(join(dir, "Миграции", "2026-02-31-000000.yaml"), "")
    fs.writeFileSync(join(dir, "Миграции", "2026-05-05-246000.yaml"), "")

    expect(listMigrationFileNames(dir)).toEqual(["2026-05-05-143000.yaml"])
    expect(() => migrationFileNameToDate("2026-02-31-000000.yaml")).toThrow(
      "Некорректное имя миграции: 2026-02-31-000000.yaml"
    )
    expect(() => migrationFileNameToDate("2026-05-05-246000.yaml")).toThrow(
      "Некорректное имя миграции: 2026-05-05-246000.yaml"
    )
  })

  it("uses max(now utc, latest migration + one second)", () => {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-migrations-"))
    fs.mkdirSync(join(dir, "Миграции"))
    fs.writeFileSync(join(dir, "Миграции", "2026-05-05-143000.yaml"), "")

    expect(nextMigrationFileName(dir, new Date("2026-05-05T09:00:00.000Z"))).toBe("2026-05-05-143001.yaml")
    expect(nextMigrationFileName(dir, new Date("2026-05-05T15:00:00.000Z"))).toBe("2026-05-05-150000.yaml")
  })
})
