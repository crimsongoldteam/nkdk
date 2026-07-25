import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { componentPath } from "./address"
import { configurationIndexPath } from "../configurationIndex/fileIO"

describe("component address", () => {
  it("maps supported component addresses to stable paths", () => {
    expect(componentPath({ kind: "configuration" })).toBe("cf")
    expect(componentPath({ kind: "configurationExtension", name: "Расширение_All" })).toBe("cfe/Расширение_All")
    expect(componentPath({ kind: "externalReport", name: "Отчёт" })).toBe("erf/Отчёт")
    expect(componentPath({ kind: "externalDataProcessor", name: "Обработка" })).toBe("epf/Обработка")
  })

  it.each(["", "..", "with/slash", "with\\slash", "/absolute"]) (
    "rejects an unsafe component name %j",
    (name) => {
      expect(() => componentPath({ kind: "configurationExtension", name })).toThrow()
    }
  )

  it("places indexes under the addressed component", () => {
    const projectDir = "/project"

    expect(configurationIndexPath(projectDir, { kind: "configuration" })).toBe(
      join(projectDir, ".nkdk", "components", "cf", "configuration-index.bin")
    )
    expect(configurationIndexPath(projectDir, { kind: "configurationExtension", name: "Расширение_All" })).toBe(
      join(projectDir, ".nkdk", "components", "cfe", "Расширение_All", "configuration-index.bin")
    )
  })
})
