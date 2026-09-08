import { expect, it } from "vitest"
import type { ProjectStateFileUpdate } from "../fileUpdate"
import { buildProjectStateSnapshot } from "./builder"
import { createProjectStateFragmentWriter, openProjectStateFragment } from "./fragment"
import { ProjectStateSnapshotView } from "./snapshot"
import { createTypedProjectStateReader } from "./typedReader"
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
  expect(view.stringPool().count).toBe(0)
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
  const actualReader = createTypedProjectStateReader(actual)
  const expectedReader = createTypedProjectStateReader(expected)
  expect(actualReader.yamlFacts(0)).toEqual(expectedReader.yamlFacts(0))
  expect(actualReader.yamlFacts(0)).toMatchObject({
    owners: [{ owner: { kind: "Справочник", name: "Catalog.B" } }],
    pendingReferences: [{ canonical: "Catalog.Товары" }],
    fields: [{ name: "Код" }, { name: "Описание" }, { name: "Артикул" }],
  })
  expect(findString(actual, "Ошибка")).toBeUndefined()
  expect(findString(actual, "Ошибка Б")).toBeDefined()
})

it("удаляет неиспользуемые строки нового снимка, не изменяя старого читателя", () => {
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

  expect(findString(updatedView, "Catalog.Старая")).toBeUndefined()
  expect(findString(updatedView, "Catalog.Новая")).toBeDefined()
  expect(oldView.stringValue(oldStringId!)).toBe("Catalog.Старая")
  expect(findString(coldView, "Catalog.Старая")).toBeUndefined()
})

it("не переносит строки замещённого фрагмента и сохраняет общие живые строки", () => {
  const base = buildProjectStateSnapshot({
    fragments: [fragment(yamlUpdate("cf/b.yaml", "cf", "Catalog.Общая"), 1n)], deletions: [],
  })
  const view = new ProjectStateSnapshotView(buildProjectStateSnapshot({
    base,
    fragments: [
      fragment(yamlUpdate("cf/a.yaml", "cf", "Catalog.Заменённая"), 2n),
      fragment(yamlUpdate("cf/a.yaml", "cf", "Catalog.Общая"), 3n),
    ], deletions: [],
  }))
  expect(findString(view, "Catalog.Заменённая")).toBeUndefined()
  expect(view.lookupTarget("cf", "Catalog.Общая")).toHaveLength(2)
})

it("не накапливает строки предыдущих версий при повторных заменах файла", () => {
  let snapshot = buildProjectStateSnapshot({ fragments: [], deletions: [] })
  let previousCount: number | undefined
  for (let version = 0; version < 8; version++) {
    snapshot = buildProjectStateSnapshot({
      base: snapshot, fragments: [fragment(yamlUpdate("cf/a.yaml", "cf", `Catalog.Версия${version}`), BigInt(version))],
      deletions: [],
    })
    const view = new ProjectStateSnapshotView(snapshot)
    expect(view.lookupTarget("cf", `Catalog.Версия${version}`)).toHaveLength(1)
    if (previousCount !== undefined) {
      expect(view.stringPool().count).toBe(previousCount)
      expect(findString(view, `Catalog.Версия${version - 1}`)).toBeUndefined()
    }
    previousCount = view.stringPool().count
  }
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

it("находит каждый файл при смешанном латинском и кириллическом порядке путей", () => {
  const paths = [
    "cf/WSСсылка/Свойства.yaml",
    "cf/WebСервис/Свойства.yaml",
    "cf/ОбщаяФорма/Свойства.yaml",
  ]
  const snapshot = new ProjectStateSnapshotView(buildProjectStateSnapshot({
    fragments: paths.map((path, index) => fragment({
      kind: "resource",
      projectPath: path,
      componentPath: "cf",
      resourceKind: "resource",
      targets: [],
    }, BigInt(index + 1))),
    deletions: [],
  }))

  expect(paths.map((path) => snapshot.findFile(path))).not.toContain(undefined)
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
