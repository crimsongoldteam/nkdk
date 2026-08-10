import { access } from "node:fs/promises"
import { join, resolve } from "node:path"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import {
  E2E_COMPONENTS,
  cloneImportedProject,
  importMetadataProject,
  removeImportedProject,
  roundTripMetadataProject,
  validateChangedProject,
  validateCleanProject,
  type ImportedMetadataProject,
} from "./support/metadata-project"

let baseline: ImportedMetadataProject | undefined

describe.sequential("metadata project E2E", () => {
  beforeAll(async () => {
    baseline = await importMetadataProject()
  })

  afterAll(async () => {
    if (baseline !== undefined) await removeImportedProject(baseline)
  })

  it("imports cf and every cfe with real workers", async () => {
    if (baseline === undefined) throw new Error("E2E import prerequisite did not complete")
    expect(baseline.results.map((result) => result.componentPath))
      .toEqual(E2E_COMPONENTS.map(({ componentPath }) => componentPath))
    for (const result of baseline.results) {
      expect(result.failed).toEqual([])
      expect(result.succeeded).toBeGreaterThan(0)
      expect(result.configurationIndexPath).toBeDefined()
    }
    for (const { componentPath } of E2E_COMPONENTS) {
      await expect(access(join(baseline.projectDir, componentPath, "Конфигурация.yaml")))
        .resolves.toBeUndefined()
    }
    await expect(access(join(baseline.projectDir, ".nkdk"))).resolves.toBeUndefined()
    console.info("E2E import durations, ms", baseline.durationsMs)
  })

  it("validates a clean project and reports the same changed YAML without .nkdk", async () => {
    if (baseline === undefined) throw new Error("E2E import prerequisite did not complete")
    const projectDir = await cloneImportedProject(baseline, "validation")
    const clean = await validateCleanProject(projectDir)
    const result = await validateChangedProject(projectDir)

    expect(result.cold).toEqual(result.warm)
    expect(clean).toEqual([])
    expect(result.warm).toHaveLength(1)
    expect(result.warm[0]).toMatchObject({
      filePath: "cf/Конфигурация.yaml",
      severity: "error",
      source: "structure",
    })
    expect(result.warm[0]?.message).toContain("НеизвестноеПолеE2E")
    console.info("E2E validation durations, ms", result.durationsMs)
  })

  it("restores every XML component byte for byte after YAML", async () => {
    if (baseline === undefined) throw new Error("E2E import prerequisite did not complete")
    const projectDir = await cloneImportedProject(baseline, "round-trip")
    const reportRoot = resolve(import.meta.dirname, "../reports/e2e/round-trip")
    const results = await roundTripMetadataProject({ projectDir, reportRoot })

    expect(results.map(({ component }) => component.componentPath))
      .toEqual(E2E_COMPONENTS.map(({ componentPath }) => componentPath))
    for (const result of results) {
      expect.soft(result.sync.failed).toEqual([])
      expect.soft(result.comparison, result.comparison.reportDir).toMatchObject({
        equal: true,
        added: [],
        removed: [],
        changed: [],
      })
    }
    console.table(results.map(({ component, durationMs }) => ({
      component: component.componentPath,
      durationMs,
    })))
  })
})
