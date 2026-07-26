import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { componentPath, parseComponentPath } from "./address"
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

  it("parses configuration and extension paths", () => {
    expect(parseComponentPath("cf")).toEqual({ kind: "configuration" })
    expect(parseComponentPath("cfe/Расширение_All")).toEqual({
      kind: "configurationExtension",
      name: "Расширение_All",
    })
  })

  it.each(["cfe", "cfe/a/b", "cfe/", "cfe\\Дополнение"])(
    "rejects an invalid component path %j",
    (path) => {
      expect(() => parseComponentPath(path)).toThrow()
    }
  )
})
