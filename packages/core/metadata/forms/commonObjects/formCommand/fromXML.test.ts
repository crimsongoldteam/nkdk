import { describe, expect, it } from "vitest"
import {
  fullFormCommands,
  minimalFormCommandsFromXML,
} from "~/metadata/forms/commonObjects/formCommand/__fixtures__/data"
import { importPropertyFromXML, PropertyRule } from "~/metadata/orchestration"
import { mockContextFromXML } from "~/tests/mockContext"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"

import "./types"

const rule: PropertyRule = {
  type: "FormCommands",
  yaml: "Команды",
  defaultValue: [],
}

describe("import FormCommands from XML", () => {
  it("should return empty array for undefined input", () => {
    const result = importPropertyFromXML({
      context: mockContextFromXML(),
      rule,
      value: undefined,
    })

    expect(result).toEqual([])
  })

  it("should import full.xml", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "full.xml",
      xmlRootTag: "Commands",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(fullFormCommands)
  })

  it("should import minimal.xml", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "minimal.xml",
      xmlRootTag: "Commands",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(minimalFormCommandsFromXML)
  })
})
