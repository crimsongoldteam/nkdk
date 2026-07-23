import { describe, expect, it } from "vitest"

import type { DeletedScenario, MigrationRow } from "./types"
import { buildMigrationMap } from "./buildMap"

describe("buildMigrationMap", () => {
  it("вычисляет целевой файл для парных и самостоятельных тестов", () => {
    const rows = buildMigrationMap([
      scenario("xml", "metadata/object/fromXML.test.ts", "fromXML"),
      scenario("yaml", "metadata/object/toYAML.test.ts", "toYAML"),
      scenario("from-yaml", "metadata/object/fromYAML.test.ts", "fromYAML"),
      scenario("to-xml", "metadata/object/toXML.test.ts", "toXML"),
      scenario("sync", "metadata/object/syncExternal.test.ts", "standalone"),
    ])

    expect(rows.map(({ targetPath }) => targetPath)).toEqual([
      "metadata/object/fromXMLToYAML.test.ts",
      "metadata/object/fromXMLToYAML.test.ts",
      "metadata/object/fromYAMLToXML.test.ts",
      "metadata/object/fromYAMLToXML.test.ts",
      "metadata/object/syncExternal.test.ts",
    ])
    expect(rows.every(({ status }) => status === "pending")).toBe(true)
  })

  it("сохраняет заполненное решение при повторной сборке", () => {
    const original = scenario("xml", "metadata/object/fromXML.test.ts", "fromXML")
    const existing: MigrationRow = {
      ...original,
      behavior: "итоговое значение",
      targetPath: "metadata/object/custom.test.ts",
      targetTitle: "перенесённый сценарий",
      status: "migrated",
    }
    const changedSource = { ...original, oldTitle: "уточнённый исходный заголовок" }

    expect(buildMigrationMap([changedSource], [existing])).toEqual([
      {
        ...changedSource,
        behavior: "итоговое значение",
        targetPath: "metadata/object/custom.test.ts",
        targetTitle: "перенесённый сценарий",
        status: "migrated",
      },
    ])
  })
})

function scenario(id: string, sourcePath: string, direction: DeletedScenario["direction"]): DeletedScenario {
  return {
    id,
    deletingCommit: "delete",
    parentCommit: "parent",
    sourcePath,
    direction,
    oldTitle: id,
    declarationText: `it("${id}", () => {})`,
    fixtures: [],
    line: 1,
  }
}
