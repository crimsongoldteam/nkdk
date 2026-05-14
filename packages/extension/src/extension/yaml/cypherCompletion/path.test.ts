import { describe, expect, it } from "vitest"

import {
  graphIdToYamlReference,
  parseTopLevelPropertiesPath,
  projectGraphName,
  scopeIdFromOwner,
} from "./path"

describe("parseTopLevelPropertiesPath", () => {
  it("parses top-level catalog properties path", () => {
    expect(
      parseTopLevelPropertiesPath(
        "/Users/nikita/git/erp_nkdk/Справочник/АктыОтбораПробЗЕРНО/Свойства.yaml",
      ),
    ).toEqual({
      projectPath: "/Users/nikita/git/erp_nkdk",
      dir: "Справочник",
      name: "АктыОтбораПробЗЕРНО",
    })
  })
})

describe("scopeIdFromOwner", () => {
  it("builds catalog owner scope id", () => {
    expect(scopeIdFromOwner({ dir: "Справочник", name: "АктыОтбораПробЗЕРНО" })).toBe(
      "Справочник.АктыОтбораПробЗЕРНО",
    )
  })
})

describe("projectGraphName", () => {
  it("builds CLI-compatible graph name", () => {
    expect(projectGraphName("/Users/nikita/git/erp_nkdk")).toMatch(/^nkdk_[0-9a-f]{12}$/)
  })
})

describe("graphIdToYamlReference", () => {
  it("converts catalog form graph id to yaml reference", () => {
    expect(graphIdToYamlReference("Справочник.АктыОтбораПробЗЕРНО.Форма.ФормаВыбора")).toBe(
      "Catalog.АктыОтбораПробЗЕРНО.Form.ФормаВыбора",
    )
  })
})
