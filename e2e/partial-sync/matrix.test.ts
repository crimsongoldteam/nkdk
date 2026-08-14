import { isAbsolute } from "node:path"
import { describe, expect, it } from "vitest"
import { TopLevelMetadataItemRules } from "../../packages/rules/metadata/appliedObjects/configuration/topLevelRules"
import { rootObjectDeclarations } from "./matrix/root-objects"

describe("partial sync matrix", () => {
  it("covers every registered top-level metadata type exactly once", () => {
    expect(new Set(rootObjectDeclarations.map(({ itemType }) => itemType))).toEqual(
      new Set(TopLevelMetadataItemRules.map(({ itemType }) => itemType)),
    )
    expect(rootObjectDeclarations).toHaveLength(47)
  })

  it("uses unique stable identities and project-relative file paths", () => {
    expect(unique(rootObjectDeclarations.map(({ key }) => key))).toBe(true)
    expect(unique(rootObjectDeclarations.map(({ name }) => name))).toBe(true)

    for (const declaration of rootObjectDeclarations) {
      const paths = declaration.changes.map(({ path }) => path)
      expect(unique(paths), declaration.key).toBe(true)
      for (const path of paths) {
        expect(isAbsolute(path), path).toBe(false)
        expect(path.split("/")).not.toContain("..")
        expect(path).not.toContain("\\")
      }
    }
  })
})

function unique(values: readonly string[]): boolean {
  return new Set(values).size === values.length
}
