import { expect, it } from "vitest"
import { buildProjectStateSnapshot } from "./builder"
import { ProjectStateSnapshotView } from "./snapshot"
import { yamlUpdate } from "./testData"

it("строит новый снимок из прежних файлов, замен и удалений", () => {
  const first = buildProjectStateSnapshot({
    replacements: [{ update: yamlUpdate("cf/a.yaml", "cf", "Catalog.A"), hash: 1n }],
    deletions: [],
  })
  const second = buildProjectStateSnapshot({
    base: first,
    replacements: [{ update: yamlUpdate("cf/b.yaml", "cf", "Catalog.B"), hash: 2n }],
    deletions: ["cf/a.yaml"],
  })
  const view = new ProjectStateSnapshotView(second)

  expect(view.filePaths()).toEqual(["cf/b.yaml"])
  expect(view.lookupTarget("cf", "Catalog.A")).toEqual([])
  expect(view.lookupTarget("cf", "Catalog.B")).toHaveLength(1)
})
