import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { FullXmlSyncResult } from "@nkdk/runtime"
import { cloneNkdkFixtureProject, compareSuccessfulSync } from "./metadata-project"

const roots: string[] = []

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

it("copies the NKDK fixture without exposing the committed tree to writes", async () => {
  const root = await mkdtemp(join(tmpdir(), "nkdk-clone-test-"))
  roots.push(root)
  const fixtureRoot = join(root, "fixture")
  const fixturePath = join(fixtureRoot, "cf", "Конфигурация.yaml")
  await mkdir(dirname(fixturePath), { recursive: true })
  await writeFile(fixturePath, "Имя: Эталон\n")
  const owner = { root: join(root, "owner") }
  await mkdir(owner.root, { recursive: true })

  const projectDir = await cloneNkdkFixtureProject(owner, "round-trip", fixtureRoot)
  await writeFile(join(projectDir, "cf", "Конфигурация.yaml"), "Имя: Копия\n")

  await expect(readFile(fixturePath, "utf8")).resolves.toBe("Имя: Эталон\n")
})

describe("compareSuccessfulSync", () => {
  it("не сравнивает деревья после неуспешного sync", async () => {
    const compare = vi.fn()

    await expect(compareSuccessfulSync({
      sync: syncResult([{ severity: "error", code: "sync-failed", message: "Ошибка sync" }]),
      expectedDir: "/expected",
      actualDir: "/actual",
      reportDir: "/report",
      compare,
    })).resolves.toEqual({ kind: "syncFailed" })
    expect(compare).not.toHaveBeenCalled()
  })

  it("возвращает сравнение после успешного sync", async () => {
    const comparison = { equal: true, added: [], removed: [], changed: [] }
    const compare = vi.fn(async () => comparison)

    await expect(compareSuccessfulSync({
      sync: syncResult(),
      expectedDir: "/expected",
      actualDir: "/actual",
      reportDir: "/report",
      compare,
    })).resolves.toEqual({ kind: "compared", comparison })
    expect(compare).toHaveBeenCalledWith({
      expectedDir: "/expected",
      actualDir: "/actual",
      reportDir: "/report",
    })
  })
})

function syncResult(failed: FullXmlSyncResult["failed"] = []): FullXmlSyncResult {
  return { succeeded: 1, failed, warnings: [], diagnostics: failed }
}
