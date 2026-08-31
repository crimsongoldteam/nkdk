import { describe, expect, it } from "vitest"
import { ownerMetadataProjectPath } from "./ownerCache"

describe("ownerMetadataProjectPath", () => {
  it.each([
    ["cf", "cf/Документ/Продажа/Свойства.yaml"],
    ["cfe/дкз", "cfe/дкз/Документ/Продажа/Свойства.yaml"],
  ])("builds a project path for %s", (componentPath, expected) => {
    expect(ownerMetadataProjectPath(componentPath, { kind: "Документ", name: "Продажа" }))
      .toBe(expected)
  })

  it("rejects a component path outside the project", () => {
    expect(() => ownerMetadataProjectPath("../cf", { kind: "Документ", name: "Продажа" }))
      .toThrow("Путь находится вне NKDK-проекта")
  })
})
