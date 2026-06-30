import { describe, expect, it } from "vitest"
import { fileItemCollectionTarget, namedCollectionTarget } from "./operationTargets"

describe("operation target declarations", () => {
  it("creates named collection target declarations", () => {
    expect(namedCollectionTarget({ kind: "attribute", migrationSegment: "Реквизит", requiresMigration: true })).toEqual({
      kind: "namedCollectionTarget",
      targetKind: "attribute",
      migrationSegment: "Реквизит",
      requiresMigration: true,
    })
  })

  it("creates file item target declarations", () => {
    expect(fileItemCollectionTarget({ role: "form", folderName: "Формы", yamlFileName: "Форма.yaml" })).toEqual({
      kind: "fileItemCollectionTarget",
      role: "form",
      folderName: "Формы",
      yamlFileName: "Форма.yaml",
      requiresMigration: false,
    })
  })
})
