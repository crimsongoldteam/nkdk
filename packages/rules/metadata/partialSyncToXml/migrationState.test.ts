import fs from "node:fs"
import os from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import {
  evaluatePartialXmlSyncMigrationState,
  partialXmlSyncAppliedMigrationsPath,
  publishPartialXmlSyncAppliedMigrations,
  readPartialXmlSyncAppliedMigrations,
} from "./migrationState"

describe("migration state частичной XML-синхронизации", () => {
  const tempDirs: string[] = []
  afterEach(() => tempDirs.splice(0).reverse()
    .forEach((dir) => fs.rmSync(dir, { recursive: true, force: true })))

  it("считает отсутствие component-local state пустым и не пишет кандидат при оценке", async () => {
    const { projectDir, componentDir } = project()
    const migrationName = "2026-06-30-120000.yaml"
    fs.mkdirSync(join(componentDir, "Миграции"), { recursive: true })
    fs.writeFileSync(join(componentDir, "Миграции", migrationName), '"Справочник.Старое": Новое\n')

    expect(await readPartialXmlSyncAppliedMigrations(projectDir, "cf")).toEqual([])
    const result = await evaluatePartialXmlSyncMigrationState({ projectDir, componentPath: "cf", componentDir })

    expect(result.pending.map(({ fileName }) => fileName)).toEqual([migrationName])
    expect(result.candidateAppliedNames).toEqual([migrationName])
    expect(fs.existsSync(partialXmlSyncAppliedMigrationsPath(projectDir, "cf"))).toBe(false)
  })

  it("исключает уже применённую migration и публикует состояние только отдельной операцией", async () => {
    const { projectDir, componentDir } = project()
    const applied = "2026-06-30-120000.yaml"
    const pending = "2026-06-30-120001.yaml"
    fs.mkdirSync(join(componentDir, "Миграции"), { recursive: true })
    fs.writeFileSync(join(componentDir, "Миграции", applied), '"Справочник.Старое": Текущее\n')
    fs.writeFileSync(join(componentDir, "Миграции", pending), '"Справочник.Текущее": Новое\n')
    await publishPartialXmlSyncAppliedMigrations({ projectDir, componentPath: "cf", applied: [applied] })

    const result = await evaluatePartialXmlSyncMigrationState({ projectDir, componentPath: "cf", componentDir })
    expect(result.pending.map(({ fileName }) => fileName)).toEqual([pending])
    expect(result.referencePathByCurrentPath.get("Справочник.Новое")).toBe("Справочник.Текущее")
    expect(await readPartialXmlSyncAppliedMigrations(projectDir, "cf")).toEqual([applied])

    await publishPartialXmlSyncAppliedMigrations({
      projectDir,
      componentPath: "cf",
      applied: result.candidateAppliedNames,
    })
    expect(await readPartialXmlSyncAppliedMigrations(projectDir, "cf")).toEqual([applied, pending])
  })

  function project(): { projectDir: string; componentDir: string } {
    const projectDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-partial-migrations-"))
    tempDirs.push(projectDir)
    const componentDir = join(projectDir, "cf")
    fs.mkdirSync(componentDir)
    return { projectDir, componentDir }
  }
})
