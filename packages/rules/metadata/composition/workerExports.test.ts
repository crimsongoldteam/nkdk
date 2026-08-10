import { describe, expect, it } from "vitest"

describe("worker package exports", () => {
  it.each([
    ["generic", "generic.ts"],
    ["prepared-yaml", "preparedYamlProject.ts"],
    ["import", "importFromXml.ts"],
    ["sync", "fullSyncToXml.ts"],
  ])("resolves @nkdk/rules/workers/%s", (name, fileName) => {
    expect(import.meta.resolve(`@nkdk/rules/workers/${name}`)).toMatch(
      new RegExp(`/metadata/composition/workers/${fileName}$`),
    )
  })
})
