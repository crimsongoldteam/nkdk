import { expect, it } from "vitest"
import type { ProjectStateFileUpdate } from "../fileUpdate"
import { buildProjectStateSnapshot } from "./builder"
import { createProjectStateFragmentWriter, openProjectStateFragment } from "./fragment"
import { ProjectStateSnapshotView } from "./snapshot"
import { richYamlUpdate, yamlUpdate } from "./testData"

it("строит новый снимок из прежних файлов, фрагментов и удалений", () => {
  const first = buildProjectStateSnapshot({
    fragments: [fragment(yamlUpdate("cf/a.yaml", "cf", "Catalog.A"), 1n)],
    deletions: [],
  })
  const second = buildProjectStateSnapshot({
    base: first,
    fragments: [fragment(yamlUpdate("cf/b.yaml", "cf", "Catalog.B"), 2n)],
    deletions: ["cf/a.yaml"],
  })
  const view = new ProjectStateSnapshotView(second)

  expect(view.filePaths()).toEqual(["cf/b.yaml"])
  expect(view.lookupTarget("cf", "Catalog.A")).toEqual([])
  expect(view.lookupTarget("cf", "Catalog.B")).toHaveLength(1)
  expect(Object.values(view.hashIndexStats()).every(({ loadFactor }) => loadFactor <= 0.8)).toBe(true)
})

it("переиспользует все буферы снимка при отсутствии изменений", () => {
  const base = buildProjectStateSnapshot({
    fragments: [fragment(yamlUpdate("cf/a.yaml", "cf", "Catalog.A"), 1n)],
    deletions: [],
  })

  expect(buildProjectStateSnapshot({ base, fragments: [], deletions: [] })).toBe(base)
})

it("каскадно удаляет все типизированные вклады файла", () => {
  const base = buildProjectStateSnapshot({
    fragments: [fragment(richYamlUpdate("cf/a.yaml", "cf", "Catalog.A"), 1n)],
    deletions: [],
  })
  const result = buildProjectStateSnapshot({ base, fragments: [], deletions: ["cf/a.yaml"] })
  const view = new ProjectStateSnapshotView(result)

  expect(view.fileCount).toBe(0)
  expect(view.factTableRanges().every(({ records }) => records === 0)).toBe(true)
  expect(view.diagnosticCount).toBe(0)
  expect(view.lookupTarget("cf", "Catalog.A")).toEqual([])
})

it("не оставляет связанные строки таблиц удалённого файла рядом с сохранённым", () => {
  const retainedUpdate = richYamlUpdate("cf/b.yaml", "cf", "Catalog.B", "Ошибка Б")
  const base = buildProjectStateSnapshot({
    fragments: [fragment(richYamlUpdate("cf/a.yaml", "cf", "Catalog.A"), 1n), fragment(retainedUpdate, 2n)],
    deletions: [],
  })
  const retainedOnly = buildProjectStateSnapshot({ fragments: [fragment(retainedUpdate, 2n)], deletions: [] })

  const actual = new ProjectStateSnapshotView(
    buildProjectStateSnapshot({ base, fragments: [], deletions: ["cf/a.yaml"] }),
  )
  const expected = new ProjectStateSnapshotView(retainedOnly)

  expect(actual.factTableRanges().map(({ records }) => records)).toEqual(
    expected.factTableRanges().map(({ records }) => records),
  )
  expect(actual.diagnosticCount).toBe(expected.diagnosticCount)
  expect(actual.lookupTarget("cf", "Catalog.A")).toEqual([])
  expect(actual.lookupTarget("cf", "Catalog.B")).toHaveLength(1)
})

it("сохраняет идентификаторы прежних строк при обновлении, но не переносит их в холодную сборку", () => {
  const base = buildProjectStateSnapshot({
    fragments: [fragment(yamlUpdate("cf/a.yaml", "cf", "Catalog.Старая"), 1n)],
    deletions: [],
  })
  const oldView = new ProjectStateSnapshotView(base)
  const oldStringId = findString(oldView, "Catalog.Старая")
  const updatedView = new ProjectStateSnapshotView(buildProjectStateSnapshot({
    base,
    fragments: [fragment(yamlUpdate("cf/a.yaml", "cf", "Catalog.Новая"), 2n)],
    deletions: [],
  }))
  const coldView = new ProjectStateSnapshotView(buildProjectStateSnapshot({
    fragments: [fragment(yamlUpdate("cf/a.yaml", "cf", "Catalog.Новая"), 2n)],
    deletions: [],
  }))

  expect(updatedView.stringValue(oldStringId!)).toBe("Catalog.Старая")
  expect(findString(coldView, "Catalog.Старая")).toBeUndefined()
})

it("собирает снимок только из двоичных таблиц фрагмента", () => {
  const binary = fragment(yamlUpdate("cf/a.yaml", "cf", "Catalog.A"), 1n)
  const guarded = Object.defineProperty({ ...binary }, "update", {
    get() { throw new Error("Предметный update читать нельзя") },
  })

  expect(new ProjectStateSnapshotView(
    buildProjectStateSnapshot({ fragments: [guarded], deletions: [] }),
  ).filePaths()).toEqual(["cf/a.yaml"])
})

function fragment(update: ProjectStateFileUpdate, hash: bigint) {
  const writer = createProjectStateFragmentWriter()
  writer.appendFile(update, hash)
  return openProjectStateFragment(writer.finish())
}

function findString(view: ProjectStateSnapshotView, value: string): number | undefined {
  for (let id = 0; id < view.stringPool().count; id += 1) {
    if (view.stringValue(id) === value) return id
  }
  return undefined
}
