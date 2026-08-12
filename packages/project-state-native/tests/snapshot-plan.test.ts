import { describe, expect, it } from "vitest"
import { buildProjectStateSnapshot } from "../../rules/metadata/projectState/binary/builder"
import { createProjectStateFragmentWriter, openProjectStateFragment } from "../../rules/metadata/projectState/binary/fragment"
import { richYamlUpdate } from "../../rules/metadata/projectState/binary/testData"
import { ProjectStateSnapshotView, type ProjectStateSharedBuffers } from "../../rules/metadata/projectState/binary/snapshot"
import { planProjectStateSnapshot, type ProjectStateSections } from "../index.js"

describe("Rust ProjectState snapshot plan", () => {
  it("строит снимок, который читает TypeScript", () => {
    const writer = createProjectStateFragmentWriter()
    writer.appendFile(richYamlUpdate("cf/Товары.yaml", "cf", "Catalog.Товары"), 17n)
    const fragment = writer.finish()
    const plan = planProjectStateSnapshot({
      fragments: [fragmentViews(fragment.buffers)],
      deletedProjectPaths: [],
    })
    const output = sharedOutput(plan.layout())
    const stats = plan.writeInto(sectionViews(output))

    const snapshot = new ProjectStateSnapshotView(output)
    expect(snapshot.filePaths()).toEqual(["cf/Товары.yaml"])
    expect(snapshot.lookupTarget("cf", "Catalog.Товары")).toHaveLength(1)
    expect(stats).toMatchObject({ files: 1 })
    expect(stats.temporaryBytes).toBeGreaterThan(0)
    expect(stats.copiedSnapshotBytes).toBe(stats.temporaryBytes)
    plan.close()
  })

  it("сохраняет семантическую совместимость всех секций", () => {
    const writer = createProjectStateFragmentWriter()
    writer.appendFile(richYamlUpdate("cf/Я.yaml", "cf", "Catalog.Я"), 23n)
    const fragment = writer.finish()
    const expected = buildProjectStateSnapshot({
      fragments: [openProjectStateFragment(fragment)],
      deletions: [],
    })
    const plan = planProjectStateSnapshot({ fragments: [fragmentViews(fragment.buffers)], deletedProjectPaths: [] })
    const actual = sharedOutput(plan.layout())
    plan.writeInto(sectionViews(actual))

    const expectedView = new ProjectStateSnapshotView(expected)
    const actualView = new ProjectStateSnapshotView(actual)
    expect(actualView.filePaths()).toEqual(expectedView.filePaths())
    expect(actualView.lookupTarget("cf", "Catalog.Я")).toEqual(expectedView.lookupTarget("cf", "Catalog.Я"))
    for (const section of ["header", "strings", "files", "facts", "lookups", "diagnostics"] as const) {
      expect(new Uint8Array(actual[section]), section).toEqual(new Uint8Array(expected[section]))
    }
    plan.close()
  })

  it("побайтово совпадает при замене, удалении и Unicode-путях", () => {
    const firstWriter = createProjectStateFragmentWriter()
    firstWriter.appendFile(richYamlUpdate("cf/😀.yaml", "cf", "Catalog.😀"), 1n)
    firstWriter.appendFile(richYamlUpdate("cf/ё.yaml", "cf", "Catalog.ё"), 2n)
    const first = firstWriter.finish()
    const base = buildProjectStateSnapshot({ fragments: [openProjectStateFragment(first)], deletions: [] })
    const nextWriter = createProjectStateFragmentWriter()
    nextWriter.appendFile(richYamlUpdate("cf/😀.yaml", "cf", "Catalog.Изменён"), 3n)
    const next = nextWriter.finish()
    const input = {
      base,
      fragments: [openProjectStateFragment(next)],
      deletions: ["cf/ё.yaml"],
    }
    const expected = buildProjectStateSnapshot(input)
    const plan = planProjectStateSnapshot({
      base: sectionViews(base),
      fragments: [fragmentViews(next.buffers)],
      deletedProjectPaths: input.deletions,
    })
    const actual = sharedOutput(plan.layout())
    plan.writeInto(sectionViews(actual))

    for (const section of ["header", "strings", "files", "facts", "lookups", "diagnostics"] as const) {
      expect(new Uint8Array(actual[section]), section).toEqual(new Uint8Array(expected[section]))
    }
    expect(() => plan.writeInto(sectionViews(actual))).toThrow(/PLAN_CONSUMED/u)
    plan.close()
  })
})

function fragmentViews(buffers: {
  readonly header: ArrayBuffer
  readonly strings: ArrayBuffer
  readonly files: ArrayBuffer
  readonly facts: ArrayBuffer
  readonly diagnostics: ArrayBuffer
}) {
  return Object.fromEntries(Object.entries(buffers).map(([name, buffer]) => [name, new Uint8Array(buffer)])) as never
}

function sectionViews(buffers: ProjectStateSharedBuffers): ProjectStateSections {
  return Object.fromEntries(Object.entries(buffers).map(([name, buffer]) => [name, new Uint8Array(buffer)])) as never
}

function sharedOutput(layout: ReturnType<ReturnType<typeof planProjectStateSnapshot>["layout"]>): ProjectStateSharedBuffers {
  return Object.fromEntries(Object.entries(layout).map(([name, byteLength]) => [name, new SharedArrayBuffer(byteLength)])) as unknown as ProjectStateSharedBuffers
}
